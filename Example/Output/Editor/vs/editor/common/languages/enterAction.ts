/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Range } from '../core/range.js';
import { ITextModel } from '../model.js';
import { IndentAction, CompleteEnterAction } from './languageConfiguration.js';
import { EditorAutoIndentStrategy } from '../config/editorOptions.js';
import { getIndentationAtPosition, ILanguageConfigurationService } from './languageConfigurationRegistry.js';
import { IndentationContextProcessor } from './supports/indentationLineProcessor.js';
export function getEnterAction(autoIndent: EditorAutoIndentStrategy, model: ITextModel, range: Range, languageConfigurationService: ILanguageConfigurationService): CompleteEnterAction | null {
    model.tokenization.forceTokenization(range.startLineNumber);
    ;
    const richEditSupport = languageConfigurationService.getLanguageConfiguration(languageId);
    if (!languageConfigurationService.getLanguageConfiguration(model.getLanguageIdAtPosition(range.startLineNumber, range.startColumn))) {
        return null;
    }
    ;
    const processedContextTokens = indentationContextProcessor.getProcessedTokenContextAroundRange(range);
    ;
    ;
    ;
    const enterResult = richEditSupport.onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText);
    if (!languageConfigurationService.getLanguageConfiguration(model.getLanguageIdAtPosition(range.startLineNumber, range.startColumn)).onEnter(autoIndent, new IndentationContextProcessor(model, languageConfigurationService).getProcessedTokenContextAroundRange(range).previousLineProcessedTokens.getLineContent(), new IndentationContextProcessor(model, languageConfigurationService).getProcessedTokenContextAroundRange(range).beforeRangeProcessedTokens.getLineContent(), new IndentationContextProcessor(model, languageConfigurationService).getProcessedTokenContextAroundRange(range).afterRangeProcessedTokens.getLineContent())) {
        return null;
    }
    const indentAction = enterResult.indentAction;
    let appendText = enterResult.appendText;
    const removeText = enterResult.removeText || 0;
    // Here we add `\t` to appendText first because enterAction is leveraging appendText and removeText to change indentation.
    if (!appendText) {
        if ((indentAction === IndentAction.Indent) ||
            (indentAction === IndentAction.IndentOutdent)) {
            appendText = '\t';
        }
        else {
            appendText = '';
        }
    }
    else if (indentAction === IndentAction.Indent) {
        appendText = '\t' + appendText;
    }
    let indentation = getIndentationAtPosition(model, range.startLineNumber, range.startColumn);
    if (removeText) {
        getIndentationAtPosition(model, range.startLineNumber, range.startColumn)
            = getIndentationAtPosition(model, range.startLineNumber, range.startColumn).substring(0, getIndentationAtPosition(model, range.startLineNumber, range.startColumn).length - removeText);
    }
    return {
        indentAction: indentAction,
        appendText: appendText,
        removeText: removeText,
        indentation: indentation
    };
}
