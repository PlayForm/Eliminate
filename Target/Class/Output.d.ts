import type Option from "@Interface/Output/Option.js";
import ts from "typescript";
export type UsageType = {
    Declaration: ts.VariableDeclaration | ts.FunctionDeclaration;
    Reference: ts.Identifier[];
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
    Transform(Program: ts.Program): (Context: ts.TransformationContext) => (Node: ts.Node) => ts.Node;
    private Collect;
    private Size;
    private Comment;
    private Inline;
}
