import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { 
    Node, 
    TransformationContext, 
    Identifier, 
    VariableStatement, 
    PropertyAccessExpression,
    ArrayLiteralExpression,
    EmptyStatement,
    SourceFile,
    TransformerFactory,
    Visitor
} from "typescript";

/**
 * @module Output
 * Advanced transformer with validation, error handling, and performance optimizations
 */

type VisitResult = {
    readonly Node: Node;
    readonly Use: boolean;
};

type TransformerState = {
    visit: number;
    iteration: number;
    context: TransformationContext;
    errors: TransformError[];
    warnings: TransformWarning[];
};

type TransformError = {
    code: string;
    message: string;
    node: Node;
    stack?: string;
};

type TransformWarning = {
    code: string;
    message: string;
    node: Node;
};

type ValidationResult = {
    isValid: boolean;
    error?: TransformError;
    warning?: TransformWarning;
};

const enum ErrorCode {
    MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',
    MAX_VISITS_EXCEEDED = 'MAX_VISITS_EXCEEDED',
    MAX_ITERATIONS_EXCEEDED = 'MAX_ITERATIONS_EXCEEDED',
    TRANSFORM_ERROR = 'TRANSFORM_ERROR',
    INVALID_IDENTIFIER = 'INVALID_IDENTIFIER',
    INVALID_PROPERTY_ACCESS = 'INVALID_PROPERTY_ACCESS'
}

const CONFIG = {
    MAX_RECURSIVE_DEPTH: 100,
    MAX_NODE_VISITS: 100,
    MAX_ITERATIONS: 100,
    BATCH_SIZE: 50 // Number of nodes to process before checking state
} as const;

export const Fn = ((Usage: Map<string, number>, Initializer: Map<string, Node>) => {
    class TransformerValidator {
        static validateNode(node: Node, state: TransformerState, depth: number): ValidationResult {
            if (depth > CONFIG.MAX_RECURSIVE_DEPTH) {
                return {
                    isValid: false,
                    error: {
                        code: ErrorCode.MAX_DEPTH_EXCEEDED,
                        message: `Maximum depth of ${CONFIG.MAX_RECURSIVE_DEPTH} exceeded`,
                        node
                    }
                };
            }

            if (state.visit > CONFIG.MAX_NODE_VISITS) {
                return {
                    isValid: false,
                    error: {
                        code: ErrorCode.MAX_VISITS_EXCEEDED,
                        message: `Maximum visits of ${CONFIG.MAX_NODE_VISITS} exceeded`,
                        node
                    }
                };
            }

            if (state.iteration >= CONFIG.MAX_ITERATIONS) {
                return {
                    isValid: false,
                    error: {
                        code: ErrorCode.MAX_ITERATIONS_EXCEEDED,
                        message: `Maximum iterations of ${CONFIG.MAX_ITERATIONS} exceeded`,
                        node
                    }
                };
            }

            return { isValid: true };
        }

        static validateIdentifier(node: Identifier): ValidationResult {
            if (!node.text || node.text.length === 0) {
                return {
                    isValid: false,
                    error: {
                        code: ErrorCode.INVALID_IDENTIFIER,
                        message: 'Invalid identifier: empty text',
                        node
                    }
                };
            }
            return { isValid: true };
        }

        static validatePropertyAccess(node: PropertyAccessExpression): ValidationResult {
            if (!node.name || !ts.isIdentifier(node.name)) {
                return {
                    isValid: false,
                    error: {
                        code: ErrorCode.INVALID_PROPERTY_ACCESS,
                        message: 'Invalid property access expression',
                        node
                    }
                };
            }
            return { isValid: true };
        }
    }

    class NodeTransformer {
        private state: TransformerState;
        private nodeCache: Map<string, VisitResult>;

        constructor(context: TransformationContext) {
            this.state = {
                visit: 0,
                iteration: 0,
                context,
                errors: [],
                warnings: []
            };
            this.nodeCache = new Map();
        }

        private createVisitResult(node: Node, use: boolean): VisitResult {
            return Object.freeze({
                Node: node,
                Use: use
            });
        }

        private getCacheKey(node: Node): string {
            return `${node.kind}-${node.pos}-${node.end}`;
        }

        private getCachedResult(node: Node): VisitResult | undefined {
            return this.nodeCache.get(this.getCacheKey(node));
        }

        private setCachedResult(node: Node, result: VisitResult): void {
            this.nodeCache.set(this.getCacheKey(node), result);
        }

        private handleArrayLiteral(node: ArrayLiteralExpression): VisitResult {
            const parent = node.parent;
            if (ts.isIdentifier(parent) || ts.isPropertyAccessExpression(parent)) {
                return this.createVisitResult(
                    factory.createIdentifier("array_expression"),
                    true
                );
            }
            return this.createVisitResult(node, false);
        }

        private handleEmptyStatement(node: EmptyStatement): VisitResult {
            return this.createVisitResult(
                factory.createNotEmittedStatement(node),
                true
            );
        }

        private handlePropertyAccess(node: PropertyAccessExpression): VisitResult {
            const validation = TransformerValidator.validatePropertyAccess(node);
            if (!validation.isValid) {
                this.state.errors.push(validation.error!);
                return this.createVisitResult(node, false);
            }

            if (ts.isPropertyAssignment(node.parent)) {
                return this.createVisitResult(
                    factory.createIdentifier(node.name.text),
                    true
                );
            }
            return this.createVisitResult(node, false);
        }

        private shouldPreserveIdentifier(
            node: Identifier, 
            parent: Node, 
            initializer: Node | undefined
        ): boolean {
            if (ts.isPropertyAccessExpression(parent)) {
                return parent.name.text === node.text;
            }

            if (ts.isPropertyAssignment(parent)) {
                return ts.isIdentifier(parent.name) && parent.name.text === node.text;
            }

            if (isIdentifier(initializer)) {
                return (ts.isPropertyAccessExpression(parent) || 
                       ts.isPropertyAssignment(parent)) && 
                       parent.name === node;
            }

            return false;
        }

        private async transformIdentifier(
            node: Identifier, 
            initializer: Node
        ): Promise<VisitResult> {
            if (isIdentifier(initializer)) {
                return this.createVisitResult(
                    factory.createIdentifier(initializer.text),
                    true
                );
            }

            try {
                const transformed = await this.transformNodeSafely(initializer);
                if (!transformed) {
                    return this.createVisitResult(node, false);
                }

                const validation = this.validateTransformedNode(transformed, node);
                if (!validation.isValid) {
                    return this.createVisitResult(node, false);
                }

                return this.createVisitResult(transformed as Node, true);
            } catch (error) {
                this.handleTransformError(error, node);
                return this.createVisitResult(node, false);
            }
        }

        private async transformNodeSafely(node: Node): Promise<Node | null> {
            return new Promise((resolve) => {
                try {
                    const transformed = ts.transform(
                        node,
                        [(context) => (node) => node],
                        { noEmitHelpers: true }
                    ).transformed[0];
                    resolve(transformed || null);
                } catch (error) {
                    console.error('Transform error:', error);
                    resolve(null);
                }
            });
        }

        private validateTransformedNode(transformed: Node, originalNode: Identifier): ValidationResult {
            const newParent = transformed.parent;
            if (ts.isPropertyAccessExpression(newParent) &&
                ts.isIdentifier(newParent.name) &&
                newParent.name.text === originalNode.text) {
                return {
                    isValid: false,
                    warning: {
                        code: 'INVALID_TRANSFORM_RESULT',
                        message: 'Transform resulted in invalid property access',
                        node: transformed
                    }
                };
            }
            return { isValid: true };
        }

        private handleTransformError(error: unknown, node: Node): void {
            this.state.errors.push({
                code: ErrorCode.TRANSFORM_ERROR,
                message: error instanceof Error ? error.message : String(error),
                node,
                stack: error instanceof Error ? error.stack : undefined
            });
        }

        private async handleIdentifier(node: Identifier): Promise<VisitResult> {
            const validation = TransformerValidator.validateIdentifier(node);
            if (!validation.isValid) {
                this.state.errors.push(validation.error!);
                return this.createVisitResult(node, false);
            }

            const nodeName = node.text;
            const usage = Usage.get(nodeName);
            const initializer = Get(nodeName, Initializer);

            if (!initializer || usage !== 1) {
                return this.createVisitResult(node, false);
            }

            if (this.shouldPreserveIdentifier(node, node.parent, initializer)) {
                return this.createVisitResult(node, false);
            }

            return this.transformIdentifier(node, initializer);
        }

        private handleVariableStatement(node: VariableStatement): VisitResult {
            const declarations = node.declarationList.declarations.filter(declaration => {
                if (!isIdentifier(declaration.name)) return true;
                
                const count = Usage.get(declaration.name.text);
                return !count || count > 1 || !declaration.initializer;
            });

            if (declarations.length === 0) {
                return this.createVisitResult(factory.createEmptyStatement(), true);
            }

            if (declarations.length === node.declarationList.declarations.length) {
                return this.createVisitResult(node, false);
            }

            return this.createVisitResult(
                factory.updateVariableStatement(
                    node,
                    node.modifiers,
                    factory.createVariableDeclarationList(
                        declarations,
                        node.declarationList.flags
                    )
                ),
                true
            );
        }

        public async visitNode(
            node: Node,
            depth = 0
        ): Promise<VisitResult> {
            const validation = TransformerValidator.validateNode(node, this.state, depth);
            if (!validation.isValid) {
                this.state.errors.push(validation.error!);
                return this.createVisitResult(node, false);
            }

            // Check cache first
            const cached = this.getCachedResult(node);
            if (cached) return cached;

            this.state.visit++;

            // Handle specific node types
            let result: VisitResult;
            if (ts.isArrayLiteralExpression(node)) {
                result = this.handleArrayLiteral(node);
            } else if (ts.isEmptyStatement(node)) {
                result = this.handleEmptyStatement(node);
            } else if (ts.isVariableStatement(node)) {
                result = this.handleVariableStatement(node);
            } else if (isIdentifier(node)) {
                result = await this.handleIdentifier(node);
            } else if (ts.isPropertyAccessExpression(node)) {
                result = this.handlePropertyAccess(node);
            } else {
                // Handle child nodes
                let use = false;
                const newNode = ts.visitEachChild(
                    node,
                    async (child) => {
                        const output = await this.visitNode(child, depth + 1);
                        use = use || output.Use;
                        return output.Node;
                    },
                    this.state.context
                );

                result = this.createVisitResult(newNode, use);
            }

            // Cache the result
            this.setCachedResult(node, result);
            return result;
        }

        public getState(): Readonly<TransformerState> {
            return Object.freeze({ ...this.state });
        }
    }

    return (context: TransformationContext) => 
        async (rootNode: Node): Promise<Node> => {
            const transformer = new NodeTransformer(context);
            let currentNode = rootNode;

            while (transformer.getState().iteration < CONFIG.MAX_ITERATIONS) {
                const output = await transformer.visitNode(currentNode);
                
                if (!output.Use) {
                    return output.Node;
                }

                const state = transformer.getState();
                if (state.errors.length > 0) {
                    console.error('Transformation errors:', state.errors);
                }
                if (state.warnings.length > 0) {
                    console.warn('Transformation warnings:', state.warnings);
                }

                currentNode = output.Node;
                state.iteration++;
            }

            return currentNode;
    };
}) satisfies Interface as Interface;

export const {
    default: ts,
    isIdentifier,
    factory
} = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;