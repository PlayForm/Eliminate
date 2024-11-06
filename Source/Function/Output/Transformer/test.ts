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

class Track {
	Count: CountInitializer = new Map();

	Scope(Node: Node): void {
		ts.forEachChild(Node, (Node) => this.Scope(Node));

		if (ts.isIdentifier(Node)) {
			if (!ts.isVariableDeclaration(Node.parent)) {
				this.Variable(Node.text, Node);
			}
		} else if (ts.isVariableStatement(Node)) {
			Node.declarationList.declarations.forEach((decl) => {
				if (ts.isIdentifier(decl.name) && decl.initializer) {
					this.Initializer(decl.name.text, decl.initializer);
				}
			});
		}
	}

	Initializer(Variable: string, Initializer: Initializer): void {
		if (!this.Count.has(Initializer)) {
			this.Count.set(Initializer, {
				Name: Variable,
				Usage: new Set(),
			});
		}
	}

	Variable(Name: string, Node: Node): void {
		const Result = Get(Name, "Name", this.Count);

		if (Result) {
			this.Count.get(Result)?.Usage.add({
				Node: Node,
				Position: Node.pos,
			});
		}
	}

	shouldInline(Name: string): boolean {
		const Result = Get(Name, "Name", this.Count);

		if (!Result) {
			return false;
		}

		const Initializer = this.Count.get(Result);

		if (!Initializer) {
			return false;
		}

		// If this initializer is a simple identifier or literal, we can be more aggressive
		const isSimpleValue =
			ts.isIdentifier(Result) || ts.isLiteralExpression(Result);

		// Count all uses of this variable
		const useCount = Initializer.Usage.size;

		// Inline if:
		// 1. Used exactly once, or
		// 2. It's a simple value and used only a few times
		return useCount === 1 || (isSimpleValue && useCount <= 3);
	}

	getInitializer(Name: string): Expression | undefined {
		const Result = Get(Name, "Name", this.Count);
		return Result as Expression | undefined;
	}
}

class Transformer {
	readonly Context: TransformationContext;
	readonly Tracker: Track;

	constructor(Context: TransformationContext) {
		this.Context = Context;
		this.Tracker = new Track();
	}

	Variable(Node: VariableStatement): Statement | undefined {
		// First, process all initializers to resolve any references
		const Processed = Node.declarationList.declarations.map((decl) => {
			if (decl.initializer && ts.isIdentifier(decl.initializer)) {
				const Resolved = this.resolveChain(decl.initializer.text);
				if (Resolved) {
					return ts.factory.updateVariableDeclaration(
						decl,
						decl.name,
						decl.exclamationToken,
						decl.type,
						Resolved,
					);
				}
			}
			return decl;
		});

		// Filter out declarations that should be inlined
		const Remaining = Processed.filter((decl) => {
			if (ts.isIdentifier(decl.name)) {
				return !this.Tracker.shouldInline(decl.name.text);
			}
			return true;
		});

		// If no declarations remain, return undefined (will be filtered out)
		if (Remaining.length === 0) {
			return undefined;
		}

		// If some declarations remain, create a new variable statement
		return ts.factory.createVariableStatement(
			Node.modifiers,
			ts.factory.createVariableDeclarationList(
				Remaining,
				Node.declarationList.flags,
			),
		);
	}

	Identifier(Node: Identifier): Expression {
		const Name = Node.text;

		// Skip if this is a declaration or property access
		if (
			(ts.isPropertyAccessExpression(Node.parent) &&
				Node.parent.name === Node) ||
			ts.isVariableDeclaration(Node.parent) ||
			ts.isBindingElement(Node.parent)
		) {
			return Node;
		}

		// Resolve the full chain of references
		const resolved = this.resolveChain(Name);
		return resolved || Node;
	}

	resolveChain(Name: string): Expression | undefined {
		if (!this.Tracker.shouldInline(Name)) {
			return undefined;
		}

		const initializer = this.Tracker.getInitializer(Name);
		if (!initializer) {
			return undefined;
		}

		// If the initializer is an identifier, try to resolve it further
		if (ts.isIdentifier(initializer)) {
			return this.resolveChain(initializer.text) || initializer;
		}

		return initializer;
	}

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
