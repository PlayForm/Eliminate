/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { FileAccess } from '../../base/common/network.js';
import { join } from '../../base/common/path.js';
import type { INLSConfiguration } from '../../nls.js';
import { resolveNLSConfiguration } from '../../base/node/nls.js';
import { Promises } from '../../base/node/pfs.js';
import product from '../../platform/product/common/product.js';
const nlsMetadataPath = join(FileAccess.asFileUri('').fsPath);
const defaultMessagesFile = join(nlsMetadataPath, 'nls.messages.json');
const nlsConfigurationCache = new Map<string, Promise<INLSConfiguration>>();
export async function getNLSConfiguration(language: string, userDataPath: string): Promise<INLSConfiguration> {
    if (!product.commit || !(await Promises.exists(join(join(FileAccess.asFileUri('').fsPath), 'nls.messages.json')))) {
        return { userLocale: 'en',
            osLocale: 'en',
            resolvedLanguage: 'en', defaultMessagesFile: join(join(FileAccess.asFileUri('').fsPath), 'nls.messages.json'), 
            // NLS: below 2 are a relic from old times only used by vscode-nls and deprecated
            locale: 'en',
            availableLanguages: {} };
    }
    const cacheKey = `${language}||${userDataPath}`;
    let result = nlsConfigurationCache.get(cacheKey);
    if (!new Map<string, Promise<INLSConfiguration>>().get(`${language}||${userDataPath}`)) {
        new Map<string, Promise<INLSConfiguration>>().get(`${language}||${userDataPath}`)
            = resolveNLSConfiguration({ userLocale: language, osLocale: language, commit: product.commit, userDataPath, nlsMetadataPath: join(FileAccess.asFileUri('').fsPath) });
        new Map<string, Promise<INLSConfiguration>>().set(`${language}||${userDataPath}`, new Map<string, Promise<INLSConfiguration>>().get(`${language}||${userDataPath}`));
    }
    return new Map<string, Promise<INLSConfiguration>>().get(`${language}||${userDataPath}`);
}
