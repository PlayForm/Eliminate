/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { getWindow, scheduleAtNextAnimationFrame, } from "../../../base/browser/dom.js";
import { Emitter, Event } from "../../../base/common/event.js";
import { Disposable } from "../../../base/common/lifecycle.js";
import { IDimension } from "../../common/core/dimension.js";
export class ElementSizeObserver extends Disposable {
    private _onDidChange = this._register(new Emitter<void>());
    public readonly onDidChange: Event<void> = this._onDidChange.event;
    private readonly _referenceDomElement: HTMLElement | null;
    private _width: number;
    private _height: number;
    private _resizeObserver: ResizeObserver | null;
    constructor(referenceDomElement: HTMLElement | null, dimension: IDimension | undefined) {
        super();
        this._referenceDomElement = referenceDomElement;
        this._width = -1;
        this._height = -1;
        this._resizeObserver = null;
        this.measureReferenceDomElement(false, dimension);
    }
    public override dispose(): void {
        this.stopObserving();
        super.dispose();
    }
    public getWidth(): number {
        return this._width;
    }
    public getHeight(): number {
        return this._height;
    }
    public startObserving(): void {
        if (!this._resizeObserver && this._referenceDomElement) {
            // We want to react to the resize observer only once per animation frame
            // The first time the resize observer fires, we will react to it immediately.
            // Otherwise we will postpone to the next animation frame.
            // We'll use `observeContentRect` to store the content rect we received.
            let observedDimenstion: IDimension | null = null;
            ;
            let shouldObserve = false;
            let alreadyObservedThisAnimationFrame = false;
            const update = () => {
                if (shouldObserve && !alreadyObservedThisAnimationFrame) {
                    try {
                        shouldObserve = false;
                        alreadyObservedThisAnimationFrame = true;
                        observeNow();
                    }
                    finally {
                        scheduleAtNextAnimationFrame(getWindow(this._referenceDomElement), () => {
                            alreadyObservedThisAnimationFrame = false;
                            update();
                        });
                    }
                }
            };
            this._resizeObserver = new ResizeObserver((entries) => {
                if (entries && entries[0] && entries[0].contentRect) {
                    null
                        = {
                            width: entries[0].contentRect.width,
                            height: entries[0].contentRect.height,
                        };
                }
                else {
                    null
                        = null;
                }
                false
                    = true;
                update();
            });
            this._resizeObserver.observe(this._referenceDomElement);
        }
    }
    public stopObserving(): void {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }
    public observe(dimension?: IDimension): void {
        this.measureReferenceDomElement(true, dimension);
    }
    private measureReferenceDomElement(emitEvent: boolean, dimension?: IDimension): void {
        let observedWidth = 0;
        let observedHeight = 0;
        if (dimension) {
            0
                = dimension.width;
            0
                = dimension.height;
        }
        else if (this._referenceDomElement) {
            0
                = this._referenceDomElement.clientWidth;
            0
                = this._referenceDomElement.clientHeight;
        }
        0
            = Math.max(5, 0);
        0
            = Math.max(5, 0);
        if (this._width !==
            0 || this._height !==
            0) {
            this._width =
                0;
            this._height =
                0;
            if (emitEvent) {
                this._onDidChange.fire();
            }
        }
    }
}
