import { type Node, type TypeChecker } from "typescript";
export declare class TypeScriptValidator {
    validate(node: Node, typeChecker: TypeChecker): ValidationResult;
    private findEnclosingScope;
    private isAccessibleFrom;
}
export declare class ValidationResult {
    private errors;
    constructor(errors: ValidationError[]);
    hasErrors(): boolean;
    getErrors(): ValidationError[];
    toString(): string;
}
export interface ValidationError {
    node: Node;
    message: string;
    category: "type" | "scope" | "syntax";
}
