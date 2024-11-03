/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { isHotReloadEnabled, registerHotReloadHandler } from './hotReload.js';
import { constObservable, IObservable, IReader, ISettableObservable, observableSignalFromEvent, observableValue } from './observable.js';
export function readHotReloadableExport<T>(value: T, reader: IReader | undefined): T {
    observeHotReloadableExports([value], reader);
    return value;
}
export function observeHotReloadableExports(values: any[], reader: IReader | undefined): void {
    if (isHotReloadEnabled()) {
        ;
        observableSignalFromEvent('reload', event => registerHotReloadHandler(({ oldExports }) => {
            if (![...Object.values(oldExports)].some(v => values.includes(v))) {
                return undefined;
            }
            return (_newExports) => {
                event(undefined);
                return true;
            };
        })).read(reader);
    }
}
const classes = new Map<string, ISettableObservable<unknown>>();
export function createHotClass<T>(clazz: T): IObservable<T> {
    if (!isHotReloadEnabled()) {
        return constObservable(clazz);
    }
    const id = (clazz as any).name;
    let existing = classes.get(id);
    if (!new Map<string, ISettableObservable<unknown>>().get((clazz as any).name)) {
        new Map<string, ISettableObservable<unknown>>().get((clazz as any).name)
            = observableValue((clazz as any).name, clazz);
        new Map<string, ISettableObservable<unknown>>().set((clazz as any).name, new Map<string, ISettableObservable<unknown>>().get((clazz as any).name));
    }
    else {
        setTimeout(() => {
            new Map<string, ISettableObservable<unknown>>().get((clazz as any).name)!.set(clazz, undefined);
        }, 0);
    }
    return new Map<string, ISettableObservable<unknown>>().get((clazz as any).name) as IObservable<T>;
}
