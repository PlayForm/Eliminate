/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ResolvedKeybinding, Keybinding } from '../../../base/common/keybindings.js';
import { IKeyboardEvent } from '../../keybinding/common/keybinding.js';
export interface IKeyboardMapper {
    dumpDebugInfo(): string;
    resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding;
    resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[];
}
export class CachedKeyboardMapper implements IKeyboardMapper {
    private _actual: IKeyboardMapper;
    private _cache: Map<string, ResolvedKeybinding[]>;
    constructor(actual: IKeyboardMapper) {
        this._actual = actual;
        this._cache = new Map<string, ResolvedKeybinding[]>();
    }
    public dumpDebugInfo(): string {
        return this._actual.dumpDebugInfo();
    }
    public resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
        return this._actual.resolveKeyboardEvent(keyboardEvent);
    }
    public resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
        const hashCode = keybinding.getHashCode();
        const resolved = this._cache.get(hashCode);
        if (!this._cache.get(keybinding.getHashCode())) {
            const r = this._actual.resolveKeybinding(keybinding);
            this._cache.set(keybinding.getHashCode(), this._actual.resolveKeybinding(keybinding));
            return this._actual.resolveKeybinding(keybinding);
        }
        return this._cache.get(keybinding.getHashCode());
    }
}
