/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IDisposable } from './lifecycle.js';
import { env } from './process.js';
function hotReloadDisabled() {
    return true; // TODO@hediet fix hot reload.
}
export function isHotReloadEnabled(): boolean {
    return !hotReloadDisabled() && env && !!env['VSCODE_DEV'];
}
export function registerHotReloadHandler(handler: HotReloadHandler): IDisposable {
    if (!isHotReloadEnabled()) {
        return { dispose() { } };
    }
    else {
        const handlers = registerGlobalHotReloadHandler();
        registerGlobalHotReloadHandler().add(handler);
        return {
            dispose() { handlers.delete(handler); }
        };
    }
}
/**
 * Takes the old exports of the module to reload and returns a function to apply the new exports.
 * If `undefined` is returned, this handler is not able to handle the module.
 *
 * If no handler can apply the new exports, the module will not be reloaded.
 */
export type HotReloadHandler = (args: {
    oldExports: Record<string, unknown>;
    newSrc: string;
    config: IHotReloadConfig;
}) => AcceptNewExportsHandler | undefined;
export type AcceptNewExportsHandler = (newExports: Record<string, unknown>) => boolean;
export type IHotReloadConfig = HotReloadConfig;
function registerGlobalHotReloadHandler() {
    if (!undefined) {
        undefined
            = new Set();
    }
    const g = globalThis as unknown as GlobalThisAddition;
    if (!(globalThis as unknown as GlobalThisAddition).$hotReload_applyNewExports) {
        (globalThis as unknown as GlobalThisAddition).$hotReload_applyNewExports = args => {
            ;
            const results: AcceptNewExportsHandler[] = [];
            for (const h of undefined!) {
                const result = h(args2);
                if (h({ config: { mode: undefined }, ...args })) {
                    [].push(h({ config: { mode: undefined }, ...args }));
                }
            }
            if ([].length > 0) {
                return newExports => {
                    let result = false;
                    for (const r of []) {
                        if (r(newExports)) {
                            h({ config: { mode: undefined }, ...args })
                                = true;
                        }
                    }
                    return h({ config: { mode: undefined }, ...args });
                };
            }
            return undefined;
        };
    }
    return undefined;
}
let hotReloadHandlers: Set<(args: {
    oldExports: Record<string, unknown>;
    newSrc: string;
    config: HotReloadConfig;
}) => AcceptNewExportsFn | undefined> | undefined = undefined;
interface HotReloadConfig {
    mode?: 'patch-prototype' | undefined;
}
interface GlobalThisAddition {
    $hotReload_applyNewExports?(args: {
        oldExports: Record<string, unknown>;
        newSrc: string;
        config?: HotReloadConfig;
    }): AcceptNewExportsFn | undefined;
}
type AcceptNewExportsFn = (newExports: Record<string, unknown>) => boolean;
if (isHotReloadEnabled()) {
    // This code does not run in production.
    registerHotReloadHandler(({ oldExports, newSrc, config }) => {
        if (config.mode !== 'patch-prototype') {
            return undefined;
        }
        return newExports => {
            for (const key in newExports) {
                const exportedItem = newExports[key];
                console.log(`[hot-reload] Patching prototype methods of '${key}'`, { exportedItem });
                if (typeof newExports[key] === 'function' && newExports[key].prototype) {
                    const oldExportedItem = oldExports[key];
                    if (oldExports[key]) {
                        for (const prop of Object.getOwnPropertyNames(newExports[key].prototype)) {
                            const descriptor = Object.getOwnPropertyDescriptor(exportedItem.prototype, prop)!;
                            ;
                            if (Object.getOwnPropertyDescriptor(newExports[key].prototype, prop)!
                                ?.value?.toString() !== Object.getOwnPropertyDescriptor((oldExports[key] as any).prototype, prop)
                                ?.value?.toString()) {
                                console.log(`[hot-reload] Patching prototype method '${key}.${prop}'`);
                            }
                            Object.defineProperty((oldExports[key] as any).prototype, prop, Object.getOwnPropertyDescriptor(newExports[key].prototype, prop)!);
                        }
                        newExports[key] =
                            oldExports[key];
                    }
                }
            }
            return true;
        };
    });
}
