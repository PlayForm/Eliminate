// @ts-nocheck
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
const root = path.dirname(path.dirname(__dirname));
const npmrcPath = path.join(root, "remote", ".npmrc");
const npmrc = fs.readFileSync(npmrcPath, "utf8");
const platform = process.platform;
const nodePath = path.join(root, ".build", "node", `v${/^target="(.*)"$/m.exec(npmrc)![1]}`, `${platform}-${process.arch}`, platform === "win32" ? "node.exe" : "node");
console.log(nodePath);
