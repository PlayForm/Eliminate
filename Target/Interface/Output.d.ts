import type Option from "@Interface/Output/Option.js";
/**
 * @module Output
 *
 */
export default interface Interface {
    (Source: string, Option?: Option): Promise<string>;
}
