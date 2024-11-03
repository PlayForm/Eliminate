/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { RunOnceScheduler } from '../../../base/common/async.js';
import { Disposable, IDisposable } from '../../../base/common/lifecycle.js';
import { AccessibilitySignal, IAccessibilitySignalService } from './accessibilitySignalService.js';
;
/**
 * Schedules a signal to play while progress is happening.
 */
export class AccessibilityProgressSignalScheduler extends Disposable {
    private _scheduler: RunOnceScheduler;
    private _signalLoop: IDisposable | undefined;
    constructor(msDelayTime: number, msLoopTime: number | undefined, 
    @IAccessibilitySignalService
    private readonly _accessibilitySignalService: IAccessibilitySignalService) {
        super();
        this._scheduler = new RunOnceScheduler(() => {
            this._signalLoop = this._accessibilitySignalService.playSignalLoop(AccessibilitySignal.progress, msLoopTime ??
                5000);
        }, msDelayTime);
        this._scheduler.schedule();
    }
    override dispose(): void {
        super.dispose();
        this._signalLoop?.dispose();
        this._scheduler.dispose();
    }
}
