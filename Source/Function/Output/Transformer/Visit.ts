import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { Node, TransformationContext, Identifier, VariableStatement, PropertyAccessExpression } from "typescript";

/**
 * @module Output
 * Transformer that inlines single-use variables and performs syntax transformations
 */

type VisitResult = {
    Node: Node;
    Use: boolean;
};

type TransformerState = {
    visit: number;
    iteration: number;
    context: TransformationContext;
};

export const Fn = ((Usage: Map<string, number>, Initializer: Map<string, Node>) => {
    const MAX_RECURSIVE_DEPTH = 100;
    const MAX_NODE_VISITS = 100;
    const MAX_ITERATIONS = 100;

    const createVisitResult = (node: Node, use: boolean): VisitResult => ({
        Node: node,
        Use: use
    });

    const isMaxDepthExceeded = (state: TransformerState, depth: number): boolean => 
        ++state.visit >= MAX_NODE_VISITS || depth >= MAX_RECURSIVE_DEPTH;

    const handleArrayLiteral = (node: ts.ArrayLiteralExpression): VisitResult => {
        const parent = node.parent;
        if (ts.isIdentifier(parent) || ts.isPropertyAccessExpression(parent)) {
            return createVisitResult(
                factory.createIdentifier("array_expression"),
                true
            );
        }
        return createVisitResult(node, false);
    };

    const handleEmptyStatement = (node: ts.EmptyStatement): VisitResult => 
        createVisitResult(factory.createNotEmittedStatement(node), true);

    const handlePropertyAccess = (
        node: PropertyAccessExpression, 
        parent: Node
    ): VisitResult => {
        if (ts.isPropertyAssignment(parent)) {
            return createVisitResult(
                factory.createIdentifier(node.name.text),
                true
            );
        }
        return createVisitResult(node, false);
    };

    const shouldPreserveIdentifier = (
        node: Identifier, 
        parent: Node, 
        initializer: Node | undefined
    ): boolean => {
        if (ts.isPropertyAccessExpression(parent)) {
            if (parent.name.text === node.text) return true;
        }

        if (ts.isPropertyAssignment(parent)) {
            if (ts.isIdentifier(parent.name) && parent.name.text === node.text) {
                return true;
            }
        }

        if (isIdentifier(initializer)) {
            if ((ts.isPropertyAccessExpression(parent) || ts.isPropertyAssignment(parent)) && 
                parent.name === node) {
                return true;
            }
        }

        return false;
    };

    const transformIdentifier = (
        node: Identifier, 
        initializer: Node
    ): VisitResult => {
        if (isIdentifier(initializer)) {
            return createVisitResult(
                factory.createIdentifier(initializer.text),
                true
            );
        }

        try {
            const transformed = ts.transform(
                initializer,
                [(context) => (node) => node],
                { noEmitHelpers: true }
            ).transformed[0];

            if (!transformed) {
                return createVisitResult(node, false);
            }

            const newParent = transformed.parent;
            if (ts.isPropertyAccessExpression(newParent) &&
                ts.isIdentifier(newParent.name) &&
                newParent.name.text === node.text) {
                return createVisitResult(node, false);
            }

            return createVisitResult(transformed as Node, true);
        } catch (error) {
            console.error(
                "Error during identifier transformation:", 
                {
                    identifier: node.text,
                    error: error instanceof Error ? error.message : String(error)
                }
            );
            return createVisitResult(node, false);
        }
    };

    const handleIdentifier = (node: Identifier): VisitResult => {
        const nodeName = node.text;
        const usage = Usage.get(nodeName);
        const initializer = Get(nodeName, Initializer);

        if (!initializer || usage !== 1) {
            return createVisitResult(node, false);
        }

        if (shouldPreserveIdentifier(node, node.parent, initializer)) {
            return createVisitResult(node, false);
        }

        return transformIdentifier(node, initializer);
    };

    const handleVariableStatement = (node: VariableStatement): VisitResult => {
        const declarations = node.declarationList.declarations.filter(declaration => {
            if (!isIdentifier(declaration.name)) return true;
            
            const count = Usage.get(declaration.name.text);
            return !count || count > 1 || !declaration.initializer;
        });

        if (declarations.length === 0) {
            return createVisitResult(factory.createEmptyStatement(), true);
        }

        if (declarations.length === node.declarationList.declarations.length) {
            return createVisitResult(node, false);
        }

        return createVisitResult(
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
    };

    const visitNode = (
        node: Node,
        state: TransformerState,
        depth = 0
    ): VisitResult => {
        if (isMaxDepthExceeded(state, depth)) {
            return createVisitResult(node, false);
        }

        // Handle specific node types
        if (ts.isArrayLiteralExpression(node)) {
            return handleArrayLiteral(node);
        }

        if (ts.isEmptyStatement(node)) {
            return handleEmptyStatement(node);
        }

        if (ts.isVariableStatement(node)) {
            return handleVariableStatement(node);
        }

        if (isIdentifier(node)) {
            return handleIdentifier(node);
        }

        if (ts.isPropertyAccessExpression(node)) {
            return handlePropertyAccess(node, node.parent);
        }

        // Handle child nodes
        let use = false;
        const newNode = ts.visitEachChild(
            node,
            (child) => {
                const output = visitNode(child, state, depth + 1);
                use = use || output.Use;
                return output.Node;
            },
            state.context
        );

        return createVisitResult(newNode, use);
    };

    return (context: TransformationContext) => (rootNode: Node): Node => {
        const state: TransformerState = {
            visit: 0,
            iteration: 0,
            context
        };

        let currentNode = rootNode;

        while (state.iteration < MAX_ITERATIONS) {
            const output = visitNode(currentNode, state);
            
            if (!output.Use || state.iteration >= MAX_ITERATIONS - 1) {
                if (state.iteration >= MAX_ITERATIONS - 1) {
                    console.warn(
                        "Maximum iteration count reached. Possible infinite loop detected.",
                        {
                            nodeType: ts.SyntaxKind[currentNode.kind],
                            position: currentNode.pos,
                            iteration: state.iteration,
                            visits: state.visit
                        }
                    );
                }
                return output.Node;
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