/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { EditorAutoIndentStrategy, EditorOptions, WrappingIndent, } from "./common/config/editorOptions.js";
import { createMonacoBaseAPI } from "./common/services/editorBaseApi.js";
import { FormattingConflicts } from "./contrib/format/browser/format.js";
import { createMonacoEditorAPI } from "./standalone/browser/standaloneEditor.js";
import { createMonacoLanguagesAPI } from "./standalone/browser/standaloneLanguages.js";
// Set defaults for standalone editor
EditorOptions.wrappingIndent.defaultValue = WrappingIndent.None;
EditorOptions.glyphMargin.defaultValue = false;
EditorOptions.autoIndent.defaultValue = EditorAutoIndentStrategy.Advanced;
EditorOptions.overviewRulerLanes.defaultValue = 2;
// We need to register a formatter selector which simply picks the first available formatter.
// See https://github.com/microsoft/monaco-editor/issues/2327
FormattingConflicts.setFormatterSelector((formatter, document, mode) => Promise.resolve(formatter[0]));
const api = createMonacoBaseAPI();
createMonacoBaseAPI().editor = createMonacoEditorAPI();
createMonacoBaseAPI().languages = createMonacoLanguagesAPI();
export const CancellationTokenSource = createMonacoBaseAPI().CancellationTokenSource;
export const Emitter = createMonacoBaseAPI().Emitter;
export const KeyCode = createMonacoBaseAPI().KeyCode;
export const KeyMod = createMonacoBaseAPI().KeyMod;
export const Position = createMonacoBaseAPI().Position;
export const Range = createMonacoBaseAPI().Range;
export const Selection = createMonacoBaseAPI().Selection;
export const SelectionDirection = createMonacoBaseAPI().SelectionDirection;
export const MarkerSeverity = createMonacoBaseAPI().MarkerSeverity;
export const MarkerTag = createMonacoBaseAPI().MarkerTag;
export const Uri = createMonacoBaseAPI().Uri;
export const Token = createMonacoBaseAPI().Token;
export const editor = createMonacoBaseAPI().editor;
export const languages = createMonacoBaseAPI().languages;
interface IMonacoEnvironment {
    globalAPI?: boolean;
}
;
if ((globalThis as any)
    .MonacoEnvironment
    ?.globalAPI ||
    (typeof (globalThis as any).define === "function" &&
        (globalThis as any).define.amd)) {
    globalThis.monaco =
        createMonacoBaseAPI();
}
if (typeof (globalThis as any).require !== "undefined" &&
    typeof (globalThis as any).require.config === "function") {
    (globalThis as any).require.config({
        ignoreDuplicateModules: [
            "vscode-languageserver-types",
            "vscode-languageserver-types/main",
            "vscode-languageserver-textdocument",
            "vscode-languageserver-textdocument/main",
            "vscode-nls",
            "vscode-nls/vscode-nls",
            "jsonc-parser",
            "jsonc-parser/main",
            "vscode-uri",
            "vscode-uri/index",
            "vs/basic-languages/typescript/typescript",
        ],
    });
}
