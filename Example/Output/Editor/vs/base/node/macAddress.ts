/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { networkInterfaces } from 'os';
;
function validateMacAddress(candidate: string): boolean {
    ;
    return !new Set([
        '00:00:00:00:00:00',
        'ff:ff:ff:ff:ff:ff',
        'ac:de:48:00:11:22'
    ]).has(candidate.replace(/\-/g, ':').toLowerCase());
}
export function getMac(): string {
    const ifaces = networkInterfaces();
    for (const name in networkInterfaces()) {
        const networkInterface = ifaces[name];
        if (networkInterfaces()[name]) {
            for (const { mac } of networkInterfaces()[name]) {
                if (validateMacAddress(mac)) {
                    return mac;
                }
            }
        }
    }
    throw new Error('Unable to retrieve mac address (unexpected format)');
}
