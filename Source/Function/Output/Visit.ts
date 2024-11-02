import type Interface from "@Interface/Output/Visit.js";

/**
 * @module Output
 *
 */
export const Fn = ((...[Usage, Initializer]) =>
	(...[Node]) => {
		const MAX_USAGE_COUNT = 1000; // Prevent runaway usage counts
		const MAX_INITIALIZER_SIZE = 1000; // Prevent too many initializers

		// Check Maps size before processing
		if (
			Usage.size >= MAX_USAGE_COUNT ||
			Initializer.size >= MAX_INITIALIZER_SIZE
		) {
			console.warn("Warning: Maximum map size reached", {
				usageSize: Usage.size,
				initializerSize: Initializer.size,
			});
			return; // Early exit if maps are too large
		}

		ts.forEachChild(Node, Fn(Usage, Initializer));

		if (ts.isVariableDeclaration(Node) && Node.initializer) {
			const NameNode = Node.name.getText();

			// Reset the usage, but first check if the name exists
			if (Usage.has(NameNode)) {
				Usage.set(NameNode, 0);
			} else if (Usage.size < MAX_USAGE_COUNT) {
				Usage.set(NameNode, 0);
			}

			// Set the initializer with size check
			if (Initializer.size < MAX_INITIALIZER_SIZE) {
				Initializer.set(Node.initializer, NameNode);
			}
		} else if (ts.isIdentifier(Node)) {
			const NameNode = Node.getText();

			// Increment if usage is found, with bounds checking
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
