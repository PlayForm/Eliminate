import type Option from "@Interface/Output/Option.js";
export declare const Debug = 0;
export declare const Normalize: (Input: string) => Promise<string>;
export declare const Equal: (Input: string, Should: string, Option?: Option) => Promise<Chai.Assertion>;
