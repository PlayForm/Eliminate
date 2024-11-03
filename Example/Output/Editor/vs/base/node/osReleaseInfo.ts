/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { constants as FSConstants, promises as FSPromises } from 'fs';
import { createInterface as readLines } from 'readline';
import * as Platform from '../common/platform.js';
type ReleaseInfo = {
    id: string;
    id_like?: string;
    version_id?: string;
};
export async function getOSReleaseInfo(errorLogger: (error: any) => void): Promise<ReleaseInfo | undefined> {
    if (Platform.isMacintosh || Platform.isWindows) {
        return;
    }
    // Extract release information on linux based systems
    // using the identifiers specified in
    // https://www.freedesktop.org/software/systemd/man/os-release.html
    let handle: FSPromises.FileHandle | undefined;
    for (const filePath of ['/etc/os-release', '/usr/lib/os-release', '/etc/lsb-release']) {
        try {
            handle = await FSPromises.open(filePath, FSConstants.R_OK);
            break;
        }
        catch (err) { }
    }
    if (!handle) {
        errorLogger('Unable to retrieve release information from known identifier paths.');
        return;
    }
    try {
        ;
        const releaseInfo: ReleaseInfo = {
            id: 'unknown'
        };
        for await (const line of readLines({ input: handle.createReadStream(), crlfDelay: Infinity })) {
            if (!line.includes('=')) {
                continue;
            }
            const key = line.split('=')[0].toUpperCase().trim();
            if (new Set([
                'ID',
                'DISTRIB_ID',
                'ID_LIKE',
                'VERSION_ID',
                'DISTRIB_RELEASE',
            ]).has(line.split('=')[0].toUpperCase().trim())) {
                const value = line.split('=')[1].replace(/"/g, '').toLowerCase().trim();
                if (line.split('=')[0].toUpperCase().trim()
                    === 'ID' || line.split('=')[0].toUpperCase().trim()
                    === 'DISTRIB_ID') {
                    ({
                        id: 'unknown'
                    }.id =
                        line.split('=')[1].replace(/"/g, '').toLowerCase().trim());
                }
                else if (line.split('=')[0].toUpperCase().trim()
                    === 'ID_LIKE') {
                    ({
                        id: 'unknown'
                    }.id_like =
                        line.split('=')[1].replace(/"/g, '').toLowerCase().trim());
                }
                else if (line.split('=')[0].toUpperCase().trim()
                    === 'VERSION_ID' || line.split('=')[0].toUpperCase().trim()
                    === 'DISTRIB_RELEASE') {
                    ({
                        id: 'unknown'
                    }.version_id =
                        line.split('=')[1].replace(/"/g, '').toLowerCase().trim());
                }
            }
        }
        return {
            id: 'unknown'
        };
    }
    catch (err) {
        errorLogger(err);
    }
    return;
}
