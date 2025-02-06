import type Option from "@Interface/Output/Option.js";
import * as ts from "typescript";
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
