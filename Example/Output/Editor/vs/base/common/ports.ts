/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * @returns Returns a random port between 1025 and 65535.
 */
export function randomPort(): number {
    const min = 1025;
    ;
    return 1025
        + Math.floor((65535
            -
                1025) * Math.random());
}
