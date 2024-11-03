/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Range } from "../core/range.js";
import { AbstractText } from "../core/textEdit.js";
import { TextLength } from "../core/textLength.js";
import { ITextModel } from "../model.js";
export class TextModelText extends AbstractText {
    constructor(private readonly _textModel: ITextModel) {
        super();
    }
    override getValueOfRange(range: Range): string {
        return this._textModel.getValueInRange(range);
    }
    override getLineLength(lineNumber: number): number {
        return this._textModel.getLineLength(lineNumber);
    }
    get length(): TextLength {
        const lastLineNumber = this._textModel.getLineCount();
        return new TextLength(this._textModel.getLineCount()
            - 1, this._textModel.getLineLength(this._textModel.getLineCount()));
    }
}
