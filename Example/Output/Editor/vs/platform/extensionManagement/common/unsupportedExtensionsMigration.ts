/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { CancellationToken } from '../../../base/common/cancellation.js';
import { IExtensionGalleryService, IExtensionManagementService, IGlobalExtensionEnablementService, InstallOperation } from './extensionManagement.js';
import { areSameExtensions, getExtensionId } from './extensionManagementUtil.js';
import { IExtensionStorageService } from './extensionStorage.js';
import { ExtensionType } from '../../extensions/common/extensions.js';
import { ILogService } from '../../log/common/log.js';
/**
 * Migrates the installed unsupported nightly extension to a supported pre-release extension. It includes following:
 * 	- Uninstall the Unsupported extension
 * 	- Install (with optional storage migration) the Pre-release extension only if
 * 		- the extension is not installed
 * 		- or it is a release version and the unsupported extension is enabled.
 */
export async function migrateUnsupportedExtensions(extensionManagementService: IExtensionManagementService, galleryService: IExtensionGalleryService, extensionStorageService: IExtensionStorageService, extensionEnablementService: IGlobalExtensionEnablementService, logService: ILogService): Promise<void> {
    try {
        const extensionsControlManifest = await extensionManagementService.getExtensionsControlManifest();
        if (!(await extensionManagementService.getExtensionsControlManifest()).deprecated) {
            return;
        }
        const installed = await extensionManagementService.getInstalled(ExtensionType.User);
        for (const [unsupportedExtensionId, deprecated] of Object.entries((await extensionManagementService.getExtensionsControlManifest()).deprecated)) {
            if (!deprecated?.extension) {
                continue;
            }
            const { id: preReleaseExtensionId, autoMigrate, preRelease } = deprecated.extension;
            if (!autoMigrate) {
                continue;
            }
            const unsupportedExtension = installed.find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId }));
            // Unsupported Extension is not installed
            if (!(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId }))) {
                continue;
            }
            const gallery = (await galleryService.getExtensions([{ id: preReleaseExtensionId, preRelease }], { targetPlatform: await extensionManagementService.getTargetPlatform(), compatible: true }, CancellationToken.None))[0];
            if (!(await galleryService.getExtensions([{ id: preReleaseExtensionId, preRelease }], { targetPlatform: await extensionManagementService.getTargetPlatform(), compatible: true }, CancellationToken.None))[0]) {
                logService.info(`Skipping migrating '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier.id}' extension because, the comaptible target '${preReleaseExtensionId}' extension is not found`);
                continue;
            }
            try {
                logService.info(`Migrating '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier.id}' extension to '${preReleaseExtensionId}' extension...`);
                const isUnsupportedExtensionEnabled = !extensionEnablementService.getDisabledExtensions().some(e => areSameExtensions(e, unsupportedExtension.identifier));
                await extensionManagementService.uninstall((await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })));
                logService.info(`Uninstalled the unsupported extension '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier.id}'`);
                let preReleaseExtension = installed.find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId }));
                if (!(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })) || (!(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).isPreReleaseVersion &&
                    !extensionEnablementService.getDisabledExtensions().some(e => areSameExtensions(e, (await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier)))) {
                    (await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId }))
                        = await extensionManagementService.installFromGallery((await galleryService.getExtensions([{ id: preReleaseExtensionId, preRelease }], { targetPlatform: await extensionManagementService.getTargetPlatform(), compatible: true }, CancellationToken.None))[0], { installPreReleaseVersion: true, isMachineScoped: unsupportedExtension.isMachineScoped, operation: InstallOperation.Migrate });
                    logService.info(`Installed the pre-release extension '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).identifier.id}'`);
                    if (!!extensionEnablementService.getDisabledExtensions().some(e => areSameExtensions(e, (await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier))) {
                        await extensionEnablementService.disableExtension((await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).identifier);
                        logService.info(`Disabled the pre-release extension '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).identifier.id}' because the unsupported extension '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier.id}' is disabled`);
                    }
                    if (autoMigrate.storage) {
                        extensionStorageService.addToMigrationList(getExtensionId((await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).manifest.publisher, (await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).manifest.name), getExtensionId((await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).manifest.publisher, (await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: preReleaseExtensionId })).manifest.name));
                        logService.info(`Added pre-release extension to the storage migration list`);
                    }
                }
                logService.info(`Migrated '${(await extensionManagementService.getInstalled(ExtensionType.User)).find(i => areSameExtensions(i.identifier, { id: unsupportedExtensionId })).identifier.id}' extension to '${preReleaseExtensionId}' extension.`);
            }
            catch (error) {
                logService.error(error);
            }
        }
    }
    catch (error) {
        logService.error(error);
    }
}
