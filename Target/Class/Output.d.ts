import type Option from "@Interface/Output/Option.js";
import type { FunctionDeclaration, Identifier, Node, Program, Symbol as SymbolInterface, SyntaxKind, TransformationContext, VariableDeclaration } from "typescript";
export declare const forEachChild: typeof import("typescript").forEachChild, getLeadingCommentRanges: typeof import("typescript").getLeadingCommentRanges, isAwaitExpression: typeof import("typescript").isAwaitExpression, isBinaryExpression: typeof import("typescript").isBinaryExpression, isCallExpression: typeof import("typescript").isCallExpression, isConditionalExpression: typeof import("typescript").isConditionalExpression, isFunctionDeclaration: typeof import("typescript").isFunctionDeclaration, isIdentifier: typeof import("typescript").isIdentifier, isPropertyAccessExpression: typeof import("typescript").isPropertyAccessExpression, isThisTypeNode: typeof import("typescript").isThisTypeNode, isVariableDeclaration: typeof import("typescript").isVariableDeclaration, isVariableStatement: typeof import("typescript").isVariableStatement, isYieldExpression: typeof import("typescript").isYieldExpression, NodeFlags: typeof import("typescript").NodeFlags, SymbolFlags: typeof import("typescript").SymbolFlags, AmpersandAmpersandEqualsToken: SyntaxKind, AmpersandEqualsToken: SyntaxKind, AsteriskEqualsToken: SyntaxKind, AsyncKeyword: SyntaxKind, BarBarEqualsToken: SyntaxKind, BarEqualsToken: SyntaxKind, CaretEqualsToken: SyntaxKind, DefaultKeyword: SyntaxKind, EqualsToken: SyntaxKind, ExportKeyword: SyntaxKind, GreaterThanGreaterThanEqualsToken: SyntaxKind, GreaterThanGreaterThanGreaterThanEqualsToken: SyntaxKind, LessThanLessThanEqualsToken: SyntaxKind, MinusEqualsToken: SyntaxKind, MinusMinusToken: SyntaxKind, PercentEqualsToken: SyntaxKind, PlusEqualsToken: SyntaxKind, PlusPlusToken: SyntaxKind, PostfixUnaryExpression: SyntaxKind, PrefixUnaryExpression: SyntaxKind, QuestionQuestionEqualsToken: SyntaxKind, SlashEqualsToken: SyntaxKind, visitEachChild: typeof import("typescript").visitEachChild, visitNode: typeof import("typescript").visitNode, isArrowFunction: typeof import("typescript").isArrowFunction, isBlock: typeof import("typescript").isBlock;
export type UsageType = {
    Declaration: VariableDeclaration | FunctionDeclaration;
    Reference: Identifier[];
    Inline: boolean;
    Size: number;
    Modified: boolean;
    Call: Set<SymbolInterface>;
};
export default class {
    private Usage;
    private Type;
    private Option;
    private Change;
    constructor(Option?: Option);
    private Await;
    private Cycle;
    private Call;
    private Modification;
    private Postfix;
    private Prefix;
    private Operator;
    private Size;
    private Comment;
    private Inline;
    private _FunctionInline;
    private _VariableInline;
    private _CallExpressionInline;
    private _BinaryExpressionInline;
    private _ExpressionInline;
    private Iterative;
    Transform(Program: Program): (Context: TransformationContext) => (Node: Node) => Node;
    private Collect;
}
