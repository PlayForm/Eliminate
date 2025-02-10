/**
 * @module Output
 *
 */
export default interface Interface {
	/** Preserve comments near declarations */
	Comment?: boolean;

	/** Maximum AST node count to inline */
	Max?: number;

	/** Allow inlining 'async' expressions */
	Async?: boolean;

	/** Allow inlining variables declared with 'const' */
	Const?: boolean;

	/** Allow inlining 'function' declarations */
	Function?: boolean;

	/** Debug mode with detailed logging */
	Debug?: boolean;
}
