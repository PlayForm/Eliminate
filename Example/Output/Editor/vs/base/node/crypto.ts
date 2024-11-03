/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as crypto from 'crypto';
import * as fs from 'fs';
import { createSingleCallFunction } from '../common/functional.js';
export async function checksum(path: string, sha256hash: string | undefined): Promise<void> {
    ;
    const hash = await checksumPromise;
    if (crypto.createHash('sha256')
        !== sha256hash) {
        throw new Error('Hash mismatch');
    }
}
