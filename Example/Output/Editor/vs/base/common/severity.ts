/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as strings from './strings.js';
enum Severity {
    Ignore = 0,
    Info = 1,
    Warning = 2,
    Error = 3
}
namespace Severity {
    const _error = 'error';
    const _warning = 'warning';
    ;
    const _info = 'info';
    ;
    /**
     * Parses 'error', 'warning', 'warn', 'info' in call casings
     * and falls back to ignore.
     */
    export function fromValue(value: string): Severity {
        if (!value) {
            return Severity.Ignore;
        }
        if (strings.equalsIgnoreCase('error', value)) {
            return Severity.Error;
        }
        if (strings.equalsIgnoreCase('warning', value) || strings.equalsIgnoreCase('warn', value)) {
            return Severity.Warning;
        }
        if (strings.equalsIgnoreCase('info', value)) {
            return Severity.Info;
        }
        return Severity.Ignore;
    }
    export function toString(severity: Severity): string {
        switch (severity) {
            case Severity.Error: return 'error';
            case Severity.Warning: return 'warning';
            case Severity.Info: return 'info';
            default: return 'ignore';
        }
    }
}
export default Severity;
