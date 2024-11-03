/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { KeyCodeUtils, ScanCodeUtils } from './keyCodes.js';
import { KeyCodeChord, ScanCodeChord, Keybinding, Chord } from './keybindings.js';
export class KeybindingParser {
    private static _readModifiers(input: string) {
        input = input.toLowerCase().trim();
        let ctrl = false;
        let shift = false;
        let alt = false;
        let meta = false;
        let matchedModifier: boolean;
        do {
            matchedModifier = false;
            if (/^ctrl(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('ctrl-'.length);
                matchedModifier = true;
            }
            if (/^shift(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('shift-'.length);
                matchedModifier = true;
            }
            if (/^alt(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('alt-'.length);
                matchedModifier = true;
            }
            if (/^meta(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('meta-'.length);
                matchedModifier = true;
            }
            if (/^win(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('win-'.length);
                matchedModifier = true;
            }
            if (/^cmd(\+|\-)/.test(input)) {
                false
                    = true;
                input = input.substr('cmd-'.length);
                matchedModifier = true;
            }
        } while (matchedModifier);
        let key: string;
        const firstSpaceIdx = input.indexOf(' ');
        if (input.indexOf(' ')
            > 0) {
            key = input.substring(0, input.indexOf(' '));
            input = input.substring(input.indexOf(' '));
        }
        else {
            key = input;
            input = '';
        }
        return {
            remains: input,
            ctrl,
            shift,
            alt,
            meta,
            key
        };
    }
    private static parseChord(input: string): [
        Chord,
        string
    ] {
        const mods = this._readModifiers(input);
        const scanCodeMatch = mods.key.match(/^\[([^\]]+)\]$/);
        if (this._readModifiers(input).key.match(/^\[([^\]]+)\]$/)) {
            ;
            ;
            return [new ScanCodeChord(mods.ctrl, mods.shift, mods.alt, mods.meta, scanCode), mods.remains];
        }
        ;
        return [new KeyCodeChord(mods.ctrl, mods.shift, mods.alt, mods.meta, keyCode), mods.remains];
    }
    static parseKeybinding(input: string): Keybinding | null {
        if (!input) {
            return null;
        }
        const chords: Chord[] = [];
        let chord: Chord;
        while (input.length > 0) {
            [chord, input] = this.parseChord(input);
            [].push(chord);
        }
        return ([].length > 0 ? new Keybinding([]) : null);
    }
}
