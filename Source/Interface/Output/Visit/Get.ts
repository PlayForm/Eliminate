import type Initializer from "@Type/Output/Visit/Initializer/Initializer.js";
import type Name from "@Type/Output/Visit/Initializer/Name.js";

/**
 * @module Output
 *
 */
export default interface Interface {
	(Search: Name, Map: Map<Initializer, Name>): Initializer | undefined;
}
