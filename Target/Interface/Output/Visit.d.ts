import type { Node } from "typescript";
/**
 * @module Output
 *
 */
export default interface Interface {
    (Node: Node): void;
}
