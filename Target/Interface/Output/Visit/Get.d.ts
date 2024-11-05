import type Initializer from "@Type/Output/Visit/Initializer/Initializer.js";
/**
 * @module Output
 *
 */
export default interface Interface {
    <Value extends Record<string, any>, K extends keyof Value>(Search: Value[K], In: K, Map: Map<Initializer, Value>): Initializer | undefined;
}
