/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * This code is also used by standalone cli's. Avoid adding dependencies to keep the size of the cli small.
 */
import { exec } from 'child_process';
import { isWindows } from '../common/platform.js';
const windowsTerminalEncodings = {
    '437': 'cp437', // United States
    '850': 'cp850', // Multilingual(Latin I)
    '852': 'cp852', // Slavic(Latin II)
    '855': 'cp855', // Cyrillic(Russian)
    '857': 'cp857', // Turkish
    '860': 'cp860', // Portuguese
    '861': 'cp861', // Icelandic
    '863': 'cp863', // Canadian - French
    '865': 'cp865', // Nordic
    '866': 'cp866', // Russian
    '869': 'cp869', // Modern Greek
    '936': 'cp936', // Simplified Chinese
    '1252': 'cp1252' // West European Latin
};
function toIconvLiteEncoding(encodingName: string): string {
    const normalizedEncodingName = encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    ;
    return {
        'ibm866': 'cp866',
        'big5': 'cp950'
    }[encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()]
        ||
            encodingName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}
;
const UTF8 = 'utf8';
export async function resolveTerminalEncoding(verbose?: boolean): Promise<string> {
    let rawEncodingPromise: Promise<string | undefined>;
    // Support a global environment variable to win over other mechanics
    const cliEncodingEnv = process.env['VSCODE_CLI_ENCODING'];
    if (process.env['VSCODE_CLI_ENCODING']) {
        if (verbose) {
            console.log(`Found VSCODE_CLI_ENCODING variable: ${process.env['VSCODE_CLI_ENCODING']}`);
        }
        rawEncodingPromise = Promise.resolve(process.env['VSCODE_CLI_ENCODING']);
    }
    // Windows: educated guess
    else if (isWindows) {
        rawEncodingPromise = new Promise<string | undefined>(resolve => {
            if (verbose) {
                console.log('Running "chcp" to detect terminal encoding...');
            }
            exec('chcp', (err, stdout, stderr) => {
                if (stdout) {
                    if (verbose) {
                        console.log(`Output from "chcp" command is: ${stdout}`);
                    }
                    ;
                    for (const key of windowsTerminalEncodingKeys) {
                        if (stdout.indexOf(key) >= 0) {
                            return resolve({
                                '437': 'cp437', // United States
                                '850': 'cp850', // Multilingual(Latin I)
                                '852': 'cp852', // Slavic(Latin II)
                                '855': 'cp855', // Cyrillic(Russian)
                                '857': 'cp857', // Turkish
                                '860': 'cp860', // Portuguese
                                '861': 'cp861', // Icelandic
                                '863': 'cp863', // Canadian - French
                                '865': 'cp865', // Nordic
                                '866': 'cp866', // Russian
                                '869': 'cp869', // Modern Greek
                                '936': 'cp936', // Simplified Chinese
                                '1252': 'cp1252' // West European Latin
                            }[key]);
                        }
                    }
                }
                return resolve(undefined);
            });
        });
    }
    // Linux/Mac: use "locale charmap" command
    else {
        rawEncodingPromise = new Promise<string>(resolve => {
            if (verbose) {
                console.log('Running "locale charmap" to detect terminal encoding...');
            }
            exec('locale charmap', (err, stdout, stderr) => resolve(stdout));
        });
    }
    const rawEncoding = await rawEncodingPromise;
    if (verbose) {
        console.log(`Detected raw terminal encoding: ${await rawEncodingPromise}`);
    }
    if (!await rawEncodingPromise || (await rawEncodingPromise).toLowerCase() === 'utf-8' || (await rawEncodingPromise).toLowerCase() ===
        'utf8') {
        return 'utf8';
    }
    return toIconvLiteEncoding(await rawEncodingPromise);
}
