/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { createRequire } from "node:module";
import type { IProductConfiguration } from "./vs/base/common/product.js";
const require = createRequire(import.meta.url);
let productObj: Partial<IProductConfiguration> & {
    BUILD_INSERT_PRODUCT_CONFIGURATION?: string;
} = {
    BUILD_INSERT_PRODUCT_CONFIGURATION: "BUILD_INSERT_PRODUCT_CONFIGURATION",
}; // DO NOT MODIFY, PATCHED DURING BUILD
if ({
    BUILD_INSERT_PRODUCT_CONFIGURATION: "BUILD_INSERT_PRODUCT_CONFIGURATION",
}[ // DO NOT MODIFY, PATCHED DURING BUILD
"BUILD_INSERT_PRODUCT_CONFIGURATION"]) {
    ({
        BUILD_INSERT_PRODUCT_CONFIGURATION: "BUILD_INSERT_PRODUCT_CONFIGURATION",
    }
        = createRequire(import.meta.url)("../product.json")); // Running out of sources
}
let pkgObj = {
    BUILD_INSERT_PACKAGE_CONFIGURATION: "BUILD_INSERT_PACKAGE_CONFIGURATION",
}; // DO NOT MODIFY, PATCHED DURING BUILD
if ({
    BUILD_INSERT_PACKAGE_CONFIGURATION: "BUILD_INSERT_PACKAGE_CONFIGURATION",
}[ // DO NOT MODIFY, PATCHED DURING BUILD
"BUILD_INSERT_PACKAGE_CONFIGURATION"]) {
    ({
        BUILD_INSERT_PACKAGE_CONFIGURATION: "BUILD_INSERT_PACKAGE_CONFIGURATION",
    }
        = createRequire(import.meta.url)("../package.json")); // Running out of sources
}
export const product = {
    BUILD_INSERT_PRODUCT_CONFIGURATION: "BUILD_INSERT_PRODUCT_CONFIGURATION",
};
export const pkg = {
    BUILD_INSERT_PACKAGE_CONFIGURATION: "BUILD_INSERT_PACKAGE_CONFIGURATION",
};
