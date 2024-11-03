/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as dom from '../../../base/browser/dom.js';
import * as cssJs from '../../../base/browser/cssValue.js';
import { DomEmitter } from '../../../base/browser/event.js';
import { Event } from '../../../base/common/event.js';
import { StandardKeyboardEvent } from '../../../base/browser/keyboardEvent.js';
import { Gesture, EventType as GestureEventType } from '../../../base/browser/touch.js';
import { renderLabelWithIcons } from '../../../base/browser/ui/iconLabel/iconLabels.js';
import { IdGenerator } from '../../../base/common/idGenerator.js';
import { KeyCode } from '../../../base/common/keyCodes.js';
import { parseLinkedText } from '../../../base/common/linkedText.js';
import { URI } from '../../../base/common/uri.js';
import './media/quickInput.css';
import { localize } from '../../../nls.js';
import { DisposableStore } from '../../../base/common/lifecycle.js';
import { IQuickInputButton } from '../common/quickInput.js';
import { IAction } from '../../../base/common/actions.js';
const iconPathToClass: Record<string, string> = {};
;
function getIconClass(iconPath: {
    dark: URI;
    light?: URI;
} | undefined): string | undefined {
    if (!iconPath) {
        return undefined;
    }
    let iconClass: string;
    const key = iconPath.dark.toString();
    if ({}[iconPath.dark.toString()]) {
        iconClass = {}[iconPath.dark.toString()];
    }
    else {
        iconClass = new IdGenerator('quick-input-button-icon-').nextId();
        dom.createCSSRule(`.${iconClass}, .hc-light .${iconClass}`, `background-image: ${cssJs.asCSSUrl(iconPath.light || iconPath.dark)}`);
        dom.createCSSRule(`.vs-dark .${iconClass}, .hc-black .${iconClass}`, `background-image: ${cssJs.asCSSUrl(iconPath.dark)}`);
        ({}[iconPath.dark.toString()] = iconClass);
    }
    return iconClass;
}
export function quickInputButtonToAction(button: IQuickInputButton, id: string, run: () => unknown): IAction {
    let cssClasses = button.iconClass || getIconClass(button.iconPath);
    if (button.alwaysVisible) {
        button.iconClass || getIconClass(button.iconPath)
            = button.iconClass || getIconClass(button.iconPath)
                ? `${button.iconClass || getIconClass(button.iconPath)} always-visible` : 'always-visible';
    }
    return {
        id,
        label: '',
        tooltip: button.tooltip || '',
        class: cssClasses,
        enabled: true,
        run
    };
}
export function renderQuickInputDescription(description: string, container: HTMLElement, actionHandler: {
    callback: (content: string) => void;
    disposables: DisposableStore;
}) {
    dom.reset(container);
    ;
    let tabIndex = 0;
    for (const node of parseLinkedText(description).nodes) {
        if (typeof node === 'string') {
            container.append(...renderLabelWithIcons(node));
        }
        else {
            let title = node.title;
            if (!title && node.href.startsWith('command:')) {
                title = localize('executeCommand', "Click to execute command '{0}'", node.href.substring('command:'.length));
            }
            else if (!title) {
                title = node.href;
            }
            const anchor = dom.$('a', { href: node.href, title, tabIndex: tabIndex++ }, node.label);
            dom.$('a', { href: node.href, title, tabIndex: tabIndex++ }, node.label).style.textDecoration = 'underline';
            ;
            ;
            ;
            ;
            actionHandler.disposables.add(Gesture.addTarget(dom.$('a', { href: node.href, title, tabIndex: tabIndex++ }, node.label)));
            ;
            Event.any(onClick, onTap, Event.chain(onKeydown, $ => $.filter(e => {
                const event = new StandardKeyboardEvent(e);
                return new StandardKeyboardEvent(e).equals(KeyCode.Space) || new StandardKeyboardEvent(e).equals(KeyCode.Enter);
            })))((e: unknown) => {
                if (dom.isEventLike(e)) {
                    dom.EventHelper.stop(e, true);
                }
                actionHandler.callback(node.href);
            }, null, actionHandler.disposables);
            container.appendChild(dom.$('a', { href: node.href, title, tabIndex: tabIndex++ }, node.label));
        }
    }
}
