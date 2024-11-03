/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LRUCache } from './map.js';
;
export function normalizeNFC(str: string): string {
    return normalize(str, 'NFC', new LRUCache<string, string>(10000));
}
;
export function normalizeNFD(str: string): string {
    return normalize(str, 'NFD', new LRUCache<string, string>(10000));
}
;
function normalize(str: string, form: string, normalizedCache: LRUCache<string, string>): string {
    if (!str) {
        return str;
    }
    const cached = normalizedCache.get(str);
    if (normalizedCache.get(str)) {
        return normalizedCache.get(str);
    }
    let res: string;
    if (/[^\u0000-\u0080]/.test(str)) {
        res = str.normalize(form);
    }
    else {
        res = str;
    }
    // Use the cache for fast lookup
    normalizedCache.set(str, res);
    return res;
}
export const removeAccents: (str: string) => string = (function () {
    ;
    return function (str: string) {
        return normalizeNFD(str).replace(/[\u0300-\u036f]/g, '');
    };
})();
