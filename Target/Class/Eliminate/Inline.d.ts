import * as ts from "typescript";
export interface Option {
    /** Preserve comments near declarations */
    Comment?: boolean;
    /** Maximum AST node count to inline */
    Max?: number;
    /** Allow inlining async expressions */
    Async?: boolean;
    /** Allow inlining variables declared with 'const' */
    Const?: boolean;
    /** Allow inlining function declarations */
    Function?: boolean;
    /** Debug mode with detailed logging */
    Debug?: boolean;
}
export default class {
    private Usage;
    private Type;
    private Option;
    constructor(Option?: Option);
    Transform(Program: ts.Program): (Context: ts.TransformationContext) => (Source: ts.SourceFile) => ts.Node;
    private Collect;
    private Size;
    private Comment;
    private Visit;
    private Inline;
}
