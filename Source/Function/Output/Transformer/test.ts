// @ts-nocheck

import type Interface from "@Interface/Output/Transformer/Visit.js";
import type CountInitializer from "@Type/Output/Visit/Initializer.js";
import type Initializer from "@Type/Output/Visit/Initializer/Initializer.js";
import type {
	Expression,
	Identifier,
	Node,
	Statement,
	TransformationContext,
	VariableStatement,
} from "typescript";


class Transformer {


	Look(Node: Node): Node {
		if (ts.isVariableStatement(Node)) {
			const result = this.Variable(Node);
			return result || ts.factory.createEmptyStatement();
		}

		if (ts.isIdentifier(Node)) {
			return this.Identifier(Node);
		}

		return ts.visitEachChild(
			Node,
			(child) => this.Look(child),
			this.Context,
		);
	}

	Visit(Node: Node, Collection: number = 0): Node {
		if (Collection >= 10) {
			return Node;
		}

		this.Tracker.Scope(Node);

		let TransformedNode = this.Look(Node);

		if (TransformedNode !== Node) {
			return this.Visit(TransformedNode, Collection + 1);
		}

		return TransformedNode;
	}
}

export const {
	default: ts,
	isIdentifier,
	factory,
} = await import("typescript");

export default ((context: TransformationContext) => (rootNode) =>
	new Transformer(context).Visit(rootNode)) satisfies Interface as Interface;

export const { default: Get } = await import(
	"@Function/Output/Transformer/Visit/Get.js"
);
