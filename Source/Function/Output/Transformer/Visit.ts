import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 */
export const Fn = ((Usage: Map<string, number>, Initializer: Map<string, Node>) =>
    (Context: ts.TransformationContext) =>
    (Node: Node): Node => {
        const MAX_RECURSIVE_DEPTH = 100;
        const MAX_NODE_VISITS = 100;
        const MAX_ITERATIONS = 100;

        let visit = 0;

        const handlePropertyAccess = (node: Node, parent: Node): { Node: Node; Use: boolean } => {
            if (ts.isPropertyAssignment(parent)) {
                return {
                    Node: factory.createIdentifier(
                        ts.isPropertyAccessExpression(node) ? node.name.text : ''
                    ),
                    Use: true
                };
            }
            return { Node: node, Use: false };
        };

        const handleIdentifier = (node: ts.Identifier): { Node: Node; Use: boolean } => {
            try {
                const nodeName = node.text;
                const usage = Usage.get(nodeName);
                const initializer = Get(nodeName, Initializer);

                if (!initializer || usage !== 1) {
                    return { Node: node, Use: false };
                }

                const parent = node.parent;
                if (ts.isPropertyAccessExpression(parent)) {
                    if (parent.name.text === node.text) {
                        return { Node: node, Use: false };
                    }
                }

                if (ts.isPropertyAssignment(parent) && 
                    ts.isIdentifier(parent.name) && 
                    parent.name.text === node.text) {
                    return { Node: node, Use: false };
                }

                if (isIdentifier(initializer)) {
                    if ((ts.isPropertyAccessExpression(parent) || 
                         ts.isPropertyAssignment(parent)) && 
                        parent.name === node) {
                        return { Node: node, Use: false };
                    }
                    return { 
                        Node: factory.createIdentifier(initializer.text),
                        Use: true 
                    };
                }

                const transformed = ts.transform(initializer, [
                    (context) => (node) => node,
                ]).transformed[0];

                if (!transformed) {
                    return { Node: node, Use: false };
                }

                const newParent = transformed.parent;
                if (ts.isPropertyAccessExpression(newParent) &&
                    ts.isIdentifier(newParent.name) &&
                    newParent.name.text === node.text) {
                    return { Node: node, Use: false };
                }

                return { Node: transformed as Node, Use: true };
            } catch (error) {
                console.error("Error during identifier replacement:", error);
                return { Node: node, Use: false };
            }
        };

        const handleVariableStatement = (node: ts.VariableStatement): { Node: Node; Use: boolean } => {
            const declarations = node.declarationList.declarations.filter(declaration => {
                if (!isIdentifier(declaration.name)) return true;
                const count = Usage.get(declaration.name.text);
                return !count || count > 1 || !declaration.initializer;
            });

            if (declarations.length === 0) {
                return {
                    Node: factory.createEmptyStatement(),
                    Use: true
                };
            }

            if (declarations.length === node.declarationList.declarations.length) {
                return { Node: node, Use: false };
            }

            return {
                Node: factory.updateVariableStatement(
                    node,
                    node.modifiers,
                    factory.createVariableDeclarationList(
                        declarations,
                        node.declarationList.flags
                    )
                ),
                Use: true
            };
        };

        const _Visit = (
            node: Node,
            depth = 0
        ): { Node: Node; Use: boolean } => {
            if (++visit >= MAX_NODE_VISITS || depth >= MAX_RECURSIVE_DEPTH) {
                return { Node: node, Use: false };
            }

            // Handle array literals
            if (ts.isArrayLiteralExpression(node)) {
                const parent = node.parent;
                if (ts.isIdentifier(parent) || ts.isPropertyAccessExpression(parent)) {
                    return {
                        Node: factory.createIdentifier("array_expression"),
                        Use: true
                    };
                }
            }

            // Handle empty statements
            if (ts.isEmptyStatement(node)) {
                return {
                    Node: factory.createNotEmittedStatement(node),
                    Use: true
                };
            }

            // Handle different node types
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
                    const output = _Visit(child, depth + 1);
                    use = use || output.Use;
                    return output.Node;
                },
                Context
            );

            return { Node: newNode, Use: use };
        };

        // Main transformation loop
        let currentNode = Node;
        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
            const output = _Visit(currentNode);
            
            if (!output.Use || iteration >= MAX_ITERATIONS - 1) {
                if (iteration >= MAX_ITERATIONS - 1) {
                    console.warn(
                        `Warning: Maximum iteration count (${MAX_ITERATIONS}) reached. Possible infinite loop detected.`,
                        {
                            TypeNode: ts.SyntaxKind[currentNode.kind],
                            Position: currentNode.pos,
                            Depth: "root"
                        }
                    );
                }
                return output.Node;
            }

            currentNode = output.Node;
            iteration++;
        }

        return currentNode;
    }) satisfies Interface as Interface;

export const {
    default: ts,
    isIdentifier,
    factory
} = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;