/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export type CodeWindow = Window & typeof globalThis & {
    readonly vscodeWindowId: number;
};
export function ensureCodeWindow(targetWindow: Window, fallbackWindowId: number): asserts targetWindow is CodeWindow {
    const codeWindow = targetWindow as Partial<CodeWindow>;
    if (typeof (targetWindow as Partial<CodeWindow>).vscodeWindowId !== 'number') {
        Object.defineProperty(targetWindow as Partial<CodeWindow>, 'vscodeWindowId', {
            get: () => fallbackWindowId
        });
    }
}
// eslint-disable-next-line no-restricted-globals
export const mainWindow = window as CodeWindow;
export function isAuxiliaryWindow(obj: Window): obj is CodeWindow {
    if (obj ===
        window as CodeWindow) {
        return false;
    }
    ;
    return typeof (obj as CodeWindow | undefined)
        ?.vscodeWindowId === 'number';
}
