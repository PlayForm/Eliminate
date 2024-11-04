import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
    Expression,
    Identifier,
    Node,
    TransformationContext,
    VariableStatement,
    SourceFile,
} from "typescript";

/**
 * @module Output
 * Enhanced transformer with comprehensive validation, error handling,
 * and bottom-up evaluation of variables
 */

type VisitResult<T extends Node = Node> = {
    readonly node: T;
    readonly modified: boolean;
    readonly dependencies?: Set<string>;
};

interface TransformerState {
    readonly visitCount: number;
    readonly iterationCount: number;
    readonly context: TransformationContext;
    readonly errors: Array<TransformError>;
    readonly warnings: Array<TransformWarning>;
    readonly processedNodes: Set<string>;
    readonly dependencyGraph: Map<string, Set<string>>;
    readonly sourceFiles: Map<string, SourceFile>;
}

interface TransformError {
    readonly code: ErrorCode;
    readonly message: string;
    readonly node: Node;
    readonly fileName?: string;
    readonly stack?: string;
}

interface TransformWarning {
    readonly code: WarningCode;
    readonly message: string;
    readonly node: Node;
    readonly fileName?: string;
}

enum ErrorCode {
    TYPE_CHECK_ERROR = "TYPE_CHECK_ERROR",
    CIRCULAR_REFERENCE = "CIRCULAR_REFERENCE",
    UNINITIALIZED_VARIABLE = "UNINITIALIZED_VARIABLE",
    INVALID_REPLACEMENT = "INVALID_REPLACEMENT"
}

enum WarningCode {
    MULTIPLE_DECLARATIONS = "MULTIPLE_DECLARATIONS",
    UNSAFE_REPLACEMENT = "UNSAFE_REPLACEMENT"
}

const CONFIG = {
    MAX_ITERATIONS: 100,
    TYPE_CHECK_TIMEOUT: 5000,
} as const;

class VariableTracker {
    private declarations = new Map<string, Node>();
    private uses = new Map<string, Set<Node>>();
    private typeCheckErrors = new Set<string>();

    trackDeclaration(name: string, node: Node): void {
        this.declarations.set(name, node);
    }

    trackUse(name: string, node: Node): void {
        if (!this.uses.has(name)) {
            this.uses.set(name, new Set());
        }
        this.uses.get(name)!.add(node);
    }

    isUnused(name: string): boolean {
        return !this.uses.has(name) || this.uses.get(name)!.size === 0;
    }

    recordTypeError(name: string): void {
        this.typeCheckErrors.add(name);
    }

    hasTypeError(name: string): boolean {
        return this.typeCheckErrors.has(name);
    }

    clear(): void {
        this.declarations.clear();
        this.uses.clear();
        this.typeCheckErrors.clear();
    }
}

export const Fn = ((program, typeChecker) => {
    class Transformer {
        private readonly state: TransformerState;
        private readonly tracker: VariableTracker;

        constructor(context: TransformationContext) {
            this.state = {
                visitCount: 0,
                iterationCount: 0,
                context,
                errors: [],
                warnings: [],
                processedNodes: new Set(),
                dependencyGraph: new Map(),
                sourceFiles: new Map()
            };
            this.tracker = new VariableTracker();
        }

        private async typeCheck(node: Node): Promise<boolean> {
            try {
                const promise = new Promise<boolean>((resolve) => {
                    const diagnostics = typeChecker.getDiagnostics(node);
                    resolve(diagnostics.length === 0);
                });

                const result = await Promise.race([
                    promise,
                    new Promise<boolean>((_, reject) => 
                        setTimeout(() => reject(new Error("Type check timeout")), CONFIG.TYPE_CHECK_TIMEOUT)
                    )
                ]);

                return result;
            } catch (error) {
                console.log(`Type check error: ${error instanceof Error ? error.message : String(error)}`);
                return false;
            }
        }

        private handleVariableReplacement(node: Identifier): VisitResult<Expression> {
            const name = node.text;
            const declaration = this.tracker.declarations.get(name);

            if (!declaration || this.tracker.hasTypeError(name)) {
                return { node, modified: false };
            }

            try {
                // Perform type checking before replacement
                if (!this.typeCheck(declaration)) {
                    this.tracker.recordTypeError(name);
                    this.state.errors.push({
                        code: ErrorCode.TYPE_CHECK_ERROR,
                        message: `Type check failed for variable ${name}`,
                        node: declaration
                    });
                    return { node, modified: false };
                }

                // Create replacement
                const replacement = ts.factory.createParenthesizedExpression(
                    declaration as Expression
                );

                return {
                    node: replacement,
                    modified: true,
                    dependencies: new Set([name])
                };
            } catch (error) {
                console.log(`Replacement error for ${name}: ${error instanceof Error ? error.message : String(error)}`);
                return { node, modified: false };
            }
        }

        private processVariableStatement(node: VariableStatement): VisitResult<VariableStatement> {
            const declarations = node.declarationList.declarations.filter(decl => {
                if (!ts.isIdentifier(decl.name)) return true;
                
                const name = decl.name.text;
                if (this.tracker.isUnused(name) && decl.initializer) {
                    this.tracker.trackDeclaration(name, decl.initializer);
                    return false;
                }
                return true;
            });

            if (declarations.length === 0) {
                return {
                    node: ts.factory.createEmptyStatement() as any,
                    modified: true
                };
            }

            if (declarations.length !== node.declarationList.declarations.length) {
                return {
                    node: ts.factory.updateVariableStatement(
                        node,
                        node.modifiers,
                        ts.factory.createVariableDeclarationList(
                            declarations,
                            node.declarationList.flags
                        )
                    ),
                    modified: true
                };
            }

            return { node, modified: false };
        }

        public visitNode(node: Node): VisitResult {
            // Track variable uses
            if (ts.isIdentifier(node)) {
                this.tracker.trackUse(node.text, node);
                return this.handleVariableReplacement(node);
            }

            // Process variable declarations bottom-up
            if (ts.isVariableStatement(node)) {
                return this.processVariableStatement(node);
            }

            // Recursively visit child nodes
            let modified = false;
            const visitedNode = ts.visitEachChild(
                node,
                child => {
                    const result = this.visitNode(child);
                    modified = modified || result.modified;
                    return result.node;
                },
                this.state.context
            );

            return { node: visitedNode, modified };
        }

        public transform(sourceFile: SourceFile): SourceFile {
            this.tracker.clear();
            let result = sourceFile;
            let iteration = 0;

            while (iteration < CONFIG.MAX_ITERATIONS) {
                const visitResult = this.visitNode(result);
                if (!visitResult.modified) break;
                result = visitResult.node as SourceFile;
                iteration++;
            }

            return result;
        }
    }

    return (context: TransformationContext) => (rootNode: SourceFile) => {
        const transformer = new Transformer(context);
        return transformer.transform(rootNode);
    };
}) satisfies Interface as Interface;

export const {
    default: ts,
    isIdentifier,
    factory,
} = await import("typescript");

export default Fn;