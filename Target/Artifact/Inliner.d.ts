import ts from "typescript";
interface InlinerOptions {
    allowComplexExpressions?: boolean;
    maxInlineDepth?: number;
    inlineInFunctions?: boolean;
    excludeVariables?: string[];
    includeVariables?: string[];
    preserveComments?: boolean;
    generateSourceMaps?: boolean;
    inlineDestructuring?: boolean;
    optimizationLevel?: "conservative" | "aggressive";
    maxExpressionSize?: number;
}
interface TransformationResult {
    code: string;
    sourceMap?: string;
    statistics: TransformationStatistics;
}
interface TransformationStatistics {
    totalVariables: number;
    inlinedVariables: number;
    skippedVariables: {
        scope: number;
        complexity: number;
        size: number;
        excluded: number;
        multiple: number;
    };
    optimizationTime: number;
}
declare class ExpressionAnalyzer {
    private readonly maxSize;
    constructor(maxSize: number);
    getExpressionSize(node: ts.Expression): number;
    analyzeSideEffects(node: ts.Expression): boolean;
    analyzeComplexity(node: ts.Expression): {
        safe: boolean;
        reason?: string;
    };
}
declare class ScopeAnalyzer {
    private readonly typeChecker;
    private readonly scopeMap;
    constructor(typeChecker: ts.TypeChecker);
    analyzeScope(node: ts.Node): void;
    private collectBindings;
    isInScope(symbol: ts.Symbol, node: ts.Node): boolean;
}
declare class VariableInliner {
    private readonly options;
    private readonly expressionAnalyzer;
    private readonly statistics;
    private scopeAnalyzer;
    constructor(options?: InlinerOptions);
    private handleDestructuring;
    private shouldInlineExpression;
    transform(sourceFile: ts.SourceFile, program: ts.Program): TransformationResult;
    private transformVariableStatement;
    private validateDestructuringPattern;
    private canInlineDestructuring;
    private findReferences;
    private isVariableExcluded;
    private isPropertyAccessSafe;
}
declare function optimizeTypeScriptFile(filePath: string, options?: InlinerOptions): Promise<TransformationResult>;
export { VariableInliner, optimizeTypeScriptFile, type InlinerOptions, type TransformationResult, type TransformationStatistics, ExpressionAnalyzer, ScopeAnalyzer, };
