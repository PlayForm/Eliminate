import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	Identifier,
	Node,
	TransformationContext,
	VariableStatement,
	Expression,
} from "typescript";

// ... [previous code remains the same until handleGenericNode]

private handleGenericNode(node: Node, depth: number): VisitResult {
	let modified = false;

	// Special handling for property assignments
	if (ts.isPropertyAssignment(node)) {
		const nameResult = ts.isComputedPropertyName(node.name) 
			? this.visitNode(node.name.expression) 
			: { node: node.name, modified: false };
		const initializerResult = this.visitNode(node.initializer);
		
		if (nameResult.modified || initializerResult.modified) {
			modified = true;
			const newName = ts.isComputedPropertyName(node.name) 
				? factory.createComputedPropertyName(nameResult.node as Expression)
				: node.name;
			return this.createVisitResult(
				factory.createPropertyAssignment(
					newName,
					initializerResult.node as Expression
				),
				true
			);
		}
		return this.createVisitResult(node, false);
	}

	// Special handling for array literals
	if (ts.isArrayLiteralExpression(node)) {
		const elements = node.elements.map(element => {
			const result = this.visitNode(element);
			modified = modified || result.modified;
			return result.node;
		});

		if (modified) {
			return this.createVisitResult(
				factory.createArrayLiteralExpression(
					elements as Expression[]
				),
				true
			);
		}
		return this.createVisitResult(node, false);
	}

	// Handle all other nodes
	const newNode = ts.visitEachChild(
		node,
		(child) => {
			const result = this.visitNode(child, depth + 1);
			modified = modified || result.modified;
			return result.node;
		},
		this.state.context
	);

	return this.createVisitResult(newNode, modified);
}

// ... [rest of the code remains the same]
