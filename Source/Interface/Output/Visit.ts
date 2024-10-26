import type Initializer from "@Type/Output/Visit/Initializer.js";
import type Usage from "@Type/Output/Visit/Usage.js";
import type { Node } from "typescript";

/**
 * @module Output
 *
 */
export default interface Interface {
	(Usage: Usage, Initializer: Initializer): (Node: Node) => void;
}
