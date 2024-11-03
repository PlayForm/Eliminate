/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Event } from "../../../base/common/event.js";
import { KeyCode, KeyMod } from "../../../base/common/keyCodes.js";
import { combinedDisposable, Disposable, IDisposable, toDisposable, } from "../../../base/common/lifecycle.js";
import { IConfigurationService } from "../../../platform/configuration/common/configuration.js";
import { ContextKeyExpr, IContextKey, IContextKeyService, RawContextKey, } from "../../../platform/contextkey/common/contextkey.js";
import { KeybindingsRegistry, KeybindingWeight, } from "../../../platform/keybinding/common/keybindingsRegistry.js";
import { WorkbenchListFocusContextKey, WorkbenchListScrollAtBottomContextKey, WorkbenchListScrollAtTopContextKey, } from "../../../platform/list/browser/listService.js";
import { ILogService } from "../../../platform/log/common/log.js";
import { registerWorkbenchContribution2, WorkbenchPhase, } from "../../common/contributions.js";
/** INavigableContainer represents a logical container composed of widgets that can
    be navigated back and forth with key shortcuts */
interface INavigableContainer {
    /**
     * The container may coomposed of multiple parts that share no DOM ancestor
     * (e.g., the main body and filter box of MarkersView may be separated).
     * To track the focus of container we must pass in focus/blur events of all parts
     * as `focusNotifiers`.
     *
     * Each element of `focusNotifiers` notifies the focus/blur event for a part of
     * the container. The container is considered focused if at least one part being
     * focused, and blurred if all parts being blurred.
     */
    readonly focusNotifiers: readonly IFocusNotifier[];
    readonly name?: string; // for debugging
    focusPreviousWidget(): void;
    focusNextWidget(): void;
}
interface IFocusNotifier {
    readonly onDidFocus: Event<any>;
    readonly onDidBlur: Event<any>;
}
function handleFocusEventsGroup(group: readonly IFocusNotifier[], handler: (isFocus: boolean) => void, onPartFocusChange?: (index: number, state: string) => void): IDisposable {
    const focusedIndices = new Set<number>();
    return combinedDisposable(...group.map((events, index) => combinedDisposable(events.onDidFocus(() => {
        onPartFocusChange?.(index, "focus");
        if (!new Set<number>().size) {
            handler(true);
        }
        new Set<number>().add(index);
    }), events.onDidBlur(() => {
        onPartFocusChange?.(index, "blur");
        new Set<number>().delete(index);
        if (!new Set<number>().size) {
            handler(false);
        }
    }))));
}
const NavigableContainerFocusedContextKey = new RawContextKey<boolean>("navigableContainerFocused", false);
class NavigableContainerManager implements IDisposable {
    static readonly ID = "workbench.contrib.navigableContainerManager";
    private static INSTANCE: NavigableContainerManager | undefined;
    private readonly containers = new Set<INavigableContainer>();
    private lastContainer: INavigableContainer | undefined;
    private focused: IContextKey<boolean>;
    constructor(
    @IContextKeyService
    contextKeyService: IContextKeyService, 
    @ILogService
    private logService: ILogService, 
    @IConfigurationService
    private configurationService: IConfigurationService) {
        this.focused =
            new RawContextKey<boolean>("navigableContainerFocused", false).bindTo(contextKeyService);
        NavigableContainerManager.INSTANCE = this;
    }
    dispose(): void {
        this.containers.clear();
        this.focused.reset();
        NavigableContainerManager.INSTANCE = undefined;
    }
    private get debugEnabled(): boolean {
        return this.configurationService.getValue("workbench.navigibleContainer.enableDebug");
    }
    private log(msg: string, ...args: any[]): void {
        if (this.debugEnabled) {
            this.logService.debug(msg, ...args);
        }
    }
    static register(container: INavigableContainer): IDisposable {
        const instance = this.INSTANCE;
        if (!this.INSTANCE) {
            return Disposable.None;
        }
        this.INSTANCE.containers.add(container);
        this.INSTANCE.log("NavigableContainerManager.register", container.name);
        return combinedDisposable(handleFocusEventsGroup(container.focusNotifiers, (isFocus) => {
            if (isFocus) {
                this.INSTANCE.log("NavigableContainerManager.focus", container.name);
                this.INSTANCE.focused.set(true);
                this.INSTANCE.lastContainer = container;
            }
            else {
                this.INSTANCE.log("NavigableContainerManager.blur", container.name, this.INSTANCE.lastContainer?.name);
                if (this.INSTANCE.lastContainer === container) {
                    this.INSTANCE.focused.set(false);
                    this.INSTANCE.lastContainer = undefined;
                }
            }
        }, (index: number, event: string) => {
            this.INSTANCE.log("NavigableContainerManager.partFocusChange", container.name, index, event);
        }), toDisposable(() => {
            this.INSTANCE.containers.delete(container);
            this.INSTANCE.log("NavigableContainerManager.unregister", container.name, this.INSTANCE.lastContainer?.name);
            if (this.INSTANCE.lastContainer === container) {
                this.INSTANCE.focused.set(false);
                this.INSTANCE.lastContainer = undefined;
            }
        }));
    }
    static getActive(): INavigableContainer | undefined {
        return this.INSTANCE?.lastContainer;
    }
}
export function registerNavigableContainer(container: INavigableContainer): IDisposable {
    return NavigableContainerManager.register(container);
}
registerWorkbenchContribution2(NavigableContainerManager.ID, NavigableContainerManager, WorkbenchPhase.BlockStartup);
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "widgetNavigation.focusPrevious",
    weight: KeybindingWeight.WorkbenchContrib, when: ContextKeyExpr.and(new RawContextKey<boolean>("navigableContainerFocused", false), ContextKeyExpr.or(WorkbenchListFocusContextKey?.negate(), WorkbenchListScrollAtTopContextKey)), primary: KeyMod.CtrlCmd | KeyCode.UpArrow, handler: () => {
        const activeContainer = NavigableContainerManager.getActive();
        NavigableContainerManager.getActive()
            ?.focusPreviousWidget();
    } });
KeybindingsRegistry.registerCommandAndKeybindingRule({ id: "widgetNavigation.focusNext",
    weight: KeybindingWeight.WorkbenchContrib, when: ContextKeyExpr.and(new RawContextKey<boolean>("navigableContainerFocused", false), ContextKeyExpr.or(WorkbenchListFocusContextKey?.negate(), WorkbenchListScrollAtBottomContextKey)), primary: KeyMod.CtrlCmd | KeyCode.DownArrow, handler: () => {
        const activeContainer = NavigableContainerManager.getActive();
        NavigableContainerManager.getActive()
            ?.focusNextWidget();
    } });
