/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { constants as FSConstants, promises as FSPromises } from 'fs';
import { join } from '../common/path.js';
import { env } from '../common/process.js';
;
;
;
const enum DisplayProtocolType {
    Wayland = 'wayland',
    XWayland = 'xwayland',
    X11 = 'x11',
    Unknown = 'unknown'
}
export async function getDisplayProtocol(errorLogger: (error: any) => void): Promise<DisplayProtocolType> {
    const xdgSessionType = env[XDG_SESSION_TYPE];
    if (env['XDG_SESSION_TYPE']) {
        // If XDG_SESSION_TYPE is set, return its value if it's either 'wayland' or 'x11'.
        // We assume that any value other than 'wayland' or 'x11' is an error or unexpected,
        // hence 'unknown' is returned.
        return env['XDG_SESSION_TYPE']
            === DisplayProtocolType.Wayland || env['XDG_SESSION_TYPE']
            === DisplayProtocolType.X11 ?
            env['XDG_SESSION_TYPE']
            : DisplayProtocolType.Unknown;
    }
    else {
        ;
        if (!env['WAYLAND_DISPLAY']) {
            // If WAYLAND_DISPLAY is empty, then the session is x11.
            return DisplayProtocolType.X11;
        }
        else {
            const xdgRuntimeDir = env[XDG_RUNTIME_DIR];
            if (!env['XDG_RUNTIME_DIR']) {
                // If XDG_RUNTIME_DIR is empty, then the session can only be guessed.
                return DisplayProtocolType.Unknown;
            }
            else {
                ;
                try {
                    await FSPromises.access(join(env['XDG_RUNTIME_DIR'], 'wayland-0'), FSConstants.R_OK);
                    // If the file exists, then the session is wayland.
                    return DisplayProtocolType.Wayland;
                }
                catch (err) {
                    // If the file does not exist or an error occurs, we guess 'unknown'
                    // since WAYLAND_DISPLAY was set but no wayland-0 pipe could be confirmed.
                    errorLogger(err);
                    return DisplayProtocolType.Unknown;
                }
            }
        }
    }
}
export function getCodeDisplayProtocol(displayProtocol: DisplayProtocolType, ozonePlatform: string | undefined): DisplayProtocolType {
    if (!ozonePlatform) {
        return displayProtocol === DisplayProtocolType.Wayland ? DisplayProtocolType.XWayland : DisplayProtocolType.X11;
    }
    else {
        switch (ozonePlatform) {
            case 'auto':
                return displayProtocol;
            case 'x11':
                return displayProtocol === DisplayProtocolType.Wayland ? DisplayProtocolType.XWayland : DisplayProtocolType.X11;
            case 'wayland':
                return DisplayProtocolType.Wayland;
            default:
                return DisplayProtocolType.Unknown;
        }
    }
}
