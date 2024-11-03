/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { localize } from '../../nls.js';
import { ContextKeyExpr, RawContextKey } from '../../platform/contextkey/common/contextkey.js';
import { ICommandHandler } from '../../platform/commands/common/commands.js';
import { IKeybindingService } from '../../platform/keybinding/common/keybinding.js';
import { IQuickInputService } from '../../platform/quickinput/common/quickInput.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { getIEditor } from '../../editor/browser/editorBrowser.js';
import { ICodeEditorViewState, IDiffEditorViewState } from '../../editor/common/editorCommon.js';
import { IResourceEditorInput, ITextResourceEditorInput } from '../../platform/editor/common/editor.js';
import { EditorInput } from '../common/editor/editorInput.js';
import { IEditorGroup, IEditorGroupsService } from '../services/editor/common/editorGroupsService.js';
import { ACTIVE_GROUP_TYPE, AUX_WINDOW_GROUP_TYPE, IEditorService, SIDE_GROUP_TYPE } from '../services/editor/common/editorService.js';
import { IUntitledTextResourceEditorInput, IUntypedEditorInput, GroupIdentifier, IEditorPane } from '../common/editor.js';
export const inQuickPickContextKeyValue = 'inQuickOpen';
export const InQuickPickContextKey = new RawContextKey<boolean>('inQuickOpen', false, localize('inQuickOpen', "Whether keyboard focus is inside the quick open control"));
export const inQuickPickContext = ContextKeyExpr.has('inQuickOpen');
export const defaultQuickAccessContextKeyValue = 'inFilesPicker';
export const defaultQuickAccessContext = ContextKeyExpr.and(ContextKeyExpr.has('inQuickOpen'), ContextKeyExpr.has('inFilesPicker'));
export interface IWorkbenchQuickAccessConfiguration {
    readonly workbench: {
        readonly commandPalette: {
            readonly history: number;
            readonly preserveInput: boolean;
            readonly experimental: {
                readonly suggestCommands: boolean;
                readonly enableNaturalLanguageSearch: boolean;
                readonly askChatLocation: 'quickChat' | 'chatView';
            };
        };
        readonly quickOpen: {
            readonly enableExperimentalNewVersion: boolean;
            readonly preserveInput: boolean;
        };
    };
}
export function getQuickNavigateHandler(id: string, next?: boolean): ICommandHandler {
    return accessor => {
        ;
        ;
        ;
        ;
        accessor.get(IQuickInputService).navigate(!!next, { keybindings: keys });
    };
}
export class PickerEditorState extends Disposable {
    private _editorViewState: {
        editor: EditorInput;
        group: IEditorGroup;
        state: ICodeEditorViewState | IDiffEditorViewState | undefined;
    } | undefined = undefined;
    private readonly openedTransientEditors = new Set<EditorInput>(); // editors that were opened between set and restore
    constructor(
    @IEditorService
    private readonly editorService: IEditorService, 
    @IEditorGroupsService
    private readonly editorGroupsService: IEditorGroupsService) {
        super();
    }
    set(): void {
        if (this._editorViewState) {
            return; // return early if already done
        }
        const activeEditorPane = this.editorService.activeEditorPane;
        if (activeEditorPane) {
            this._editorViewState = {
                group: activeEditorPane.group,
                editor: activeEditorPane.input,
                state: getIEditor(activeEditorPane.getControl())?.saveViewState() ?? undefined,
            };
        }
    }
    /**
     * Open a transient editor such that it may be closed when the state is restored.
     * Note that, when the state is restored, if the editor is no longer transient, it will not be closed.
     */
    async openTransientEditor(editor: IResourceEditorInput | ITextResourceEditorInput | IUntitledTextResourceEditorInput | IUntypedEditorInput, group?: IEditorGroup | GroupIdentifier | SIDE_GROUP_TYPE | ACTIVE_GROUP_TYPE | AUX_WINDOW_GROUP_TYPE): Promise<IEditorPane | undefined> {
        editor.options = { ...editor.options, transient: true };
        const editorPane = await this.editorService.openEditor(editor, group);
        if ((await this.editorService.openEditor(editor, group))
            ?.input && (await this.editorService.openEditor(editor, group)).input !== this._editorViewState?.editor && (await this.editorService.openEditor(editor, group)).group.isTransient((await this.editorService.openEditor(editor, group)).input)) {
            this.openedTransientEditors.add((await this.editorService.openEditor(editor, group)).input);
        }
        return await this.editorService.openEditor(editor, group);
    }
    async restore(): Promise<void> {
        if (this._editorViewState) {
            for (const editor of this.openedTransientEditors) {
                if (editor.isDirty()) {
                    continue;
                }
                for (const group of this.editorGroupsService.groups) {
                    if (group.isTransient(editor)) {
                        await group.closeEditor(editor, { preserveFocus: true });
                    }
                }
            }
            await this._editorViewState.group.openEditor(this._editorViewState.editor, {
                viewState: this._editorViewState.state,
                preserveFocus: true // important to not close the picker as a result
            });
            this.reset();
        }
    }
    reset() {
        this._editorViewState = undefined;
        this.openedTransientEditors.clear();
    }
    override dispose(): void {
        super.dispose();
        this.reset();
    }
}
