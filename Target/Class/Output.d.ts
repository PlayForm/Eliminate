import type Option from "@Interface/Output/Option.js";
import type { FunctionDeclaration, Identifier, Node, Program, Symbol as SymbolInterface, SyntaxKind as SyntaxKindType, TransformationContext, VariableDeclaration } from "typescript";
export declare const forEachChild: typeof import("typescript").forEachChild, getLeadingCommentRanges: typeof import("typescript").getLeadingCommentRanges, isAwaitExpression: typeof import("typescript").isAwaitExpression, isBinaryExpression: typeof import("typescript").isBinaryExpression, isCallExpression: typeof import("typescript").isCallExpression, isConditionalExpression: typeof import("typescript").isConditionalExpression, isFunctionDeclaration: typeof import("typescript").isFunctionDeclaration, isIdentifier: typeof import("typescript").isIdentifier, isPropertyAccessExpression: typeof import("typescript").isPropertyAccessExpression, isThisTypeNode: typeof import("typescript").isThisTypeNode, isVariableDeclaration: typeof import("typescript").isVariableDeclaration, isVariableStatement: typeof import("typescript").isVariableStatement, isYieldExpression: typeof import("typescript").isYieldExpression, NodeFlags: typeof import("typescript").NodeFlags, SymbolFlags: typeof import("typescript").SymbolFlags, AmpersandAmpersandEqualsToken: SyntaxKindType, AmpersandEqualsToken: SyntaxKindType, ArrayLiteralExpression: SyntaxKindType, ArrowFunction: SyntaxKindType, AsteriskEqualsToken: SyntaxKindType, AsyncKeyword: SyntaxKindType, BarBarEqualsToken: SyntaxKindType, BarEqualsToken: SyntaxKindType, BinaryExpression: SyntaxKindType, CallExpression: SyntaxKindType, CaretEqualsToken: SyntaxKindType, ConditionalExpression: SyntaxKindType, AwaitExpression: SyntaxKindType, TemplateExpression: SyntaxKindType, DefaultKeyword: SyntaxKindType, EqualsToken: SyntaxKindType, ExportKeyword: SyntaxKindType, FalseKeyword: SyntaxKindType, FunctionExpression: SyntaxKindType, GreaterThanGreaterThanEqualsToken: SyntaxKindType, GreaterThanGreaterThanGreaterThanEqualsToken: SyntaxKindType, IdentifierKind: SyntaxKindType, LessThanLessThanEqualsToken: SyntaxKindType, MinusEqualsToken: SyntaxKindType, MinusMinusToken: SyntaxKindType, NewExpression: SyntaxKindType, NullKeyword: SyntaxKindType, NumericLiteral: SyntaxKindType, ObjectLiteralExpression: SyntaxKindType, PercentEqualsToken: SyntaxKindType, PlusEqualsToken: SyntaxKindType, PlusPlusToken: SyntaxKindType, PostfixUnaryExpression: SyntaxKindType, PrefixUnaryExpression: SyntaxKindType, PropertyAccessExpression: SyntaxKindType, QuestionQuestionEqualsToken: SyntaxKindType, RegularExpressionLiteral: SyntaxKindType, SlashEqualsToken: SyntaxKindType, StringLiteral: SyntaxKindType, TrueKeyword: SyntaxKindType, UndefinedKeyword: SyntaxKindType, BigIntLiteral: SyntaxKindType, visitEachChild: typeof import("typescript").visitEachChild, visitNode: typeof import("typescript").visitNode, isArrowFunction: typeof import("typescript").isArrowFunction, isBlock: typeof import("typescript").isBlock;
export declare const SyntaxKind: typeof SyntaxKindType;
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
    private Safe;
    private _FunctionInline;
    private _VariableInline;
    private _CallExpressionInline;
    private _BinaryExpressionInline;
    private _ExpressionInline;
    private Iterative;
    Transform(Program: Program): (Context: TransformationContext) => (Node: Node) => Node;
    private Collect;
}
