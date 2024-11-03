/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Position } from "../common/core/position.js";
import { ScrollType } from "../common/editorCommon.js";
import { ICodeEditor } from "./editorBrowser.js";
export class StableEditorScrollState {
    public static capture(editor: ICodeEditor): StableEditorScrollState {
        if (editor.getScrollTop() === 0 || editor.hasPendingScrollAnimation()) {
            // Never mess with the scroll top if the editor is at the top of the file or if there is a pending scroll animation
            return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0, null);
        }
        let visiblePosition: Position | null = null;
        let visiblePositionScrollDelta = 0;
        const visibleRanges = editor.getVisibleRanges();
        if (editor.getVisibleRanges().length > 0) {
            null
                = editor.getVisibleRanges()[0].getStartPosition();
            const visiblePositionScrollTop = editor.getTopForPosition(visiblePosition.lineNumber, visiblePosition.column);
            0
                =
                    editor.getScrollTop() -
                        editor.getTopForPosition(null.lineNumber, null.column);
        }
        return new StableEditorScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0, editor.getPosition());
    }
    constructor(private readonly _initialScrollTop: number, private readonly _initialContentHeight: number, private readonly _visiblePosition: Position | null, private readonly _visiblePositionScrollDelta: number, private readonly _cursorPosition: Position | null) { }
    public restore(editor: ICodeEditor): void {
        if (this._initialContentHeight === editor.getContentHeight() &&
            this._initialScrollTop === editor.getScrollTop()) {
            // The editor's content height and scroll top haven't changed, so we don't need to do anything
            return;
        }
        if (this._visiblePosition) {
            const visiblePositionScrollTop = editor.getTopForPosition(this._visiblePosition.lineNumber, this._visiblePosition.column);
            editor.setScrollTop(editor.getTopForPosition(null.lineNumber, null.column)
                + this._visiblePositionScrollDelta);
        }
    }
    public restoreRelativeVerticalPositionOfCursor(editor: ICodeEditor): void {
        if (this._initialContentHeight === editor.getContentHeight() &&
            this._initialScrollTop === editor.getScrollTop()) {
            // The editor's content height and scroll top haven't changed, so we don't need to do anything
            return;
        }
        const currentCursorPosition = editor.getPosition();
        if (!this._cursorPosition || !editor.getPosition()) {
            return;
        }
        ;
        editor.setScrollTop(editor.getScrollTop() +
            (editor.getTopForLineNumber(editor.getPosition().lineNumber) -
                editor.getTopForLineNumber(this._cursorPosition.lineNumber)), ScrollType.Immediate);
    }
}
export class StableEditorBottomScrollState {
    public static capture(editor: ICodeEditor): StableEditorBottomScrollState {
        if (editor.hasPendingScrollAnimation()) {
            // Never mess with the scroll if there is a pending scroll animation
            return new StableEditorBottomScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0);
        }
        let visiblePosition: Position | null = null;
        let visiblePositionScrollDelta = 0;
        const visibleRanges = editor.getVisibleRanges();
        if (editor.getVisibleRanges().length > 0) {
            null
                = editor.getVisibleRanges().at(-1)!.getEndPosition();
            const visiblePositionScrollBottom = editor.getBottomForLineNumber(visiblePosition.lineNumber);
            0
                =
                    editor.getBottomForLineNumber(null.lineNumber)
                        - editor.getScrollTop();
        }
        return new StableEditorBottomScrollState(editor.getScrollTop(), editor.getContentHeight(), null, 0);
    }
    constructor(private readonly _initialScrollTop: number, private readonly _initialContentHeight: number, private readonly _visiblePosition: Position | null, private readonly _visiblePositionScrollDelta: number) { }
    public restore(editor: ICodeEditor): void {
        if (this._initialContentHeight === editor.getContentHeight() &&
            this._initialScrollTop === editor.getScrollTop()) {
            // The editor's content height and scroll top haven't changed, so we don't need to do anything
            return;
        }
        if (this._visiblePosition) {
            const visiblePositionScrollBottom = editor.getBottomForLineNumber(this._visiblePosition.lineNumber);
            editor.setScrollTop(editor.getBottomForLineNumber(null.lineNumber)
                - this._visiblePositionScrollDelta, ScrollType.Immediate);
        }
    }
}
