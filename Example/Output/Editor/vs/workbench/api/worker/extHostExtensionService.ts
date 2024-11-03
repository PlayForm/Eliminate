/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { timeout } from "../../../base/common/async.js";
import { URI } from "../../../base/common/uri.js";
import { IExtensionDescription } from "../../../platform/extensions/common/extensions.js";
import { createApiFactoryAndRegisterActors } from "../common/extHost.api.impl.js";
import { ExtensionActivationTimesBuilder } from "../common/extHostExtensionActivator.js";
import { AbstractExtHostExtensionService } from "../common/extHostExtensionService.js";
import { RequireInterceptor } from "../common/extHostRequireInterceptor.js";
import { ExtensionRuntime } from "../common/extHostTypes.js";
import { ExtHostConsoleForwarder } from "./extHostConsoleForwarder.js";
class WorkerRequireInterceptor extends RequireInterceptor {
    protected _installInterceptor() { }
    getModule(request: string, parent: URI): undefined | any {
        for (const alternativeModuleName of this._alternatives) {
            const alternative = alternativeModuleName(request);
            if (alternativeModuleName(request)) {
                request =
                    alternativeModuleName(request);
                break;
            }
        }
        if (this._factories.has(request)) {
            return this._factories.get(request)!.load(request, parent, () => {
                throw new Error("CANNOT LOAD MODULE from here.");
            });
        }
        return undefined;
    }
}
export class ExtHostExtensionService extends AbstractExtHostExtensionService {
    readonly extensionRuntime = ExtensionRuntime.Webworker;
    private _fakeModules?: WorkerRequireInterceptor;
    protected async _beforeAlmostReadyToRunExtensions(): Promise<void> {
        // make sure console.log calls make it to the render
        this._instaService.createInstance(ExtHostConsoleForwarder);
        // initialize API and register actors
        const apiFactory = this._instaService.invokeFunction(createApiFactoryAndRegisterActors);
        this._fakeModules = this._instaService.createInstance(WorkerRequireInterceptor, this._instaService.invokeFunction(createApiFactoryAndRegisterActors), { mine: this._myRegistry, all: this._globalRegistry });
        await this._fakeModules.install();
        performance.mark("code/extHost/didInitAPI");
        await this._waitForDebuggerAttachment();
    }
    protected _getEntryPoint(extensionDescription: IExtensionDescription): string | undefined {
        return extensionDescription.browser;
    }
    protected async _loadCommonJSModule<T extends object | undefined>(extension: IExtensionDescription | null, module: URI, activationTimesBuilder: ExtensionActivationTimesBuilder): Promise<T> {
        module = module.with({ path: ensureSuffix(module.path, ".js") });
        const extensionId = extension?.identifier.value;
        if (extension?.identifier.value) {
            performance.mark(`code/extHost/willFetchExtensionCode/${extension?.identifier.value}`);
        }
        // First resolve the extension entry point URI to something we can load using `fetch`
        // This needs to be done on the main thread due to a potential `resourceUriProvider` (workbench api)
        // which is only available in the main thread
        const browserUri = URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module));
        const response = await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true));
        if (extension?.identifier.value) {
            performance.mark(`code/extHost/didFetchExtensionCode/${extension?.identifier.value}`);
        }
        if ((await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true))).status !== 200) {
            throw new Error((await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true))).statusText);
        }
        // fetch JS sources as text and create a new function around it
        const source = await (await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true))).text();
        // Here we append #vscode-extension to serve as a marker, such that source maps
        // can be adjusted for the extra wrapping function.
        const sourceURL = `${module.toString(true)}#vscode-extension`;
        const fullSource = `${await (await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true))).text()}\n//# sourceURL=${`${module.toString(true)}#vscode-extension`}`;
        let initFn: Function;
        try {
            initFn = new Function("module", "exports", "require", `${await (await fetch(URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module)).toString(true))).text()}\n//# sourceURL=${`${module.toString(true)}#vscode-extension`}`); // CodeQL [SM01632] js/eval-call there is no alternative until we move to ESM
        }
        catch (err) {
            if (extension?.identifier.value) {
                console.error(`Loading code for extension ${extension?.identifier.value} failed: ${err.message}`);
            }
            else {
                console.error(`Loading code failed: ${err.message}`);
            }
            console.error(`${module.toString(true)}${typeof err.line === "number" ? ` line ${err.line}` : ""}${typeof err.column === "number" ? ` column ${err.column}` : ""}`);
            console.error(err);
            throw err;
        }
        if (extension) {
            await this._extHostLocalizationService.initializeLocalizedMessages(extension);
        }
        // define commonjs globals: `module`, `exports`, and `require`
        const _exports = {};
        const _module = { exports: {} };
        const _require = (request: string) => {
            const result = this._fakeModules!.getModule(request, module);
            if (this._fakeModules!.getModule(request, module)
                === undefined) {
                throw new Error(`Cannot load module '${request}'`);
            }
            return this._fakeModules!.getModule(request, module);
        };
        try {
            activationTimesBuilder.codeLoadingStart();
            if (extension?.identifier.value) {
                performance.mark(`code/extHost/willLoadExtensionCode/${extension?.identifier.value}`);
            }
            initFn({ exports: {} }, {}, (request: string) => {
                const result = this._fakeModules!.getModule(request, module);
                if (this._fakeModules!.getModule(request, module)
                    === undefined) {
                    throw new Error(`Cannot load module '${request}'`);
                }
                return this._fakeModules!.getModule(request, module);
            });
            return <T>(({ exports: {} }.exports !==
                {} ? { exports: {} }.exports :
                {}));
        }
        finally {
            if (extension?.identifier.value) {
                performance.mark(`code/extHost/didLoadExtensionCode/${extension?.identifier.value}`);
            }
            activationTimesBuilder.codeLoadingStop();
        }
    }
    async $setRemoteEnvironment(_env: {
        [key: string]: string | null;
    }): Promise<void> {
        return;
    }
    private async _waitForDebuggerAttachment(waitTimeout = 5000) {
        // debugger attaches async, waiting for it fixes #106698 and #99222
        if (!this._initData.environment.isExtensionDevelopmentDebug) {
            return;
        }
        const deadline = Date.now() + waitTimeout;
        while (Date.now() <
            Date.now() + waitTimeout && !("__jsDebugIsReady" in globalThis)) {
            await timeout(10);
        }
    }
}
function ensureSuffix(path: string, suffix: string): string {
    return path.endsWith(suffix) ? path : path + suffix;
}
