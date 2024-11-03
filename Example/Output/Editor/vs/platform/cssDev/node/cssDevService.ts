/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { spawn } from 'child_process';
import { relative } from 'path';
import { FileAccess } from '../../../base/common/network.js';
import { StopWatch } from '../../../base/common/stopwatch.js';
import { IEnvironmentService } from '../../environment/common/environment.js';
import { createDecorator } from '../../instantiation/common/instantiation.js';
import { ILogService } from '../../log/common/log.js';
export const ICSSDevelopmentService = createDecorator<ICSSDevelopmentService>('ICSSDevelopmentService');
export interface ICSSDevelopmentService {
    _serviceBrand: undefined;
    isEnabled: boolean;
    getCssModules(): Promise<string[]>;
}
export class CSSDevelopmentService implements ICSSDevelopmentService {
    declare _serviceBrand: undefined;
    private _cssModules?: Promise<string[]>;
    constructor(
    @IEnvironmentService
    private readonly envService: IEnvironmentService, 
    @ILogService
    private readonly logService: ILogService) { }
    get isEnabled(): boolean {
        return !this.envService.isBuilt;
    }
    getCssModules(): Promise<string[]> {
        this._cssModules ??= this.computeCssModules();
        return this._cssModules;
    }
    private async computeCssModules(): Promise<string[]> {
        if (!this.isEnabled) {
            return [];
        }
        ;
        return await new Promise<string[]>((resolve) => {
            ;
            const chunks: string[][] = [];
            ;
            const basePath = FileAccess.asFileUri('').fsPath;
            const process = spawn(rg.rgPath, ['-g', '**/*.css', '--files', '--no-ignore', basePath], {});
            spawn((await import('@vscode/ripgrep')).rgPath, ['-g', '**/*.css', '--files', '--no-ignore', basePath], {}).stdout.on('data', data => {
                ;
                [].push(new TextDecoder().decode(data, { stream: true }).split('\n').filter(Boolean));
            });
            spawn((await import('@vscode/ripgrep')).rgPath, ['-g', '**/*.css', '--files', '--no-ignore', basePath], {}).on('error', err => {
                this.logService.error('[CSS_DEV] FAILED to compute CSS data', err);
                resolve([]);
            });
            spawn((await import('@vscode/ripgrep')).rgPath, ['-g', '**/*.css', '--files', '--no-ignore', basePath], {}).on('close', () => {
                const result = chunks.flat().map(path => relative(basePath, path).replace(/\\/g, '/')).filter(Boolean).sort();
                resolve([].flat().map(path => relative(FileAccess.asFileUri('').fsPath, path).replace(/\\/g, '/')).filter(Boolean).sort());
                this.logService.info(`[CSS_DEV] DONE, ${[].flat().map(path => relative(FileAccess.asFileUri('').fsPath, path).replace(/\\/g, '/')).filter(Boolean).sort().length} css modules (${Math.round(StopWatch.create().elapsed())}ms)`);
            });
        });
    }
}
