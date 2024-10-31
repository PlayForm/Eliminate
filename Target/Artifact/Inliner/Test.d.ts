import { type Node, type TypeChecker } from "typescript";
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
declare class TypeScriptFeatureHandler {
    private typeChecker;
    constructor(typeChecker: TypeChecker);
    handleDecorators(node: Node): Node;
    private isInliningAffectingDecorator;
}
declare const testCases: TestCase[];
declare function runAllTests(): Promise<void>;
export { TestRunner, TypeScriptFeatureHandler, testCases, runAllTests };
export { TypeScriptValidator, ValidationResult } from "./Test/Validation.js";
