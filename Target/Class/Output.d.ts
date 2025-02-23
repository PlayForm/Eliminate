import type Option from "@Interface/Output/Option.js";
import type { FunctionDeclaration, Identifier, Node, Program, TransformationContext, VariableDeclaration } from "typescript";
export declare const forEachChild: typeof import("typescript").forEachChild, getLeadingCommentRanges: typeof import("typescript").getLeadingCommentRanges, isAwaitExpression: typeof import("typescript").isAwaitExpression, isBinaryExpression: typeof import("typescript").isBinaryExpression, isCallExpression: typeof import("typescript").isCallExpression, isConditionalExpression: typeof import("typescript").isConditionalExpression, isFunctionDeclaration: typeof import("typescript").isFunctionDeclaration, isIdentifier: typeof import("typescript").isIdentifier, isPropertyAccessExpression: typeof import("typescript").isPropertyAccessExpression, isThisTypeNode: typeof import("typescript").isThisTypeNode, isVariableDeclaration: typeof import("typescript").isVariableDeclaration, isVariableStatement: typeof import("typescript").isVariableStatement, isYieldExpression: typeof import("typescript").isYieldExpression, NodeFlags: typeof import("typescript").NodeFlags, SymbolFlags: typeof import("typescript").SymbolFlags, SyntaxKind: typeof import("typescript").SyntaxKind, AsyncKeyword: import("typescript").SyntaxKind, DefaultKeyword: import("typescript").SyntaxKind, ExportKeyword: import("typescript").SyntaxKind, visitEachChild: typeof import("typescript").visitEachChild, visitNode: typeof import("typescript").visitNode;
export type UsageType = {
    Declaration: VariableDeclaration | FunctionDeclaration;
    Reference: Identifier[];
    Inline: boolean;
    Size: number;
};
export default class {
    private Usage;
    private Type;
    private Option;
    private Change;
    constructor(Option?: Option);
    private _FunctionInline;
    private _VariableInline;
    private _CallExpressionInline;
    private _BinaryExpressionInline;
    private _ExpressionInline;
    private Iterative;
    Transform(Program: Program): (Context: TransformationContext) => (Node: Node) => Node;
    private Collect;
    private Size;
    private Comment;
    private Inline;
}
