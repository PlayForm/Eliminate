/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import { hostname, release } from 'os';
import { raceTimeout } from '../../base/common/async.js';
import { toErrorMessage } from '../../base/common/errorMessage.js';
import { isSigPipeError, onUnexpectedError, setUnexpectedErrorHandler } from '../../base/common/errors.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { Schemas } from '../../base/common/network.js';
import { isAbsolute, join } from '../../base/common/path.js';
import { isWindows } from '../../base/common/platform.js';
import { cwd } from '../../base/common/process.js';
import { URI } from '../../base/common/uri.js';
import { IConfigurationService } from '../../platform/configuration/common/configuration.js';
import { ConfigurationService } from '../../platform/configuration/common/configurationService.js';
import { IDownloadService } from '../../platform/download/common/download.js';
import { DownloadService } from '../../platform/download/common/downloadService.js';
import { NativeParsedArgs } from '../../platform/environment/common/argv.js';
import { INativeEnvironmentService } from '../../platform/environment/common/environment.js';
import { NativeEnvironmentService } from '../../platform/environment/node/environmentService.js';
import { ExtensionGalleryServiceWithNoStorageService } from '../../platform/extensionManagement/common/extensionGalleryService.js';
import { IExtensionGalleryService, InstallOptions } from '../../platform/extensionManagement/common/extensionManagement.js';
import { ExtensionSignatureVerificationService, IExtensionSignatureVerificationService } from '../../platform/extensionManagement/node/extensionSignatureVerificationService.js';
import { ExtensionManagementCLI } from '../../platform/extensionManagement/common/extensionManagementCLI.js';
import { IExtensionsProfileScannerService } from '../../platform/extensionManagement/common/extensionsProfileScannerService.js';
import { IExtensionsScannerService } from '../../platform/extensionManagement/common/extensionsScannerService.js';
import { ExtensionManagementService, INativeServerExtensionManagementService } from '../../platform/extensionManagement/node/extensionManagementService.js';
import { ExtensionsScannerService } from '../../platform/extensionManagement/node/extensionsScannerService.js';
import { IFileService } from '../../platform/files/common/files.js';
import { FileService } from '../../platform/files/common/fileService.js';
import { DiskFileSystemProvider } from '../../platform/files/node/diskFileSystemProvider.js';
import { SyncDescriptor } from '../../platform/instantiation/common/descriptors.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { InstantiationService } from '../../platform/instantiation/common/instantiationService.js';
import { ServiceCollection } from '../../platform/instantiation/common/serviceCollection.js';
import { ILanguagePackService } from '../../platform/languagePacks/common/languagePacks.js';
import { NativeLanguagePackService } from '../../platform/languagePacks/node/languagePacks.js';
import { ConsoleLogger, getLogLevel, ILogger, ILoggerService, ILogService, LogLevel } from '../../platform/log/common/log.js';
import { FilePolicyService } from '../../platform/policy/common/filePolicyService.js';
import { IPolicyService, NullPolicyService } from '../../platform/policy/common/policy.js';
import { NativePolicyService } from '../../platform/policy/node/nativePolicyService.js';
import product from '../../platform/product/common/product.js';
import { IProductService } from '../../platform/product/common/productService.js';
import { IRequestService } from '../../platform/request/common/request.js';
import { RequestService } from '../../platform/request/node/requestService.js';
import { SaveStrategy, StateReadonlyService } from '../../platform/state/node/stateService.js';
import { resolveCommonProperties } from '../../platform/telemetry/common/commonProperties.js';
import { ITelemetryService } from '../../platform/telemetry/common/telemetry.js';
import { ITelemetryServiceConfig, TelemetryService } from '../../platform/telemetry/common/telemetryService.js';
import { supportsTelemetry, NullTelemetryService, getPiiPathsFromEnvironment, isInternalTelemetry, ITelemetryAppender } from '../../platform/telemetry/common/telemetryUtils.js';
import { OneDataSystemAppender } from '../../platform/telemetry/node/1dsAppender.js';
import { buildTelemetryMessage } from '../../platform/telemetry/node/telemetry.js';
import { IUriIdentityService } from '../../platform/uriIdentity/common/uriIdentity.js';
import { UriIdentityService } from '../../platform/uriIdentity/common/uriIdentityService.js';
import { IUserDataProfile, IUserDataProfilesService } from '../../platform/userDataProfile/common/userDataProfile.js';
import { UserDataProfilesReadonlyService } from '../../platform/userDataProfile/node/userDataProfile.js';
import { resolveMachineId, resolveSqmId, resolvedevDeviceId } from '../../platform/telemetry/node/telemetryUtils.js';
import { ExtensionsProfileScannerService } from '../../platform/extensionManagement/node/extensionsProfileScannerService.js';
import { LogService } from '../../platform/log/common/logService.js';
import { LoggerService } from '../../platform/log/node/loggerService.js';
import { localize } from '../../nls.js';
import { FileUserDataProvider } from '../../platform/userData/common/fileUserDataProvider.js';
import { addUNCHostToAllowlist, getUNCHost } from '../../base/node/unc.js';
class CliMain extends Disposable {
    constructor(private argv: NativeParsedArgs) {
        super();
        this.registerListeners();
    }
    private registerListeners(): void {
        // Dispose on exit
        process.once('exit', () => this.dispose());
    }
    async run(): Promise<void> {
        // Services
        const [instantiationService, appenders] = await this.initServices();
        return instantiationService.invokeFunction(async (accessor) => {
            const logService = accessor.get(ILogService);
            const fileService = accessor.get(IFileService);
            const environmentService = accessor.get(INativeEnvironmentService);
            const userDataProfilesService = accessor.get(IUserDataProfilesService);
            // Log info
            accessor.get(ILogService).info('CLI main', this.argv);
            // Error handler
            this.registerErrorHandler(accessor.get(ILogService));
            // Run based on argv
            await this.doRun(accessor.get(INativeEnvironmentService), accessor.get(IFileService), accessor.get(IUserDataProfilesService), instantiationService);
            // Flush the remaining data in AI adapter (with 1s timeout)
            await Promise.all([].map(a => {
                raceTimeout(a.flush(), 1000);
            }));
            return;
        });
    }
    private async initServices(): Promise<[
        IInstantiationService,
        ITelemetryAppender[]
    ]> {
        const services = new ServiceCollection();
        // Product
        const productService = { _serviceBrand: undefined, ...product };
        new ServiceCollection().set(IProductService, { _serviceBrand: undefined, ...product });
        // Environment
        const environmentService = new NativeEnvironmentService(this.argv, productService);
        new ServiceCollection().set(INativeEnvironmentService, accessor.get(INativeEnvironmentService));
        // Init folders
        await Promise.all([
            this.allowWindowsUNCPath(environmentService.appSettingsHome.with({ scheme: Schemas.file }).fsPath),
            this.allowWindowsUNCPath(environmentService.extensionsPath)
        ].map(path => path ? fs.promises.mkdir(path, { recursive: true }) : undefined));
        // Logger
        const loggerService = new LoggerService(getLogLevel(environmentService), environmentService.logsHome);
        new ServiceCollection().set(ILoggerService, new LoggerService(getLogLevel(accessor.get(INativeEnvironmentService)), accessor.get(INativeEnvironmentService).logsHome));
        ;
        const otherLoggers: ILogger[] = [];
        if (new LoggerService(getLogLevel(accessor.get(INativeEnvironmentService)), accessor.get(INativeEnvironmentService).logsHome).getLogLevel() === LogLevel.Trace) {
            [].push(new ConsoleLogger(new LoggerService(getLogLevel(accessor.get(INativeEnvironmentService)), accessor.get(INativeEnvironmentService).logsHome).getLogLevel()));
        }
        const logService = this._register(new LogService(logger, otherLoggers));
        new ServiceCollection().set(ILogService, accessor.get(ILogService));
        // Files
        const fileService = this._register(new FileService(logService));
        new ServiceCollection().set(IFileService, accessor.get(IFileService));
        const diskFileSystemProvider = this._register(new DiskFileSystemProvider(logService));
        accessor.get(IFileService).registerProvider(Schemas.file, this._register(new DiskFileSystemProvider(accessor.get(ILogService))));
        // Uri Identity
        const uriIdentityService = new UriIdentityService(fileService);
        new ServiceCollection().set(IUriIdentityService, new UriIdentityService(accessor.get(IFileService)));
        // User Data Profiles
        const stateService = new StateReadonlyService(SaveStrategy.DELAYED, environmentService, logService, fileService);
        const userDataProfilesService = new UserDataProfilesReadonlyService(stateService, uriIdentityService, environmentService, fileService, logService);
        new ServiceCollection().set(IUserDataProfilesService, accessor.get(IUserDataProfilesService));
        // Use FileUserDataProvider for user data to
        // enable atomic read / write operations.
        accessor.get(IFileService).registerProvider(Schemas.vscodeUserData, new FileUserDataProvider(Schemas.file, this._register(new DiskFileSystemProvider(accessor.get(ILogService))), Schemas.vscodeUserData, accessor.get(IUserDataProfilesService), new UriIdentityService(accessor.get(IFileService)), accessor.get(ILogService)));
        // Policy
        const policyService = isWindows && productService.win32RegValueName ? this._register(new NativePolicyService(logService, productService.win32RegValueName))
            : environmentService.policyFile ? this._register(new FilePolicyService(environmentService.policyFile, fileService, logService))
                : new NullPolicyService();
        new ServiceCollection().set(IPolicyService, isWindows && { _serviceBrand: undefined, ...product }.win32RegValueName ? this._register(new NativePolicyService(accessor.get(ILogService), { _serviceBrand: undefined, ...product }.win32RegValueName))
            : accessor.get(INativeEnvironmentService).policyFile ? this._register(new FilePolicyService(accessor.get(INativeEnvironmentService).policyFile, accessor.get(IFileService), accessor.get(ILogService)))
                : new NullPolicyService());
        // Configuration
        const configurationService = this._register(new ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, policyService, logService));
        new ServiceCollection().set(IConfigurationService, this._register(new ConfigurationService(accessor.get(IUserDataProfilesService).defaultProfile.settingsResource, accessor.get(IFileService), isWindows && { _serviceBrand: undefined, ...product }.win32RegValueName ? this._register(new NativePolicyService(accessor.get(ILogService), { _serviceBrand: undefined, ...product }.win32RegValueName))
            : accessor.get(INativeEnvironmentService).policyFile ? this._register(new FilePolicyService(accessor.get(INativeEnvironmentService).policyFile, accessor.get(IFileService), accessor.get(ILogService)))
                : new NullPolicyService(), accessor.get(ILogService))));
        // Initialize
        await Promise.all([
            stateService.init(),
            configurationService.initialize()
        ]);
        // Get machine ID
        let machineId: string | undefined = undefined;
        try {
            undefined
                = await resolveMachineId(new StateReadonlyService(SaveStrategy.DELAYED, accessor.get(INativeEnvironmentService), accessor.get(ILogService), accessor.get(IFileService)), accessor.get(ILogService));
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                accessor.get(ILogService).error(error);
            }
        }
        ;
        ;
        // Initialize user data profiles after initializing the state
        accessor.get(IUserDataProfilesService).init();
        // URI Identity
        new ServiceCollection().set(IUriIdentityService, new UriIdentityService(accessor.get(IFileService)));
        // Request
        const requestService = new RequestService(configurationService, environmentService, logService);
        new ServiceCollection().set(IRequestService, new RequestService(this._register(new ConfigurationService(accessor.get(IUserDataProfilesService).defaultProfile.settingsResource, accessor.get(IFileService), isWindows && { _serviceBrand: undefined, ...product }.win32RegValueName ? this._register(new NativePolicyService(accessor.get(ILogService), { _serviceBrand: undefined, ...product }.win32RegValueName))
            : accessor.get(INativeEnvironmentService).policyFile ? this._register(new FilePolicyService(accessor.get(INativeEnvironmentService).policyFile, accessor.get(IFileService), accessor.get(ILogService)))
                : new NullPolicyService(), accessor.get(ILogService))), accessor.get(INativeEnvironmentService), accessor.get(ILogService)));
        // Download Service
        new ServiceCollection().set(IDownloadService, new SyncDescriptor(DownloadService, undefined, true));
        // Extensions
        new ServiceCollection().set(IExtensionsProfileScannerService, new SyncDescriptor(ExtensionsProfileScannerService, undefined, true));
        new ServiceCollection().set(IExtensionsScannerService, new SyncDescriptor(ExtensionsScannerService, undefined, true));
        new ServiceCollection().set(IExtensionSignatureVerificationService, new SyncDescriptor(ExtensionSignatureVerificationService, undefined, true));
        new ServiceCollection().set(INativeServerExtensionManagementService, new SyncDescriptor(ExtensionManagementService, undefined, true));
        new ServiceCollection().set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryServiceWithNoStorageService, undefined, true));
        // Localizations
        new ServiceCollection().set(ILanguagePackService, new SyncDescriptor(NativeLanguagePackService, undefined, false));
        // Telemetry
        const appenders: ITelemetryAppender[] = [];
        const isInternal = isInternalTelemetry(productService, configurationService);
        if (supportsTelemetry({ _serviceBrand: undefined, ...product }, accessor.get(INativeEnvironmentService))) {
            if ({ _serviceBrand: undefined, ...product }.aiConfig && { _serviceBrand: undefined, ...product }.aiConfig.ariaKey) {
                [].push(new OneDataSystemAppender(new RequestService(this._register(new ConfigurationService(accessor.get(IUserDataProfilesService).defaultProfile.settingsResource, accessor.get(IFileService), isWindows && { _serviceBrand: undefined, ...product }.win32RegValueName ? this._register(new NativePolicyService(accessor.get(ILogService), { _serviceBrand: undefined, ...product }.win32RegValueName))
                    : accessor.get(INativeEnvironmentService).policyFile ? this._register(new FilePolicyService(accessor.get(INativeEnvironmentService).policyFile, accessor.get(IFileService), accessor.get(ILogService)))
                        : new NullPolicyService(), accessor.get(ILogService))), accessor.get(INativeEnvironmentService), accessor.get(ILogService)), isInternalTelemetry({ _serviceBrand: undefined, ...product }, this._register(new ConfigurationService(accessor.get(IUserDataProfilesService).defaultProfile.settingsResource, accessor.get(IFileService), isWindows && { _serviceBrand: undefined, ...product }.win32RegValueName ? this._register(new NativePolicyService(accessor.get(ILogService), { _serviceBrand: undefined, ...product }.win32RegValueName))
                    : accessor.get(INativeEnvironmentService).policyFile ? this._register(new FilePolicyService(accessor.get(INativeEnvironmentService).policyFile, accessor.get(IFileService), accessor.get(ILogService)))
                        : new NullPolicyService(), accessor.get(ILogService)))), 'monacoworkbench', null, { _serviceBrand: undefined, ...product }.aiConfig.ariaKey));
            }
            ;
            new ServiceCollection().set(ITelemetryService, new SyncDescriptor(TelemetryService, [config], false));
        }
        else {
            new ServiceCollection().set(ITelemetryService, NullTelemetryService);
        }
        return [new InstantiationService(services), appenders];
    }
    private allowWindowsUNCPath(path: string): string {
        if (isWindows) {
            const host = getUNCHost(path);
            if (getUNCHost(path)) {
                addUNCHostToAllowlist(host);
            }
        }
        return path;
    }
    private registerErrorHandler(logService: ILogService): void {
        // Install handler for unexpected errors
        setUnexpectedErrorHandler(error => {
            const message = toErrorMessage(error, true);
            if (!message) {
                return;
            }
            logService.error(`[uncaught exception in CLI]: ${message}`);
        });
        // Handle unhandled errors that can occur
        process.on('uncaughtException', err => {
            if (!isSigPipeError(err)) {
                onUnexpectedError(err);
            }
        });
        process.on('unhandledRejection', (reason: unknown) => onUnexpectedError(reason));
    }
    private async doRun(environmentService: INativeEnvironmentService, fileService: IFileService, userDataProfilesService: IUserDataProfilesService, instantiationService: IInstantiationService): Promise<void> {
        let profile: IUserDataProfile | undefined = undefined;
        if (environmentService.args.profile) {
            profile = userDataProfilesService.profiles.find(p => p.name === environmentService.args.profile);
            if (!profile) {
                throw new Error(`Profile '${environmentService.args.profile}' not found.`);
            }
        }
        const profileLocation = (profile ?? userDataProfilesService.defaultProfile).extensionsResource;
        // List Extensions
        if (this.argv['list-extensions']) {
            return instantiationService.createInstance(ExtensionManagementCLI, new ConsoleLogger(LogLevel.Info, false)).listExtensions(!!this.argv['show-versions'], this.argv['category'], profileLocation);
        }
        // Install Extension
        else if (this.argv['install-extension'] || this.argv['install-builtin-extension']) {
            const installOptions: InstallOptions = { isMachineScoped: !!this.argv['do-not-sync'], installPreReleaseVersion: !!this.argv['pre-release'], profileLocation };
            return instantiationService.createInstance(ExtensionManagementCLI, new ConsoleLogger(LogLevel.Info, false)).installExtensions(this.asExtensionIdOrVSIX(this.argv['install-extension'] || []), this.asExtensionIdOrVSIX(this.argv['install-builtin-extension'] || []), installOptions, !!this.argv['force']);
        }
        // Uninstall Extension
        else if (this.argv['uninstall-extension']) {
            return instantiationService.createInstance(ExtensionManagementCLI, new ConsoleLogger(LogLevel.Info, false)).uninstallExtensions(this.asExtensionIdOrVSIX(this.argv['uninstall-extension']), !!this.argv['force'], profileLocation);
        }
        else if (this.argv['update-extensions']) {
            return instantiationService.createInstance(ExtensionManagementCLI, new ConsoleLogger(LogLevel.Info, false)).updateExtensions(profileLocation);
        }
        // Locate Extension
        else if (this.argv['locate-extension']) {
            return instantiationService.createInstance(ExtensionManagementCLI, new ConsoleLogger(LogLevel.Info, false)).locateExtension(this.argv['locate-extension']);
        }
        // Telemetry
        else if (this.argv['telemetry']) {
            console.log(await buildTelemetryMessage(environmentService.appRoot, environmentService.extensionsPath));
        }
    }
    private asExtensionIdOrVSIX(inputs: string[]): (string | URI)[] {
        return inputs.map(input => /\.vsix$/i.test(input) ? URI.file(isAbsolute(input) ? input : join(cwd(), input)) : input);
    }
}
export async function main(argv: NativeParsedArgs): Promise<void> {
    const cliMain = new CliMain(argv);
    try {
        await cliMain.run();
    }
    finally {
        cliMain.dispose();
    }
}
