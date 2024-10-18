import type { Pattern } from "fast-glob";

/**
 * @module Eliminate
 *
 */
export default interface Interface {
	/**
	 * Represents a function that processes file patterns.
	 *
	 * @param File - An array of file patterns to be processed. Each pattern can include wildcards (*) to match multiple files.
	 *
	 */
	(File: Pattern[]): Promise<void>;
}
