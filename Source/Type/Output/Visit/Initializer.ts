import type Initializer from "@Type/Output/Visit/Initializer/Initializer.js";
import type { Node } from "typescript";

/**
 * @module Output
 *
 */
export type Type = Map<
	Initializer,
	{
		Name: string;

		Usage: Set<{
			Node: Node;

			Position: number;
		}>;
	}
>;

export type { Type as default };
