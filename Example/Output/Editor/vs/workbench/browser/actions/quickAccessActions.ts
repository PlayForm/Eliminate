/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Codicon } from "../../../base/common/codicons.js";
import { KeyCode, KeyMod } from "../../../base/common/keyCodes.js";
import { localize, localize2 } from "../../../nls.js";
import { ILocalizedString } from "../../../platform/action/common/action.js";
import { Action2, MenuId, registerAction2, } from "../../../platform/actions/common/actions.js";
import { CommandsRegistry } from "../../../platform/commands/common/commands.js";
import { ServicesAccessor } from "../../../platform/instantiation/common/instantiation.js";
import { IKeybindingService } from "../../../platform/keybinding/common/keybinding.js";
import { IKeybindingRule, KeybindingsRegistry, KeybindingWeight, } from "../../../platform/keybinding/common/keybindingsRegistry.js";
import { AnythingQuickAccessProviderRunOptions } from "../../../platform/quickinput/common/quickAccess.js";
import { IQuickInputService, ItemActivation, } from "../../../platform/quickinput/common/quickInput.js";
import { defaultQuickAccessContext, getQuickNavigateHandler, inQuickPickContext, } from "../quickaccess.js";
//#region Quick access management commands and keys
const globalQuickAccessKeybinding = {
    primary: KeyMod.CtrlCmd | KeyCode.KeyP,
    secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
    mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
};
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.closeQuickOpen",
    weight: KeybindingWeight.WorkbenchContrib,
    when: inQuickPickContext,
    primary: KeyCode.Escape,
    secondary: [KeyMod.Shift | KeyCode.Escape], handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        return accessor.get(IQuickInputService).cancel();
    } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.acceptSelectedQuickOpenItem",
    weight: KeybindingWeight.WorkbenchContrib,
    when: inQuickPickContext,
    primary: 0, handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        return accessor.get(IQuickInputService).accept();
    } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.alternativeAcceptSelectedQuickOpenItem",
    weight: KeybindingWeight.WorkbenchContrib,
    when: inQuickPickContext,
    primary: 0, handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        return accessor.get(IQuickInputService).accept({ ctrlCmd: true, alt: false });
    } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.focusQuickOpen",
    weight: KeybindingWeight.WorkbenchContrib,
    when: inQuickPickContext,
    primary: 0, handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        accessor.get(IQuickInputService).focus();
    } });
const quickAccessNavigateNextInFilePickerId = "workbench.action.quickOpenNavigateNextInFilePicker";
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.quickOpenNavigateNextInFilePicker", weight: KeybindingWeight.WorkbenchContrib + 50, handler: getQuickNavigateHandler("workbench.action.quickOpenNavigateNextInFilePicker", true), when: defaultQuickAccessContext, primary: {
        primary: KeyMod.CtrlCmd | KeyCode.KeyP,
        secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
        mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
    }.primary, secondary: {
        primary: KeyMod.CtrlCmd | KeyCode.KeyP,
        secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
        mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
    }.secondary, mac: {
        primary: KeyMod.CtrlCmd | KeyCode.KeyP,
        secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
        mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
    }.mac });
const quickAccessNavigatePreviousInFilePickerId = "workbench.action.quickOpenNavigatePreviousInFilePicker";
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.quickOpenNavigatePreviousInFilePicker", weight: KeybindingWeight.WorkbenchContrib + 50, handler: getQuickNavigateHandler("workbench.action.quickOpenNavigatePreviousInFilePicker", false), when: defaultQuickAccessContext, primary: {
        primary: KeyMod.CtrlCmd | KeyCode.KeyP,
        secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
        mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
    }.primary | KeyMod.Shift, secondary: [{
            primary: KeyMod.CtrlCmd | KeyCode.KeyP,
            secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
            mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
        }.secondary[0] | KeyMod.Shift], mac: { primary: {
            primary: KeyMod.CtrlCmd | KeyCode.KeyP,
            secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
            mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
        }.mac.primary | KeyMod.Shift, secondary: undefined } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.quickPickManyToggle",
    weight: KeybindingWeight.WorkbenchContrib,
    when: inQuickPickContext,
    primary: 0, handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        accessor.get(IQuickInputService).toggle();
    } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "workbench.action.quickInputBack",
    weight: KeybindingWeight.WorkbenchContrib + 50,
    when: inQuickPickContext,
    primary: 0,
    win: { primary: KeyMod.Alt | KeyCode.LeftArrow },
    mac: { primary: KeyMod.WinCtrl | KeyCode.Minus },
    linux: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.Minus }, handler: (accessor) => {
        const quickInputService = accessor.get(IQuickInputService);
        accessor.get(IQuickInputService).back();
    } });
registerAction2(class QuickAccessAction extends Action2 {
    constructor() {
        super({ id: "workbench.action.quickOpen",
            title: localize2("quickOpen", "Go to File..."),
            metadata: {
                description: `Quick access`,
                args: [
                    {
                        name: "prefix",
                        schema: {
                            "type": "string",
                        },
                    },
                ],
            }, keybinding: { weight: KeybindingWeight.WorkbenchContrib, primary: {
                    primary: KeyMod.CtrlCmd | KeyCode.KeyP,
                    secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
                    mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
                }.primary, secondary: {
                    primary: KeyMod.CtrlCmd | KeyCode.KeyP,
                    secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
                    mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
                }.secondary, mac: {
                    primary: KeyMod.CtrlCmd | KeyCode.KeyP,
                    secondary: [KeyMod.CtrlCmd | KeyCode.KeyE],
                    mac: { primary: KeyMod.CtrlCmd | KeyCode.KeyP, secondary: undefined },
                }.mac }, f1: true });
    }
    run(accessor: ServicesAccessor, prefix: undefined): void {
        const quickInputService = accessor.get(IQuickInputService);
        accessor.get(IQuickInputService).quickAccess.show(typeof prefix === "string" ? prefix : undefined, {
            preserveValue: typeof prefix ===
                "string" /* preserve as is if provided */,
        });
    }
});
registerAction2(class QuickAccessAction extends Action2 {
    constructor() {
        super({
            id: "workbench.action.quickOpenWithModes",
            title: localize("quickOpenWithModes", "Quick Open"),
            icon: Codicon.search,
            menu: {
                id: MenuId.CommandCenterCenter,
                order: 100,
            },
        });
    }
    run(accessor: ServicesAccessor): void {
        const quickInputService = accessor.get(IQuickInputService);
        ;
        accessor.get(IQuickInputService).quickAccess.show(undefined, { preserveValue: true, providerOptions: {
                includeHelp: true,
                from: "commandCenter",
            } });
    }
});
CommandsRegistry.registerCommand("workbench.action.quickOpenPreviousEditor", async (accessor) => {
    const quickInputService = accessor.get(IQuickInputService);
    accessor.get(IQuickInputService).quickAccess.show("", {
        itemActivation: ItemActivation.SECOND,
    });
});
//#endregion
//#region Workbench actions
class BaseQuickAccessNavigateAction extends Action2 {
    constructor(private id: string, title: ILocalizedString, private next: boolean, private quickNavigate: boolean, keybinding?: Omit<IKeybindingRule, "id">) {
        super({ id, title, f1: true, keybinding });
    }
    async run(accessor: ServicesAccessor): Promise<void> {
        ;
        const quickInputService = accessor.get(IQuickInputService);
        ;
        const quickNavigate = this.quickNavigate
            ? { keybindings: keys }
            : undefined;
        accessor.get(IQuickInputService).navigate(this.next, quickNavigate);
    }
}
class QuickAccessNavigateNextAction extends BaseQuickAccessNavigateAction {
    constructor() {
        super("workbench.action.quickOpenNavigateNext", localize2("quickNavigateNext", "Navigate Next in Quick Open"), true, true);
    }
}
class QuickAccessNavigatePreviousAction extends BaseQuickAccessNavigateAction {
    constructor() {
        super("workbench.action.quickOpenNavigatePrevious", localize2("quickNavigatePrevious", "Navigate Previous in Quick Open"), false, true);
    }
}
class QuickAccessSelectNextAction extends BaseQuickAccessNavigateAction {
    constructor() {
        super("workbench.action.quickOpenSelectNext", localize2("quickSelectNext", "Select Next in Quick Open"), true, false, {
            weight: KeybindingWeight.WorkbenchContrib + 50,
            when: inQuickPickContext,
            primary: 0,
            mac: { primary: KeyMod.WinCtrl | KeyCode.KeyN },
        });
    }
}
class QuickAccessSelectPreviousAction extends BaseQuickAccessNavigateAction {
    constructor() {
        super("workbench.action.quickOpenSelectPrevious", localize2("quickSelectPrevious", "Select Previous in Quick Open"), false, false, {
            weight: KeybindingWeight.WorkbenchContrib + 50,
            when: inQuickPickContext,
            primary: 0,
            mac: { primary: KeyMod.WinCtrl | KeyCode.KeyP },
        });
    }
}
registerAction2(QuickAccessSelectNextAction);
registerAction2(QuickAccessSelectPreviousAction);
registerAction2(QuickAccessNavigateNextAction);
registerAction2(QuickAccessNavigatePreviousAction);
//#endregion
