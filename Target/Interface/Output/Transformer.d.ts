import type { Node, TransformationContext } from "typescript";
/**
 * @module Output
 *
 */
export default interface Interface {
    <T extends Node>(Context: TransformationContext): (Node: T) => Node | (T & undefined);
}
