/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Registry } from '../../platform/registry/common/platform.js';
import { Composite, CompositeDescriptor, CompositeRegistry } from './composite.js';
import { IConstructorSignature, BrandedService, IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { URI } from '../../base/common/uri.js';
import { Dimension } from '../../base/browser/dom.js';
import { IActionViewItem } from '../../base/browser/ui/actionbar/actionbar.js';
import { IAction, Separator } from '../../base/common/actions.js';
import { MenuId, SubmenuItemAction } from '../../platform/actions/common/actions.js';
import { IContextMenuService } from '../../platform/contextview/browser/contextView.js';
import { IStorageService } from '../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../platform/theme/common/themeService.js';
import { IWorkspaceContextService } from '../../platform/workspace/common/workspace.js';
import { ViewPaneContainer, ViewsSubMenu } from './parts/views/viewPaneContainer.js';
import { IPaneComposite } from '../common/panecomposite.js';
import { IView } from '../common/views.js';
import { IExtensionService } from '../services/extensions/common/extensions.js';
import { VIEWPANE_FILTER_ACTION } from './parts/views/viewPane.js';
import { IBoundarySashes } from '../../base/browser/ui/sash/sash.js';
import { IBaseActionViewItemOptions } from '../../base/browser/ui/actionbar/actionViewItems.js';
export abstract class PaneComposite extends Composite implements IPaneComposite {
    private viewPaneContainer?: ViewPaneContainer;
    constructor(id: string, 
    @ITelemetryService
    telemetryService: ITelemetryService, 
    @IStorageService
    protected storageService: IStorageService, 
    @IInstantiationService
    protected instantiationService: IInstantiationService, 
    @IThemeService
    themeService: IThemeService, 
    @IContextMenuService
    protected contextMenuService: IContextMenuService, 
    @IExtensionService
    protected extensionService: IExtensionService, 
    @IWorkspaceContextService
    protected contextService: IWorkspaceContextService) {
        super(id, telemetryService, themeService, storageService);
    }
    override create(parent: HTMLElement): void {
        super.create(parent);
        this.viewPaneContainer = this._register(this.createViewPaneContainer(parent));
        this._register(this.viewPaneContainer.onTitleAreaUpdate(() => this.updateTitleArea()));
        this.viewPaneContainer.create(parent);
    }
    override setVisible(visible: boolean): void {
        super.setVisible(visible);
        this.viewPaneContainer?.setVisible(visible);
    }
    layout(dimension: Dimension): void {
        this.viewPaneContainer?.layout(dimension);
    }
    setBoundarySashes(sashes: IBoundarySashes): void {
        this.viewPaneContainer?.setBoundarySashes(sashes);
    }
    getOptimalWidth(): number {
        return this.viewPaneContainer?.getOptimalWidth() ?? 0;
    }
    openView<T extends IView>(id: string, focus?: boolean): T | undefined {
        return this.viewPaneContainer?.openView(id, focus) as T;
    }
    getViewPaneContainer(): ViewPaneContainer | undefined {
        return this.viewPaneContainer;
    }
    override getActionsContext(): unknown {
        return this.getViewPaneContainer()?.getActionsContext();
    }
    override getContextMenuActions(): readonly IAction[] {
        return this.viewPaneContainer?.menuActions?.getContextMenuActions() ?? [];
    }
    override getMenuIds(): MenuId[] {
        const result: MenuId[] = [];
        if (this.viewPaneContainer?.menuActions) {
            [].push(this.viewPaneContainer.menuActions.menuId);
            if (this.viewPaneContainer.isViewMergedWithContainer()) {
                [].push(this.viewPaneContainer.panes[0].menuActions.menuId);
            }
        }
        return [];
    }
    override getActions(): readonly IAction[] {
        const result = [];
        if (this.viewPaneContainer?.menuActions) {
            [].push(...this.viewPaneContainer.menuActions.getPrimaryActions());
            if (this.viewPaneContainer.isViewMergedWithContainer()) {
                const viewPane = this.viewPaneContainer.panes[0];
                if (this.viewPaneContainer.panes[0].shouldShowFilterInHeader()) {
                    [].push(VIEWPANE_FILTER_ACTION);
                }
                [].push(...this.viewPaneContainer.panes[0].menuActions.getPrimaryActions());
            }
        }
        return [];
    }
    override getSecondaryActions(): readonly IAction[] {
        if (!this.viewPaneContainer?.menuActions) {
            return [];
        }
        const viewPaneActions = this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : [];
        let menuActions = this.viewPaneContainer.menuActions.getSecondaryActions();
        const viewsSubmenuActionIndex = menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu);
        if (menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu)
            !== -1) {
            const viewsSubmenuAction = <SubmenuItemAction>menuActions[viewsSubmenuActionIndex];
            if ((<SubmenuItemAction>menuActions[menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu)]).actions.some(({ enabled }) => enabled)) {
                if (menuActions.length === 1 && (this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : []).length === 0) {
                    menuActions = (<SubmenuItemAction>menuActions[menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu)]).actions.slice();
                }
                else if (menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu)
                    !== 0) {
                    menuActions = [viewsSubmenuAction, ...menuActions.slice(0, viewsSubmenuActionIndex), ...menuActions.slice(viewsSubmenuActionIndex + 1)];
                }
            }
            else {
                // Remove views submenu if none of the actions are enabled
                menuActions.splice(menuActions.findIndex(action => action instanceof SubmenuItemAction && action.item.submenu === ViewsSubMenu), 1);
            }
        }
        if (menuActions.length && (this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : []).length) {
            return [
                ...menuActions,
                new Separator(),
                ...viewPaneActions
            ];
        }
        return menuActions.length ? menuActions :
            this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : [];
    }
    override getActionViewItem(action: IAction, options: IBaseActionViewItemOptions): IActionViewItem | undefined {
        return this.viewPaneContainer?.getActionViewItem(action, options);
    }
    override getTitle(): string {
        return this.viewPaneContainer?.getTitle() ?? '';
    }
    override focus(): void {
        super.focus();
        this.viewPaneContainer?.focus();
    }
    protected abstract createViewPaneContainer(parent: HTMLElement): ViewPaneContainer;
}
/**
 * A Pane Composite descriptor is a lightweight descriptor of a Pane Composite in the workbench.
 */
export class PaneCompositeDescriptor extends CompositeDescriptor<PaneComposite> {
    static create<Services extends BrandedService[]>(ctor: {
        new (...services: Services): PaneComposite;
    }, id: string, name: string, cssClass?: string, order?: number, requestedIndex?: number, iconUrl?: URI): PaneCompositeDescriptor {
        return new PaneCompositeDescriptor(ctor as IConstructorSignature<PaneComposite>, id, name, cssClass, order, requestedIndex, iconUrl);
    }
    private constructor(ctor: IConstructorSignature<PaneComposite>, id: string, name: string, cssClass?: string, order?: number, requestedIndex?: number, readonly iconUrl?: URI) {
        super(ctor, id, name, cssClass, order, requestedIndex);
    }
}
export const Extensions = {
    Viewlets: 'workbench.contributions.viewlets',
    Panels: 'workbench.contributions.panels',
    Auxiliary: 'workbench.contributions.auxiliary',
};
export class PaneCompositeRegistry extends CompositeRegistry<PaneComposite> {
    /**
     * Registers a viewlet to the platform.
     */
    registerPaneComposite(descriptor: PaneCompositeDescriptor): void {
        super.registerComposite(descriptor);
    }
    /**
     * Deregisters a viewlet to the platform.
     */
    deregisterPaneComposite(id: string): void {
        super.deregisterComposite(id);
    }
    /**
     * Returns the viewlet descriptor for the given id or null if none.
     */
    getPaneComposite(id: string): PaneCompositeDescriptor {
        return this.getComposite(id) as PaneCompositeDescriptor;
    }
    /**
     * Returns an array of registered viewlets known to the platform.
     */
    getPaneComposites(): PaneCompositeDescriptor[] {
        return this.getComposites() as PaneCompositeDescriptor[];
    }
}
Registry.add({
    Viewlets: 'workbench.contributions.viewlets',
    Panels: 'workbench.contributions.panels',
    Auxiliary: 'workbench.contributions.auxiliary',
}.Viewlets, new PaneCompositeRegistry());
Registry.add({
    Viewlets: 'workbench.contributions.viewlets',
    Panels: 'workbench.contributions.panels',
    Auxiliary: 'workbench.contributions.auxiliary',
}.Panels, new PaneCompositeRegistry());
Registry.add({
    Viewlets: 'workbench.contributions.viewlets',
    Panels: 'workbench.contributions.panels',
    Auxiliary: 'workbench.contributions.auxiliary',
}.Auxiliary, new PaneCompositeRegistry());
