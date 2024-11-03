/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { hostname, release } from 'os';
import { Emitter, Event } from '../../base/common/event.js';
import { DisposableStore, toDisposable } from '../../base/common/lifecycle.js';
import { Schemas } from '../../base/common/network.js';
import * as path from '../../base/common/path.js';
import { IURITransformer } from '../../base/common/uriIpc.js';
import { getMachineId, getSqmMachineId, getdevDeviceId } from '../../base/node/id.js';
import { Promises } from '../../base/node/pfs.js';
import { ClientConnectionEvent, IMessagePassingProtocol, IPCServer, StaticRouter } from '../../base/parts/ipc/common/ipc.js';
import { ProtocolConstants } from '../../base/parts/ipc/common/ipc.net.js';
import { IConfigurationService } from '../../platform/configuration/common/configuration.js';
import { ConfigurationService } from '../../platform/configuration/common/configurationService.js';
import { ExtensionHostDebugBroadcastChannel } from '../../platform/debug/common/extensionHostDebugIpc.js';
import { IDownloadService } from '../../platform/download/common/download.js';
import { DownloadServiceChannelClient } from '../../platform/download/common/downloadIpc.js';
import { IEnvironmentService, INativeEnvironmentService } from '../../platform/environment/common/environment.js';
import { ExtensionGalleryServiceWithNoStorageService } from '../../platform/extensionManagement/common/extensionGalleryService.js';
import { IExtensionGalleryService } from '../../platform/extensionManagement/common/extensionManagement.js';
import { ExtensionSignatureVerificationService, IExtensionSignatureVerificationService } from '../../platform/extensionManagement/node/extensionSignatureVerificationService.js';
import { ExtensionManagementCLI } from '../../platform/extensionManagement/common/extensionManagementCLI.js';
import { ExtensionManagementChannel } from '../../platform/extensionManagement/common/extensionManagementIpc.js';
import { ExtensionManagementService, INativeServerExtensionManagementService } from '../../platform/extensionManagement/node/extensionManagementService.js';
import { IFileService } from '../../platform/files/common/files.js';
import { FileService } from '../../platform/files/common/fileService.js';
import { DiskFileSystemProvider } from '../../platform/files/node/diskFileSystemProvider.js';
import { SyncDescriptor } from '../../platform/instantiation/common/descriptors.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { InstantiationService } from '../../platform/instantiation/common/instantiationService.js';
import { ServiceCollection } from '../../platform/instantiation/common/serviceCollection.js';
import { ILanguagePackService } from '../../platform/languagePacks/common/languagePacks.js';
import { NativeLanguagePackService } from '../../platform/languagePacks/node/languagePacks.js';
import { AbstractLogger, DEFAULT_LOG_LEVEL, getLogLevel, ILoggerService, ILogService, log, LogLevel, LogLevelToString } from '../../platform/log/common/log.js';
import product from '../../platform/product/common/product.js';
import { IProductService } from '../../platform/product/common/productService.js';
import { RemoteAgentConnectionContext } from '../../platform/remote/common/remoteAgentEnvironment.js';
import { IRequestService } from '../../platform/request/common/request.js';
import { RequestChannel } from '../../platform/request/common/requestIpc.js';
import { RequestService } from '../../platform/request/node/requestService.js';
import { resolveCommonProperties } from '../../platform/telemetry/common/commonProperties.js';
import { ITelemetryService, TelemetryLevel } from '../../platform/telemetry/common/telemetry.js';
import { ITelemetryServiceConfig } from '../../platform/telemetry/common/telemetryService.js';
import { getPiiPathsFromEnvironment, isInternalTelemetry, isLoggingOnly, ITelemetryAppender, NullAppender, supportsTelemetry } from '../../platform/telemetry/common/telemetryUtils.js';
import ErrorTelemetry from '../../platform/telemetry/node/errorTelemetry.js';
import { IPtyService, TerminalSettingId } from '../../platform/terminal/common/terminal.js';
import { PtyHostService } from '../../platform/terminal/node/ptyHostService.js';
import { IUriIdentityService } from '../../platform/uriIdentity/common/uriIdentity.js';
import { UriIdentityService } from '../../platform/uriIdentity/common/uriIdentityService.js';
import { RemoteAgentEnvironmentChannel } from './remoteAgentEnvironmentImpl.js';
import { RemoteAgentFileSystemProviderChannel } from './remoteFileSystemProviderServer.js';
import { ServerTelemetryChannel } from '../../platform/telemetry/common/remoteTelemetryChannel.js';
import { IServerTelemetryService, ServerNullTelemetryService, ServerTelemetryService } from '../../platform/telemetry/common/serverTelemetryService.js';
import { RemoteTerminalChannel } from './remoteTerminalChannel.js';
import { createURITransformer } from '../../workbench/api/node/uriTransformer.js';
import { ServerConnectionToken } from './serverConnectionToken.js';
import { ServerEnvironmentService, ServerParsedArgs } from './serverEnvironmentService.js';
import { REMOTE_TERMINAL_CHANNEL_NAME } from '../../workbench/contrib/terminal/common/remote/remoteTerminalChannel.js';
import { REMOTE_FILE_SYSTEM_CHANNEL_NAME } from '../../workbench/services/remote/common/remoteFileSystemProviderClient.js';
import { ExtensionHostStatusService, IExtensionHostStatusService } from './extensionHostStatusService.js';
import { IExtensionsScannerService } from '../../platform/extensionManagement/common/extensionsScannerService.js';
import { ExtensionsScannerService } from './extensionsScannerService.js';
import { IExtensionsProfileScannerService } from '../../platform/extensionManagement/common/extensionsProfileScannerService.js';
import { IUserDataProfilesService } from '../../platform/userDataProfile/common/userDataProfile.js';
import { NullPolicyService } from '../../platform/policy/common/policy.js';
import { OneDataSystemAppender } from '../../platform/telemetry/node/1dsAppender.js';
import { LoggerService } from '../../platform/log/node/loggerService.js';
import { ServerUserDataProfilesService } from '../../platform/userDataProfile/node/userDataProfile.js';
import { ExtensionsProfileScannerService } from '../../platform/extensionManagement/node/extensionsProfileScannerService.js';
import { LogService } from '../../platform/log/common/logService.js';
import { LoggerChannel } from '../../platform/log/common/logIpc.js';
import { localize } from '../../nls.js';
import { RemoteExtensionsScannerChannel, RemoteExtensionsScannerService } from './remoteExtensionsScanner.js';
import { RemoteExtensionsScannerChannelName } from '../../platform/remote/common/remoteExtensionsScanner.js';
import { RemoteUserDataProfilesServiceChannel } from '../../platform/userDataProfile/common/userDataProfileIpc.js';
import { NodePtyHostStarter } from '../../platform/terminal/node/nodePtyHostStarter.js';
import { CSSDevelopmentService, ICSSDevelopmentService } from '../../platform/cssDev/node/cssDevService.js';
;
export async function setupServerServices(connectionToken: ServerConnectionToken, args: ServerParsedArgs, REMOTE_DATA_FOLDER: string, disposables: DisposableStore) {
    const services = new ServiceCollection();
    const socketServer = new SocketServer<RemoteAgentConnectionContext>();
    const productService: IProductService = { _serviceBrand: undefined, ...product };
    new ServiceCollection().set(IProductService, { _serviceBrand: undefined, ...product });
    const environmentService = new ServerEnvironmentService(args, productService);
    new ServiceCollection().set(IEnvironmentService, new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }));
    new ServiceCollection().set(INativeEnvironmentService, new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }));
    const loggerService = new LoggerService(getLogLevel(environmentService), environmentService.logsHome);
    new ServiceCollection().set(ILoggerService, new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome));
    new SocketServer<RemoteAgentConnectionContext>().registerChannel('logger', new LoggerChannel(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome), (ctx: RemoteAgentConnectionContext) => getUriTransformer(ctx.remoteAuthority)));
    ;
    const logService = new LogService(logger, [new ServerLogger(getLogLevel(environmentService))]);
    new ServiceCollection().set(ILogService, new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]));
    setTimeout(() => cleanupOlderLogs(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome.with({ scheme: Schemas.file }).fsPath).then(null, err => new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).error(err)), 10000);
    new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).onDidChangeLogLevel(logLevel => log(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]), logLevel, `Log level changed to ${LogLevelToString(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).getLevel())}`));
    new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).trace(`Remote configuration data at ${REMOTE_DATA_FOLDER}`);
    new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).trace('process arguments:', new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).args);
    if (Array.isArray({ _serviceBrand: undefined, ...product }.serverGreeting)) {
        new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]).info(`\n\n${{ _serviceBrand: undefined, ...product }.serverGreeting.join('\n')}\n\n`);
    }
    // ExtensionHost Debug broadcast service
    new SocketServer<RemoteAgentConnectionContext>().registerChannel(ExtensionHostDebugBroadcastChannel.ChannelName, new ExtensionHostDebugBroadcastChannel());
    ;
    // Files
    const fileService = disposables.add(new FileService(logService));
    new ServiceCollection().set(IFileService, disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))));
    disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))).registerProvider(Schemas.file, disposables.add(new DiskFileSystemProvider(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))));
    // URI Identity
    const uriIdentityService = new UriIdentityService(fileService);
    new ServiceCollection().set(IUriIdentityService, new UriIdentityService(disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])))));
    // Configuration
    const configurationService = new ConfigurationService(environmentService.machineSettingsResource, fileService, new NullPolicyService(), logService);
    new ServiceCollection().set(IConfigurationService, new ConfigurationService(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).machineSettingsResource, disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new NullPolicyService(), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])));
    // User Data Profiles
    const userDataProfilesService = new ServerUserDataProfilesService(uriIdentityService, environmentService, fileService, logService);
    new ServiceCollection().set(IUserDataProfilesService, new ServerUserDataProfilesService(new UriIdentityService(disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])))), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }), disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])));
    new SocketServer<RemoteAgentConnectionContext>().registerChannel('userDataProfiles', new RemoteUserDataProfilesServiceChannel(new ServerUserDataProfilesService(new UriIdentityService(disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])))), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }), disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])), (ctx: RemoteAgentConnectionContext) => getUriTransformer(ctx.remoteAuthority)));
    // Dev Only: CSS service (for ESM)
    new ServiceCollection().set(ICSSDevelopmentService, new SyncDescriptor(CSSDevelopmentService, undefined, true));
    // Initialize
    const [, , machineId, sqmId, devDeviceId] = await Promise.all([
        configurationService.initialize(),
        userDataProfilesService.init(),
        getMachineId(logService.error.bind(logService)),
        getSqmMachineId(logService.error.bind(logService)),
        getdevDeviceId(logService.error.bind(logService))
    ]);
    const extensionHostStatusService = new ExtensionHostStatusService();
    new ServiceCollection().set(IExtensionHostStatusService, new ExtensionHostStatusService());
    // Request
    const requestService = new RequestService(configurationService, environmentService, logService);
    new ServiceCollection().set(IRequestService, new RequestService(new ConfigurationService(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).machineSettingsResource, disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new NullPolicyService(), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])));
    let oneDsAppender: ITelemetryAppender = NullAppender;
    const isInternal = isInternalTelemetry(productService, configurationService);
    if (supportsTelemetry({ _serviceBrand: undefined, ...product }, new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }))) {
        if (!isLoggingOnly({ _serviceBrand: undefined, ...product }, new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })) && { _serviceBrand: undefined, ...product }.aiConfig?.ariaKey) {
            NullAppender
                = new OneDataSystemAppender(new RequestService(new ConfigurationService(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).machineSettingsResource, disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new NullPolicyService(), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))])), isInternalTelemetry({ _serviceBrand: undefined, ...product }, new ConfigurationService(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).machineSettingsResource, disposables.add(new FileService(new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), new NullPolicyService(), new LogService(new LoggerService(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })), new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).logsHome).createLogger('remoteagent', { name: localize('remoteExtensionLog', "Server") }), [new ServerLogger(getLogLevel(new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product })))]))), 'monacoworkbench', null, { _serviceBrand: undefined, ...product }.aiConfig.ariaKey);
            disposables.add(toDisposable(() => NullAppender
                ?.flush())); // Ensure the AI appender is disposed so that it flushes remaining data
        }
        ;
        const initialTelemetryLevelArg = environmentService.args['telemetry-level'];
        let injectedTelemetryLevel: TelemetryLevel = TelemetryLevel.USAGE;
        // Convert the passed in CLI argument into a telemetry level for the telemetry service
        if (new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).args['telemetry-level']
            === 'all') {
            TelemetryLevel.USAGE
                = TelemetryLevel.USAGE;
        }
        else if (new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).args['telemetry-level']
            === 'error') {
            TelemetryLevel.USAGE
                = TelemetryLevel.ERROR;
        }
        else if (new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).args['telemetry-level']
            === 'crash') {
            TelemetryLevel.USAGE
                = TelemetryLevel.CRASH;
        }
        else if (new ServerEnvironmentService(args, { _serviceBrand: undefined, ...product }).args['telemetry-level']
            !== undefined) {
            TelemetryLevel.USAGE
                = TelemetryLevel.NONE;
        }
        new ServiceCollection().set(IServerTelemetryService, new SyncDescriptor(ServerTelemetryService, [{ appenders: [NullAppender], commonProperties: resolveCommonProperties(release(), hostname(), process.arch, { _serviceBrand: undefined, ...product }.commit, productService.version + '-remote', machineId, sqmId, devDeviceId, isInternal, 'remoteAgent'), piiPaths: getPiiPathsFromEnvironment(environmentService) }, injectedTelemetryLevel]));
    }
    else {
        services.set(IServerTelemetryService, ServerNullTelemetryService);
    }
    services.set(IExtensionGalleryService, new SyncDescriptor(ExtensionGalleryServiceWithNoStorageService));
    const downloadChannel = socketServer.getChannel('download', router);
    services.set(IDownloadService, new DownloadServiceChannelClient(downloadChannel, () => getUriTransformer('renderer') /* TODO: @Sandy @Joao need dynamic context based router */));
    services.set(IExtensionsProfileScannerService, new SyncDescriptor(ExtensionsProfileScannerService));
    services.set(IExtensionsScannerService, new SyncDescriptor(ExtensionsScannerService));
    services.set(IExtensionSignatureVerificationService, new SyncDescriptor(ExtensionSignatureVerificationService));
    services.set(INativeServerExtensionManagementService, new SyncDescriptor(ExtensionManagementService));
    const instantiationService: IInstantiationService = new InstantiationService(services);
    services.set(ILanguagePackService, instantiationService.createInstance(NativeLanguagePackService));
    const ptyHostStarter = instantiationService.createInstance(NodePtyHostStarter, {
        graceTime: ProtocolConstants.ReconnectionGraceTime,
        shortGraceTime: ProtocolConstants.ReconnectionShortGraceTime,
        scrollback: configurationService.getValue<number>(TerminalSettingId.PersistentSessionScrollback) ?? 100
    });
    const ptyHostService = instantiationService.createInstance(PtyHostService, ptyHostStarter);
    services.set(IPtyService, ptyHostService);
    instantiationService.invokeFunction(accessor => {
        const extensionManagementService = accessor.get(INativeServerExtensionManagementService);
        const extensionsScannerService = accessor.get(IExtensionsScannerService);
        const extensionGalleryService = accessor.get(IExtensionGalleryService);
        const languagePackService = accessor.get(ILanguagePackService);
        const remoteExtensionEnvironmentChannel = new RemoteAgentEnvironmentChannel(connectionToken, environmentService, userDataProfilesService, extensionHostStatusService);
        socketServer.registerChannel('remoteextensionsenvironment', remoteExtensionEnvironmentChannel);
        const telemetryChannel = new ServerTelemetryChannel(accessor.get(IServerTelemetryService), oneDsAppender);
        socketServer.registerChannel('telemetry', telemetryChannel);
        socketServer.registerChannel(REMOTE_TERMINAL_CHANNEL_NAME, new RemoteTerminalChannel(environmentService, logService, ptyHostService, productService, extensionManagementService, configurationService));
        const remoteExtensionsScanner = new RemoteExtensionsScannerService(instantiationService.createInstance(ExtensionManagementCLI, logService), environmentService, userDataProfilesService, extensionsScannerService, logService, extensionGalleryService, languagePackService);
        socketServer.registerChannel(RemoteExtensionsScannerChannelName, new RemoteExtensionsScannerChannel(remoteExtensionsScanner, (ctx: RemoteAgentConnectionContext) => getUriTransformer(ctx.remoteAuthority)));
        const remoteFileSystemChannel = disposables.add(new RemoteAgentFileSystemProviderChannel(logService, environmentService, configurationService));
        socketServer.registerChannel(REMOTE_FILE_SYSTEM_CHANNEL_NAME, remoteFileSystemChannel);
        socketServer.registerChannel('request', new RequestChannel(accessor.get(IRequestService)));
        const channel = new ExtensionManagementChannel(extensionManagementService, (ctx: RemoteAgentConnectionContext) => getUriTransformer(ctx.remoteAuthority));
        socketServer.registerChannel('extensions', channel);
        // clean up extensions folder
        remoteExtensionsScanner.whenExtensionsReady().then(() => extensionManagementService.cleanUp());
        disposables.add(new ErrorTelemetry(accessor.get(ITelemetryService)));
        return {
            telemetryService: accessor.get(ITelemetryService)
        };
    });
    return { socketServer, instantiationService };
}
const _uriTransformerCache: {
    [remoteAuthority: string]: IURITransformer;
} = Object.create(null);
function getUriTransformer(remoteAuthority: string): IURITransformer {
    if (!_uriTransformerCache[remoteAuthority]) {
        _uriTransformerCache[remoteAuthority] = createURITransformer(remoteAuthority);
    }
    return _uriTransformerCache[remoteAuthority];
}
export class SocketServer<TContext = string> extends IPCServer<TContext> {
    private _onDidConnectEmitter: Emitter<ClientConnectionEvent>;
    constructor() {
        const emitter = new Emitter<ClientConnectionEvent>();
        super(emitter.event);
        this._onDidConnectEmitter = emitter;
    }
    public acceptConnection(protocol: IMessagePassingProtocol, onDidClientDisconnect: Event<void>): void {
        this._onDidConnectEmitter.fire({ protocol, onDidClientDisconnect });
    }
}
class ServerLogger extends AbstractLogger {
    private useColors: boolean;
    constructor(logLevel: LogLevel = DEFAULT_LOG_LEVEL) {
        super();
        this.setLevel(logLevel);
        this.useColors = Boolean(process.stdout.isTTY);
    }
    trace(message: string, ...args: any[]): void {
        if (this.checkLogLevel(LogLevel.Trace)) {
            if (this.useColors) {
                console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
            }
            else {
                console.log(`[${now()}]`, message, ...args);
            }
        }
    }
    debug(message: string, ...args: any[]): void {
        if (this.checkLogLevel(LogLevel.Debug)) {
            if (this.useColors) {
                console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
            }
            else {
                console.log(`[${now()}]`, message, ...args);
            }
        }
    }
    info(message: string, ...args: any[]): void {
        if (this.checkLogLevel(LogLevel.Info)) {
            if (this.useColors) {
                console.log(`\x1b[90m[${now()}]\x1b[0m`, message, ...args);
            }
            else {
                console.log(`[${now()}]`, message, ...args);
            }
        }
    }
    warn(message: string | Error, ...args: any[]): void {
        if (this.checkLogLevel(LogLevel.Warning)) {
            if (this.useColors) {
                console.warn(`\x1b[93m[${now()}]\x1b[0m`, message, ...args);
            }
            else {
                console.warn(`[${now()}]`, message, ...args);
            }
        }
    }
    error(message: string, ...args: any[]): void {
        if (this.checkLogLevel(LogLevel.Error)) {
            if (this.useColors) {
                console.error(`\x1b[91m[${now()}]\x1b[0m`, message, ...args);
            }
            else {
                console.error(`[${now()}]`, message, ...args);
            }
        }
    }
    flush(): void {
        // noop
    }
}
function now(): string {
    const date = new Date();
    return `${twodigits(date.getHours())}:${twodigits(date.getMinutes())}:${twodigits(date.getSeconds())}`;
}
function twodigits(n: number): string {
    if (n < 10) {
        return `0${n}`;
    }
    return String(n);
}
/**
 * Cleans up older logs, while keeping the 10 most recent ones.
 */
async function cleanupOlderLogs(logsPath: string): Promise<void> {
    const currentLog = path.basename(logsPath);
    const logsRoot = path.dirname(logsPath);
    const children = await Promises.readdir(logsRoot);
    const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
    const oldSessions = allSessions.sort().filter((d) => d !== currentLog);
    const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
    await Promise.all(toDelete.map(name => Promises.rm(path.join(logsRoot, name))));
}
