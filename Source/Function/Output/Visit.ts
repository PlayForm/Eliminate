import type Interface from "@Interface/Output/Visit.js";
import type { Node } from "typescript";

/**
 * @module Output
 *
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		const MAX_USAGE_COUNT = 1000;

		const MAX_INITIALIZER_SIZE = 1000;

		const visitedNodes = new Set<string>();

		// Add node path tracking to prevent infinite recursion
		const nodeId = `${ts.SyntaxKind[Node.kind]}-${Node.pos}-${Node.end}`;

		if (visitedNodes.has(nodeId)) {
			console.warn("Warning: Circular reference detected", {
				nodeType: ts.SyntaxKind[Node.kind],
				position: Node.pos,
			});
			return;
		}

		visitedNodes.add(nodeId);

		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (
			Usage.size >= MAX_USAGE_COUNT ||
			Initializer.size >= MAX_INITIALIZER_SIZE
		) {
			console.warn("Warning: Maximum map size reached", {
				usageSize: Usage.size,
				initializerSize: Initializer.size,
			});

			return;
		}

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			const NameNode = Node.name.getText();

			// Improved self-reference check
			const containsSelfReference = (() => {
				let hasSelfRef = false;

				const checkNode = (node: Node) => {
					if (hasSelfRef) return;

					if (ts.isIdentifier(node) && node.getText() === NameNode) {
						// Skip if this identifier is part of a property access
						const parent = node.parent;
						if (
							!ts.isPropertyAccessExpression(parent) ||
							parent.name === node
						) {
							hasSelfRef = true;
						}
					}
					
					ts.forEachChild(node, checkNode);
				};

				checkNode(Node.initializer);
				return hasSelfRef;
			})();

			// Skip self-referential initializers
			if (containsSelfReference) {
				console.debug(
					`Skipping self-referential initializer for: ${NameNode}`,
				);

				return;
			}

			if (Usage.has(NameNode)) {
				Usage.set(NameNode, 0);
			} else if (Usage.size < MAX_USAGE_COUNT) {
				Usage.set(NameNode, 0);
			}

			if (Initializer.size < MAX_INITIALIZER_SIZE) {
				Initializer.set(Node.initializer, NameNode);
			}
		} else if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();

			if (!ts.isVariableDeclaration(Node.parent)) {
				const currentCount = Usage.get(NameNode) ?? 0;

				if (currentCount < MAX_USAGE_COUNT) {
					Usage.set(NameNode, currentCount + 1);
				} else {
					console.warn(
						`Warning: Maximum usage count reached for identifier: ${NameNode}`,
					);
				}
			}
		}
	}) satisfies Interface as Interface;

export const { default: ts } = await import("typescript");

export default Fn;
