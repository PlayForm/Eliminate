/**
 * @module Output
 *
 */
export default interface Interface {
    /** Preserve comments near declarations */
    Comment?: boolean;
    /** Maximum AST node count to inline */
    Max?: number;
    /** Preserve 'async' expressions */
    Async?: boolean;
    /** Preserve variables declared with 'const' */
    Const?: boolean;
    /** Preserve 'function' declarations */
    Function?: boolean;
    /** Debug mode with detailed logging */
    Debug?: boolean;
}
