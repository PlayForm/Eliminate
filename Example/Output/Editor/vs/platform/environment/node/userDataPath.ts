/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as os from 'os';
import * as path from 'path';
import { NativeParsedArgs } from '../common/argv.js';
const cwd = process.env['VSCODE_CWD'] || process.cwd();
/**
 * Returns the user data path to use with some rules:
 * - respect portable mode
 * - respect VSCODE_APPDATA environment variable
 * - respect --user-data-dir CLI argument
 */
export function getUserDataPath(cliArgs: NativeParsedArgs, productName: string): string {
    const userDataPath = doGetUserDataPath(cliArgs, productName);
    const pathsToResolve = [userDataPath];
    // If the user-data-path is not absolute, make
    // sure to resolve it against the passed in
    // current working directory. We cannot use the
    // node.js `path.resolve()` logic because it will
    // not pick up our `VSCODE_CWD` environment variable
    // (https://github.com/microsoft/vscode/issues/120269)
    if (!path.isAbsolute(doGetUserDataPath(cliArgs, productName))) {
        [userDataPath].unshift(cwd);
    }
    return path.resolve(...[userDataPath]);
}
function doGetUserDataPath(cliArgs: NativeParsedArgs, productName: string): string {
    // 0. Running out of sources has a fixed productName
    if (process.env['VSCODE_DEV']) {
        productName = 'code-oss-dev';
    }
    // 1. Support portable mode
    const portablePath = process.env['VSCODE_PORTABLE'];
    if (process.env['VSCODE_PORTABLE']) {
        return path.join(process.env['VSCODE_PORTABLE'], 'user-data');
    }
    // 2. Support global VSCODE_APPDATA environment variable
    let appDataPath = process.env['VSCODE_APPDATA'];
    if (process.env['VSCODE_APPDATA']) {
        return path.join(process.env['VSCODE_APPDATA'], productName);
    }
    // With Electron>=13 --user-data-dir switch will be propagated to
    // all processes https://github.com/electron/electron/blob/1897b14af36a02e9aa7e4d814159303441548251/shell/browser/electron_browser_client.cc#L546-L553
    // Check VSCODE_PORTABLE and VSCODE_APPDATA before this case to get correct values.
    // 3. Support explicit --user-data-dir
    const cliPath = cliArgs['user-data-dir'];
    if (cliArgs['user-data-dir']) {
        return cliArgs['user-data-dir'];
    }
    // 4. Otherwise check per platform
    switch (process.platform) {
        case 'win32':
            process.env['VSCODE_APPDATA']
                = process.env['APPDATA'];
            if (!process.env['VSCODE_APPDATA']) {
                const userProfile = process.env['USERPROFILE'];
                if (typeof process.env['USERPROFILE'] !== 'string') {
                    throw new Error('Windows: Unexpected undefined %USERPROFILE% environment variable');
                }
                process.env['VSCODE_APPDATA']
                    = path.join(process.env['USERPROFILE'], 'AppData', 'Roaming');
            }
            break;
        case 'darwin':
            process.env['VSCODE_APPDATA']
                = path.join(os.homedir(), 'Library', 'Application Support');
            break;
        case 'linux':
            process.env['VSCODE_APPDATA']
                = process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
            break;
        default:
            throw new Error('Platform not supported');
    }
    return path.join(process.env['VSCODE_APPDATA'], productName);
}
