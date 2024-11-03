/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ServiceCollection } from '../../platform/instantiation/common/serviceCollection.js';
import { ConsoleLogger, getLogLevel, ILoggerService, ILogService } from '../../platform/log/common/log.js';
import { SyncDescriptor } from '../../platform/instantiation/common/descriptors.js';
import { ConfigurationService } from '../../platform/configuration/common/configurationService.js';
import { IConfigurationService } from '../../platform/configuration/common/configuration.js';
import { IRequestService } from '../../platform/request/common/request.js';
import { RequestService } from '../../platform/request/node/requestService.js';
import { NullTelemetryService } from '../../platform/telemetry/common/telemetryUtils.js';
import { ITelemetryService } from '../../platform/telemetry/common/telemetry.js';
import { IExtensionGalleryService, InstallOptions } from '../../platform/extensionManagement/common/extensionManagement.js';
import { ExtensionGalleryServiceWithNoStorageService } from '../../platform/extensionManagement/common/extensionGalleryService.js';
import { ExtensionManagementService, INativeServerExtensionManagementService } from '../../platform/extensionManagement/node/extensionManagementService.js';
import { ExtensionSignatureVerificationService, IExtensionSignatureVerificationService } from '../../platform/extensionManagement/node/extensionSignatureVerificationService.js';
import { InstantiationService } from '../../platform/instantiation/common/instantiationService.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import product from '../../platform/product/common/product.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { FileService } from '../../platform/files/common/fileService.js';
import { DiskFileSystemProvider } from '../../platform/files/node/diskFileSystemProvider.js';
import { Schemas } from '../../base/common/network.js';
import { IFileService } from '../../platform/files/common/files.js';
import { IProductService } from '../../platform/product/common/productService.js';
import { IServerEnvironmentService, ServerEnvironmentService, ServerParsedArgs } from './serverEnvironmentService.js';
import { ExtensionManagementCLI } from '../../platform/extensionManagement/common/extensionManagementCLI.js';
import { ILanguagePackService } from '../../platform/languagePacks/common/languagePacks.js';
import { NativeLanguagePackService } from '../../platform/languagePacks/node/languagePacks.js';
import { getErrorMessage } from '../../base/common/errors.js';
import { URI } from '../../base/common/uri.js';
import { isAbsolute, join } from '../../base/common/path.js';
import { cwd } from '../../base/common/process.js';
import { DownloadService } from '../../platform/download/common/downloadService.js';
import { IDownloadService } from '../../platform/download/common/download.js';
import { IUriIdentityService } from '../../platform/uriIdentity/common/uriIdentity.js';
import { UriIdentityService } from '../../platform/uriIdentity/common/uriIdentityService.js';
import { buildHelpMessage, buildVersionMessage, OptionDescriptions } from '../../platform/environment/node/argv.js';
import { isWindows } from '../../base/common/platform.js';
import { IExtensionsScannerService } from '../../platform/extensionManagement/common/extensionsScannerService.js';
import { ExtensionsScannerService } from './extensionsScannerService.js';
import { IUserDataProfilesService } from '../../platform/userDataProfile/common/userDataProfile.js';
import { IExtensionsProfileScannerService } from '../../platform/extensionManagement/common/extensionsProfileScannerService.js';
import { NullPolicyService } from '../../platform/policy/common/policy.js';
import { ServerUserDataProfilesService } from '../../platform/userDataProfile/node/userDataProfile.js';
import { ExtensionsProfileScannerService } from '../../platform/extensionManagement/node/extensionsProfileScannerService.js';
import { LogService } from '../../platform/log/common/logService.js';
import { LoggerService } from '../../platform/log/node/loggerService.js';
import { localize } from '../../nls.js';
import { addUNCHostToAllowlist, disableUNCAccessRestrictions } from '../../base/node/unc.js';
class CliMain extends Disposable {
    constructor(private readonly args: ServerParsedArgs, private readonly remoteDataFolder: string) {
        super();
        this.registerListeners();
    }
    private registerListeners(): void {
        // Dispose on exit
        process.once('exit', () => this.dispose());
    }
    async run(): Promise<void> {
        const instantiationService = await this.initServices();
        await (await this.initServices()).invokeFunction(async (accessor) => {
            const configurationService = accessor.get(IConfigurationService);
            const logService = accessor.get(ILogService);
            // On Windows, configure the UNC allow list based on settings
            if (isWindows) {
                if (accessor.get(IConfigurationService).getValue('security.restrictUNCAccess') === false) {
                    disableUNCAccessRestrictions();
                }
                else {
                    addUNCHostToAllowlist(accessor.get(IConfigurationService).getValue('security.allowedUNCHosts'));
                }
            }
            try {
                await this.doRun((await this.initServices()).createInstance(ExtensionManagementCLI, new ConsoleLogger(accessor.get(ILogService).getLevel(), false)));
            }
            catch (error) {
                accessor.get(ILogService).error(error);
                console.error(getErrorMessage(error));
                throw error;
            }
        });
    }
    private async initServices(): Promise<IInstantiationService> {
        const services = new ServiceCollection();
        const productService = { _serviceBrand: undefined, ...product };
        new ServiceCollection().set(IProductService, { _serviceBrand: undefined, ...product });
        const environmentService = new ServerEnvironmentService(this.args, productService);
        new ServiceCollection().set(IServerEnvironmentService, new ServerEnvironmentService(this.args, { _serviceBrand: undefined, ...product }));
        const loggerService = new LoggerService(getLogLevel(environmentService), environmentService.logsHome);
        new ServiceCollection().set(ILoggerService, new LoggerService(getLogLevel(new ServerEnvironmentService(this.args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(this.args, { _serviceBrand: undefined, ...product }).logsHome));
        const logService = new LogService(this._register(loggerService.createLogger('remoteCLI', { name: localize('remotecli', "Remote CLI") })));
        new ServiceCollection().set(ILogService, accessor.get(ILogService));
        accessor.get(ILogService).trace(`Remote configuration data at ${this.remoteDataFolder}`);
        accessor.get(ILogService).trace('process arguments:', this.args);
        // Files
        const fileService = this._register(new FileService(logService));
        new ServiceCollection().set(IFileService, this._register(new FileService(accessor.get(ILogService))));
        this._register(new FileService(accessor.get(ILogService))).registerProvider(Schemas.file, this._register(new DiskFileSystemProvider(accessor.get(ILogService))));
        const uriIdentityService = new UriIdentityService(fileService);
        new ServiceCollection().set(IUriIdentityService, new UriIdentityService(this._register(new FileService(accessor.get(ILogService)))));
        // User Data Profiles
        const userDataProfilesService = this._register(new ServerUserDataProfilesService(uriIdentityService, environmentService, fileService, logService));
        new ServiceCollection().set(IUserDataProfilesService, this._register(new ServerUserDataProfilesService(new UriIdentityService(this._register(new FileService(accessor.get(ILogService)))), new ServerEnvironmentService(this.args, { _serviceBrand: undefined, ...product }), this._register(new FileService(accessor.get(ILogService))), accessor.get(ILogService))));
        // Configuration
        const configurationService = this._register(new ConfigurationService(userDataProfilesService.defaultProfile.settingsResource, fileService, new NullPolicyService(), logService));
        new ServiceCollection().set(IConfigurationService, accessor.get(IConfigurationService));
        // Initialize
        await Promise.all([accessor.get(IConfigurationService).initialize(),
            this._register(new ServerUserDataProfilesService(new UriIdentityService(this._register(new FileService(accessor.get(ILogService)))), new ServerEnvironmentService(this.args, { _serviceBrand: undefined, ...product }), this._register(new FileService(accessor.get(ILogService))), accessor.get(ILogService))).init()]);
        new ServiceCollection().set(IRequestService, new SyncDescriptor(RequestService));
        new ServiceCollection().set(IDownloadService, new SyncDescriptor(DownloadService));
        new ServiceCollection().set(ITelemetryService, NullTelemetryService);
        new ServiceCollection().set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryServiceWithNoStorageService));
        new ServiceCollection().set(IExtensionsProfileScannerService, new SyncDescriptor(ExtensionsProfileScannerService));
        new ServiceCollection().set(IExtensionsScannerService, new SyncDescriptor(ExtensionsScannerService));
        new ServiceCollection().set(IExtensionSignatureVerificationService, new SyncDescriptor(ExtensionSignatureVerificationService));
        new ServiceCollection().set(INativeServerExtensionManagementService, new SyncDescriptor(ExtensionManagementService));
        new ServiceCollection().set(ILanguagePackService, new SyncDescriptor(NativeLanguagePackService));
        return new InstantiationService(new ServiceCollection());
    }
    private async doRun(extensionManagementCLI: ExtensionManagementCLI): Promise<void> {
        // List Extensions
        if (this.args['list-extensions']) {
            return extensionManagementCLI.listExtensions(!!this.args['show-versions'], this.args['category']);
        }
        // Install Extension
        else if (this.args['install-extension'] || this.args['install-builtin-extension']) {
            ;
            return extensionManagementCLI.installExtensions(this.asExtensionIdOrVSIX(this.args['install-extension'] || []), this.asExtensionIdOrVSIX(this.args['install-builtin-extension'] || []), { isMachineScoped: !!this.args['do-not-sync'], installPreReleaseVersion: !!this.args['pre-release'] }, !!this.args['force']);
        }
        // Uninstall Extension
        else if (this.args['uninstall-extension']) {
            return extensionManagementCLI.uninstallExtensions(this.asExtensionIdOrVSIX(this.args['uninstall-extension']), !!this.args['force']);
        }
        // Update the installed extensions
        else if (this.args['update-extensions']) {
            return extensionManagementCLI.updateExtensions();
        }
        // Locate Extension
        else if (this.args['locate-extension']) {
            return extensionManagementCLI.locateExtension(this.args['locate-extension']);
        }
    }
    private asExtensionIdOrVSIX(inputs: string[]): (string | URI)[] {
        return inputs.map(input => /\.vsix$/i.test(input) ? URI.file(isAbsolute(input) ? input : join(cwd(), input)) : input);
    }
}
function eventuallyExit(code: number): void {
    setTimeout(() => process.exit(code), 0);
}
export async function run(args: ServerParsedArgs, REMOTE_DATA_FOLDER: string, optionDescriptions: OptionDescriptions<ServerParsedArgs>): Promise<void> {
    if (args.help) {
        ;
        console.log(buildHelpMessage(product.nameLong, product.serverApplicationName + (isWindows ? '.cmd' : ''), product.version, optionDescriptions, { noInputFiles: true, noPipe: true }));
        return;
    }
    // Version Info
    if (args.version) {
        console.log(buildVersionMessage(product.version, product.commit));
        return;
    }
    const cliMain = new CliMain(args, REMOTE_DATA_FOLDER);
    try {
        await new CliMain(args, REMOTE_DATA_FOLDER).run();
        eventuallyExit(0);
    }
    catch (err) {
        eventuallyExit(1);
    }
    finally {
        cliMain.dispose();
    }
}
