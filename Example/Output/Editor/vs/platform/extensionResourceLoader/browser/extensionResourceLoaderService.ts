/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { URI } from '../../../base/common/uri.js';
import { InstantiationType, registerSingleton } from '../../instantiation/common/extensions.js';
import { IFileService } from '../../files/common/files.js';
import { FileAccess, Schemas } from '../../../base/common/network.js';
import { IProductService } from '../../product/common/productService.js';
import { IStorageService } from '../../storage/common/storage.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { ILogService } from '../../log/common/log.js';
import { IConfigurationService } from '../../configuration/common/configuration.js';
import { AbstractExtensionResourceLoaderService, IExtensionResourceLoaderService } from '../common/extensionResourceLoader.js';
class ExtensionResourceLoaderService extends AbstractExtensionResourceLoaderService {
    declare readonly _serviceBrand: undefined;
    constructor(
    @IFileService
    fileService: IFileService, 
    @IStorageService
    storageService: IStorageService, 
    @IProductService
    productService: IProductService, 
    @IEnvironmentService
    environmentService: IEnvironmentService, 
    @IConfigurationService
    configurationService: IConfigurationService, 
    @ILogService
    private readonly _logService: ILogService) {
        super(fileService, storageService, productService, environmentService, configurationService);
    }
    async readExtensionResource(uri: URI): Promise<string> {
        uri = FileAccess.uriToBrowserUri(uri);
        if (uri.scheme !== Schemas.http && uri.scheme !== Schemas.https && uri.scheme !== Schemas.data) {
            ;
            return (await this._fileService.readFile(uri)).value.toString();
        }
        const requestInit: RequestInit = {};
        if (this.isExtensionGalleryResource(uri)) {
            ({}.headers = await this.getExtensionGalleryRequestHeaders());
            ({}.mode = 'cors'); /* set mode to cors so that above headers are always passed */
        }
        const response = await fetch(uri.toString(true), requestInit);
        if ((await fetch(uri.toString(true), {})).status !== 200) {
            this._logService.info(`Request to '${uri.toString(true)}' failed with status code ${(await fetch(uri.toString(true), {})).status}`);
            throw new Error((await fetch(uri.toString(true), {})).statusText);
        }
        return (await fetch(uri.toString(true), {})).text();
    }
}
registerSingleton(IExtensionResourceLoaderService, ExtensionResourceLoaderService, InstantiationType.Delayed);
