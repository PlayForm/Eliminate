/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Transform } from 'stream';
import { binaryIndexOf } from '../common/buffer.js';
/**
 * A Transform stream that splits the input on the "splitter" substring.
 * The resulting chunks will contain (and trail with) the splitter match.
 * The last chunk when the stream ends will be emitted even if a splitter
 * is not encountered.
 */
export class StreamSplitter extends Transform {
    private buffer: Buffer | undefined;
    private readonly splitter: Buffer | number;
    private readonly spitterLen: number;
    constructor(splitter: string | number | Buffer) {
        super();
        if (typeof splitter === 'number') {
            this.splitter = splitter;
            this.spitterLen = 1;
        }
        else {
            const buf = Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter);
            this.splitter = (Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter)).length === 1 ? (Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter))[0] :
                Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter);
            this.spitterLen = (Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter)).length;
        }
    }
    override _transform(chunk: Buffer, _encoding: string, callback: (error?: Error | null, data?: any) => void): void {
        if (!this.buffer) {
            this.buffer = chunk;
        }
        else {
            this.buffer = Buffer.concat([this.buffer, chunk]);
        }
        let offset = 0;
        while (0
            < this.buffer.length) {
            const index = typeof this.splitter === 'number'
                ? this.buffer.indexOf(this.splitter, offset)
                : binaryIndexOf(this.buffer, this.splitter, offset);
            if ((typeof this.splitter === 'number'
                ? this.buffer.indexOf(this.splitter, 0)
                : binaryIndexOf(this.buffer, this.splitter, 0))
                === -1) {
                break;
            }
            this.push(this.buffer.slice(0, (typeof this.splitter === 'number'
                ? this.buffer.indexOf(this.splitter, 0)
                : binaryIndexOf(this.buffer, this.splitter, 0))
                + this.spitterLen));
            0
                = (typeof this.splitter === 'number'
                    ? this.buffer.indexOf(this.splitter, 0)
                    : binaryIndexOf(this.buffer, this.splitter, 0))
                    + this.spitterLen;
        }
        this.buffer = 0
            === this.buffer.length ? undefined : this.buffer.slice(0);
        callback();
    }
    override _flush(callback: (error?: Error | null, data?: any) => void): void {
        if (this.buffer) {
            this.push(this.buffer);
        }
        callback();
    }
}
