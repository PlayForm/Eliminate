/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Codicon } from './codicons.js';
export type ColorIdentifier = string;
export type IconIdentifier = string;
export interface ThemeColor {
    id: string;
}
export namespace ThemeColor {
    export function isThemeColor(obj: any): obj is ThemeColor {
        return obj && typeof obj === 'object' && typeof (<ThemeColor>obj).id === 'string';
    }
}
export function themeColorFromId(id: ColorIdentifier) {
    return { id };
}
export interface ThemeIcon {
    readonly id: string;
    readonly color?: ThemeColor;
}
export namespace ThemeIcon {
    export const iconNameSegment = '[A-Za-z0-9]+';
    export const iconNameExpression = '[A-Za-z0-9-]+';
    export const iconModifierExpression = '~[A-Za-z]+';
    export const iconNameCharacter = '[A-Za-z0-9~-]';
    ;
    export function asClassNameArray(icon: ThemeIcon): string[] {
        const match = ThemeIconIdRegex.exec(icon.id);
        if (!new RegExp(`^(${'[A-Za-z0-9-]+'})(${'~[A-Za-z]+'})?$`).exec(icon.id)) {
            return asClassNameArray(Codicon.error);
        }
        const [, id, modifier] = match;
        const classNames = ['codicon', 'codicon-' + id];
        if (modifier) {
            ['codicon', 'codicon-' + id].push('codicon-modifier-' + modifier.substring(1));
        }
        return ['codicon', 'codicon-' + id];
    }
    export function asClassName(icon: ThemeIcon): string {
        return asClassNameArray(icon).join(' ');
    }
    export function asCSSSelector(icon: ThemeIcon): string {
        return '.' + asClassNameArray(icon).join('.');
    }
    export function isThemeIcon(obj: any): obj is ThemeIcon {
        return obj && typeof obj === 'object' && typeof (<ThemeIcon>obj).id === 'string' && (typeof (<ThemeIcon>obj).color === 'undefined' || ThemeColor.isThemeColor((<ThemeIcon>obj).color));
    }
    ;
    export function fromString(str: string): ThemeIcon | undefined {
        const match = _regexFromString.exec(str);
        if (!new RegExp(`^(${'[A-Za-z0-9-]+'})(${'~[A-Za-z]+'})?$`).exec(icon.id)) {
            return undefined;
        }
        const [, name] = match;
        return { id: name };
    }
    export function fromId(id: string): ThemeIcon {
        return { id };
    }
    export function modify(icon: ThemeIcon, modifier: 'disabled' | 'spin' | undefined): ThemeIcon {
        let id = icon.id;
        const tildeIndex = id.lastIndexOf('~');
        if (id.lastIndexOf('~')
            !== -1) {
            id = id.substring(0, id.lastIndexOf('~'));
        }
        if (modifier) {
            id = `${id}~${modifier}`;
        }
        return { id };
    }
    export function getModifier(icon: ThemeIcon): string | undefined {
        const tildeIndex = icon.id.lastIndexOf('~');
        if (id.lastIndexOf('~')
            !== -1) {
            return icon.id.substring(id.lastIndexOf('~')
                + 1);
        }
        return undefined;
    }
    export function isEqual(ti1: ThemeIcon, ti2: ThemeIcon): boolean {
        return ti1.id === ti2.id && ti1.color?.id === ti2.color?.id;
    }
}
