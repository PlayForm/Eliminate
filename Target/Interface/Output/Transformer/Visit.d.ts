import type { Node, TransformationContext } from "typescript";
/**
 * @module Output
 *
 */
export default interface Interface {
    (Context: TransformationContext): (Node: Node) => Node;
}
