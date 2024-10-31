import ts from "typescript";
import { type InlinerOptions } from "../Inliner.js";
interface TestCase {
    name: string;
    input: string;
    expected: string;
    options?: InlinerOptions;
}
declare class TestRunner {
    private compiler;
    private fileMap;
    constructor();
    private createCompilerHost;
    runTest(testCase: TestCase): Promise<void>;
}
declare class TypeScriptValidator {
    validate(node: ts.Node, typeChecker: ts.TypeChecker): ValidationResult;
    private findEnclosingScope;
    private isAccessibleFrom;
}
declare class ValidationResult {
    private errors;
    constructor(errors: ValidationError[]);
    hasErrors(): boolean;
    getErrors(): ValidationError[];
    toString(): string;
}
interface ValidationError {
    node: ts.Node;
    message: string;
    category: "type" | "scope" | "syntax";
}
declare class TypeScriptFeatureHandler {
    private typeChecker;
    constructor(typeChecker: ts.TypeChecker);
    handleDecorators(node: ts.Node): ts.Node;
    private isInliningAffectingDecorator;
    handleNamespaces(node: ts.Node): ts.Node;
    private transformNamespaceVariable;
    private isExported;
}
declare const testCases: TestCase[];
declare function runAllTests(): Promise<void>;
export { TestRunner, TypeScriptValidator, ValidationResult, TypeScriptFeatureHandler, testCases, runAllTests, };
