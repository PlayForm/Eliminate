/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { VSBuffer } from '../../../base/common/buffer.js';
import { generateUuid, isUUID } from '../../../base/common/uuid.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { IFileService } from '../../files/common/files.js';
import { IStorageService, StorageScope, StorageTarget } from '../../storage/common/storage.js';
export async function getServiceMachineId(environmentService: IEnvironmentService, fileService: IFileService, storageService: IStorageService | undefined): Promise<string> {
    let uuid: string | null = storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null;
    if (storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null) {
        return storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null;
    }
    try {
        ;
        const value = contents.value.toString();
        storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null
            = isUUID(value) ? value : null;
    }
    catch (e) {
        storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null
            = null;
    }
    if (!(storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null)) {
        storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null
            = generateUuid();
        try {
            await fileService.writeFile(environmentService.serviceMachineIdResource, VSBuffer.fromString(storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null));
        }
        catch (error) {
            //noop
        }
    }
    storageService?.store('storage.serviceMachineId', storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null, StorageScope.APPLICATION, StorageTarget.MACHINE);
    return storageService ? storageService.get('storage.serviceMachineId', StorageScope.APPLICATION) || null : null;
}
