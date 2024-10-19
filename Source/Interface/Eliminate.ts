/**
 * @module Eliminate
 *
 */
export default interface Interface {
	/**
	 * Represents a function that processes file patterns.
	 *
	 * @param Eliminate - A string representing the Eliminate option.
	 *
	 */
	(Eliminate?: string): Promise<void>;
}
