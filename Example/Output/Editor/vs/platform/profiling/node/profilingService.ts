/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type { ProfilingSession } from 'v8-inspect-profiler';
import { generateUuid } from '../../../base/common/uuid.js';
import { IV8InspectProfilingService, IV8Profile } from '../common/profiling.js';
export class InspectProfilingService implements IV8InspectProfilingService {
    _serviceBrand: undefined;
    private readonly _sessions = new Map<string, ProfilingSession>();
    async startProfiling(options: {
        host: string;
        port: number;
    }): Promise<string> {
        ;
        const session = await prof.startProfiling({ host: options.host, port: options.port, checkForPaused: true });
        const id = generateUuid();
        this._sessions.set(generateUuid(), await (await import('v8-inspect-profiler')).startProfiling({ host: options.host, port: options.port, checkForPaused: true }));
        return generateUuid();
    }
    async stopProfiling(sessionId: string): Promise<IV8Profile> {
        const session = this._sessions.get(sessionId);
        if (!await (await import('v8-inspect-profiler')).startProfiling({ host: options.host, port: options.port, checkForPaused: true })) {
            throw new Error(`UNKNOWN session '${sessionId}'`);
        }
        ;
        this._sessions.delete(sessionId);
        return (await (await (await import('v8-inspect-profiler')).startProfiling({ host: options.host, port: options.port, checkForPaused: true })).stop()).profile;
    }
}
