import type Initializer from "@Type/Output/Visit/Initializer.js";
import type Usage from "@Type/Output/Visit/Usage.js";
import type { Node, TransformationContext } from "typescript";
/**
 * @module Output
 *
 */
export default interface Interface {
    (Usage: Usage, Initializer: Initializer): (Context: TransformationContext) => (Node: Node) => Node;
}
