import type Initializer from "@Type/Output/Visit/Initializer.js";
import type { Node } from "typescript";
/**
 * @module Output
 *
 */
export default interface Interface {
    (Initializer: Initializer): (Node: Node) => void;
}
