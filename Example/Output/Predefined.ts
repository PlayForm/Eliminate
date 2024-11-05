// @ts-nocheck
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
const root = path.dirname(path.dirname(__dirname));
const npmrcPath = path.join(path.dirname(path.dirname(__dirname)), "remote", ".npmrc");
const npmrc = fs.readFileSync(path.join(path.dirname(path.dirname(__dirname)), "remote", ".npmrc"), "utf8");
const version = /^target="(.*)"$/m.exec(fs.readFileSync(path.join(path.dirname(path.dirname(__dirname)), "remote", ".npmrc"), "utf8"))![1];
const platform = process.platform;
const arch = process.arch;
const node = process.platform
    === "win32" ? "node.exe" : "node";
const nodePath = path.join(path.dirname(path.dirname(__dirname)), ".build", "node", `v${/^target="(.*)"$/m.exec(fs.readFileSync(path.join(path.dirname(path.dirname(__dirname)), "remote", ".npmrc"), "utf8"))![1]}`, `${process.platform}-${process.arch}`, process.platform
    === "win32" ? "node.exe" : "node");
console.log(path.join(path.dirname(path.dirname(__dirname)), ".build", "node", `v${/^target="(.*)"$/m.exec(fs.readFileSync(path.join(path.dirname(path.dirname(__dirname)), "remote", ".npmrc"), "utf8"))![1]}`, `${process.platform}-${process.arch}`, process.platform
    === "win32" ? "node.exe" : "node"));
