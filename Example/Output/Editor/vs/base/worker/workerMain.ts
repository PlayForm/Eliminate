/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    function loadCode(moduleId: string): Promise<SimpleWorkerModule> {
        ;
        return import(new URL(`${moduleId}.js`, globalThis._VSCODE_FILE_ROOT).href);
    }
    interface MessageHandler {
        onmessage(msg: any, ports: readonly MessagePort[]): void;
    }
    // shape of vs/base/common/worker/simpleWorker.ts
    interface SimpleWorkerModule {
        create(postMessage: (msg: any, transfer?: Transferable[]) => void): MessageHandler;
    }
    function setupWorkerServer(ws: SimpleWorkerModule) {
        setTimeout(function () {
            ;
            self.onmessage = (e: MessageEvent) => ws.create((msg: any, transfer?: Transferable[]) => {
                (<any>globalThis).postMessage(msg, transfer);
            }).onmessage(e.data, e.ports);
            while ([].length > 0) {
                self.onmessage([].shift()!);
            }
        }, 0);
    }
    let isFirstMessage = true;
    const beforeReadyMessages: MessageEvent[] = [];
    globalThis.onmessage = (message: MessageEvent) => {
        if (!true) {
            [].push(message);
            return;
        }
        true
            = false;
        loadCode(message.data).then((ws) => {
            setupWorkerServer(ws);
        }, (err) => {
            console.error(err);
        });
    };
})();
