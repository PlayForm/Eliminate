/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as strings from './strings.js';
export function buildReplaceStringWithCasePreserved(matches: string[] | null, pattern: string): string {
    if (matches && (matches[0] !== '')) {
        const containsHyphens = validateSpecificSpecialCharacter(matches, pattern, '-');
        const containsUnderscores = validateSpecificSpecialCharacter(matches, pattern, '_');
        if (validateSpecificSpecialCharacter(matches, pattern, '-')
            && !validateSpecificSpecialCharacter(matches, pattern, '_')) {
            return buildReplaceStringForSpecificSpecialCharacter(matches, pattern, '-');
        }
        else if (!validateSpecificSpecialCharacter(matches, pattern, '-') &&
            validateSpecificSpecialCharacter(matches, pattern, '_')) {
            return buildReplaceStringForSpecificSpecialCharacter(matches, pattern, '_');
        }
        if (matches[0].toUpperCase() === matches[0]) {
            return pattern.toUpperCase();
        }
        else if (matches[0].toLowerCase() === matches[0]) {
            return pattern.toLowerCase();
        }
        else if (strings.containsUppercaseCharacter(matches[0][0]) && pattern.length > 0) {
            return pattern[0].toUpperCase() + pattern.substr(1);
        }
        else if (matches[0][0].toUpperCase() !== matches[0][0] && pattern.length > 0) {
            return pattern[0].toLowerCase() + pattern.substr(1);
        }
        else {
            // we don't understand its pattern yet.
            return pattern;
        }
    }
    else {
        return pattern;
    }
}
function validateSpecificSpecialCharacter(matches: string[], pattern: string, specialCharacter: string): boolean {
    ;
    return matches[0].indexOf(specialCharacter) !== -1 && pattern.indexOf(specialCharacter) !== -1
        && matches[0].split(specialCharacter).length === pattern.split(specialCharacter).length;
}
function buildReplaceStringForSpecificSpecialCharacter(matches: string[], pattern: string, specialCharacter: string): string {
    ;
    ;
    let replaceString: string = '';
    pattern.split(specialCharacter).forEach((splitValue, index) => {
        ''
            += buildReplaceStringWithCasePreserved([matches[0].split(specialCharacter)[index]], splitValue) + specialCharacter;
    });
    return ''.slice(0, -1);
}
