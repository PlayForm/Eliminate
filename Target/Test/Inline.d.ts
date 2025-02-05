import type { Option } from "@Class/Inline.js";
export declare const Debug = 0;
export declare const Normalize: (Input: string) => Promise<string>;
export declare const Equal: (Input: string, Should: string, Option?: Option) => Promise<Chai.Assertion>;
