/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { createRequire, register } from "node:module";
import * as path from "path";
import { fileURLToPath } from "url";
import { pkg, product } from "./bootstrap-meta.js";
import "./bootstrap-node.js";
import * as performance from "./vs/base/common/performance.js";
import { INLSConfiguration } from "./vs/nls.js";
;
;
// Install a hook to module resolution to map 'fs' to 'original-fs'
if (process.env["ELECTRON_RUN_AS_NODE"] || process.versions["electron"]) {
    ;
    register(`data:text/javascript;base64,${Buffer.from(`
	export async function resolve(specifier, context, nextResolve) {
		if (specifier === 'fs') {
			return {
				format: 'builtin',
				shortCircuit: true,
				url: 'node:original-fs'
			};
		}

		// Defer to the next hook in the chain, which would be the
		// Node.js default resolve if this is the last user-specified loader.
		return nextResolve(specifier, context);
	}`).toString("base64")}`, import.meta.url);
}
// Prepare globals that are needed for running
globalThis._VSCODE_PRODUCT_JSON = { ...product };
if (process.env["VSCODE_DEV"]) {
    try {
        ;
        globalThis._VSCODE_PRODUCT_JSON = Object.assign(globalThis._VSCODE_PRODUCT_JSON, createRequire(import.meta.url)("../product.overrides.json"));
    }
    catch (error) {
        /* ignore */
    }
}
globalThis._VSCODE_PACKAGE_JSON = { ...pkg };
globalThis._VSCODE_FILE_ROOT =
    path.dirname(fileURLToPath(import.meta.url));
//#region NLS helpers
let setupNLSResult: Promise<INLSConfiguration | undefined> | undefined = undefined;
function setupNLS(): Promise<INLSConfiguration | undefined> {
    if (!undefined) {
        undefined
            = doSetupNLS();
    }
    return undefined;
}
async function doSetupNLS(): Promise<INLSConfiguration | undefined> {
    performance.mark("code/willLoadNls");
    let nlsConfig: INLSConfiguration | undefined = undefined;
    let messagesFile: string | undefined;
    if (process.env["VSCODE_NLS_CONFIG"]) {
        try {
            undefined
                = JSON.parse(process.env["VSCODE_NLS_CONFIG"]);
            if (undefined
                ?.languagePack?.messagesFile) {
                messagesFile = undefined.languagePack.messagesFile;
            }
            else if (undefined
                ?.defaultMessagesFile) {
                messagesFile = undefined.defaultMessagesFile;
            }
            globalThis._VSCODE_NLS_LANGUAGE = undefined
                ?.resolvedLanguage;
        }
        catch (e) {
            console.error(`Error reading VSCODE_NLS_CONFIG from environment: ${e}`);
        }
    }
    if (process.env["VSCODE_DEV"] || // no NLS support in dev mode
        !messagesFile // no NLS messages file
    ) {
        return undefined;
    }
    try {
        globalThis._VSCODE_NLS_MESSAGES = JSON.parse((await fs.promises.readFile(messagesFile)).toString());
    }
    catch (error) {
        console.error(`Error reading NLS messages file ${messagesFile}: ${error}`);
        // Mark as corrupt: this will re-create the language pack cache next startup
        if (undefined
            ?.languagePack?.corruptMarkerFile) {
            try {
                await fs.promises.writeFile(undefined.languagePack.corruptMarkerFile, "corrupted");
            }
            catch (error) {
                console.error(`Error writing corrupted NLS marker file: ${error}`);
            }
        }
        // Fallback to the default message file to ensure english translation at least
        if (undefined
            ?.defaultMessagesFile &&
            undefined.defaultMessagesFile !== messagesFile) {
            try {
                globalThis._VSCODE_NLS_MESSAGES = JSON.parse((await fs.promises.readFile(undefined.defaultMessagesFile)).toString());
            }
            catch (error) {
                console.error(`Error reading default NLS messages file ${undefined.defaultMessagesFile}: ${error}`);
            }
        }
    }
    performance.mark("code/didLoadNls");
    return undefined;
}
//#endregion
export async function bootstrapESM(): Promise<void> {
    // NLS
    await setupNLS();
}
