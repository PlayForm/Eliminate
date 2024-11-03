import type Interface from "@Interface/Output/Transformer/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 */
export const Fn = ((Usage, Initializer) =>
    (...[Context]) =>
    (...[Node]) => {
        const MAX_RECURSIVE_DEPTH = 100;
        const MAX_NODE_VISITS = 100;
        const MAX_ITERATIONS = 100;

        const _Visit = (
            Node: Node,
            Depth = 0
        ): { Node: Node; Use: boolean } => {
            if (++Visit >= MAX_NODE_VISITS || Depth >= MAX_RECURSIVE_DEPTH) {
                return { Node, Use: false };
            }

            if (ts.isArrayLiteralExpression(Node)) {
                const parent = Node.parent;
                if (ts.isIdentifier(parent) || ts.isPropertyAccessExpression(parent)) {
                    return {
                        Node: factory.createIdentifier("array_expression"),
                        Use: true
                    };
                }
            }

            if (ts.isEmptyStatement(Node)) {
                return {
                    Node: factory.createNotEmittedStatement(Node),
                    Use: true
                };
            }

            if (ts.isVariableStatement(Node)) {
                const declarations = Node.declarationList.declarations.filter(declaration => {
                    if (isIdentifier(declaration.name)) {
                        const count = Usage.get(declaration.name.text);
                        return !count || count > 1 || !declaration.initializer;
                    }
                    return true;
                });

                if (declarations.length === 0) {
                    return {
                        Node: factory.createEmptyStatement(),
                        Use: true
                    };
                }

                if (declarations.length !== Node.declarationList.declarations.length) {
                    return {
                        Node: factory.updateVariableStatement(
                            Node,
                            Node.modifiers,
                            factory.createVariableDeclarationList(
                                declarations,
                                Node.declarationList.flags
                            )
                        ),
                        Use: true
                    };
                }
            }

            if (isIdentifier(Node)) {
                try {
                    const nodeName = Node.text;
                    const nodeUsage = Usage.get(nodeName);
                    const nodeInitializer = Get(nodeName, Initializer);

                    if (nodeInitializer && nodeUsage === 1) {
                        const parent = Node.parent;

                        if (ts.isPropertyAccessExpression(parent) && parent.name.text === Node.text) {
                            return { Node, Use: false };
                        }

                        if (ts.isPropertyAssignment(parent) && 
                            ts.isIdentifier(parent.name) && 
                            parent.name.text === Node.text) {
                            return { Node, Use: false };
                        }

                        if (isIdentifier(nodeInitializer)) {
                            if ((ts.isPropertyAccessExpression(parent) || ts.isPropertyAssignment(parent)) && 
                                parent.name === Node) {
                                return { Node, Use: false };
                            }
                            return { 
                                Node: factory.createIdentifier(nodeInitializer.text),
                                Use: true 
                            };
                        }

                        const transformed = ts.transform(nodeInitializer, [
                            (_Context) => (node) => node
                        ]).transformed[0];

                        if (transformed) {
                            const newParent = transformed.parent;
                            if (ts.isPropertyAccessExpression(newParent) &&
                                ts.isIdentifier(newParent.name) &&
                                newParent.name.text === Node.text) {
                                return { Node, Use: false };
                            }
                            return { Node: transformed as Node, Use: true };
                        }
                    }
                } catch (error) {
                    console.error("Error during identifier replacement:", error);
                }
            }

            if (ts.isPropertyAccessExpression(Node)) {
                const parent = Node.parent;
                if (ts.isPropertyAssignment(parent)) {
                    return {
                        Node: factory.createIdentifier(Node.name.text),
                        Use: true
                    };
                }
            }

            let childrenUse = false;
            let shouldReturn = false;

            const newNode = ts.visitEachChild(
                Node,
                (child) => {
                    if (shouldReturn) return child;

                    const output = _Visit(child, Depth + 1);
                    if (output.Use === false && Depth > MAX_RECURSIVE_DEPTH) {
                        shouldReturn = true;
                        return child;
                    }

                    childrenUse = childrenUse || output.Use;
                    return output.Node;
                },
                Context
            );

            return {
                Node: newNode,
                Use: childrenUse
            };
        };

        let currentNode = Node;
        let use = true;
        let iteration = 0;
        let visit = 0;

        while (use && iteration < MAX_ITERATIONS) {
            if (iteration >= MAX_ITERATIONS) {
                console.warn(
                    `Warning: Maximum iteration count (${MAX_ITERATIONS}) reached. Possible infinite loop detected.`,
                    {
                        TypeNode: ts.SyntaxKind[currentNode.kind],
                        Position: currentNode.pos,
                        Depth: "root"
                    }
                );
                break;
            }

            const output = _Visit(currentNode);
            use = output.Use;
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