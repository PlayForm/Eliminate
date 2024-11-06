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

/**
 * @module Output
 *
 */

class Track {
	Count: CountInitializer = new Map();

	Scope(Node: Node): void {
		ts.forEachChild(Node, (Node) => this.Scope(Node));

		// This is a usage of a variable, not its declaration
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
		console.log(`--------------------------${"-".repeat(Variable.length)}`);

		console.log(`Tracking initializer for: ${Variable}`);

		if (!this.Count.has(Initializer)) {
			this.Count.set(Initializer, {
				Name: Variable,
				Usage: new Set(),
			});
		}
	}

	Variable(Name: string, Node: Node): void {
		console.log(`----------------${"-".repeat(Name.length)}`);

		console.log(`Tracking use of ${Name}`);

		const Result = Get(Name, "Name", this.Count);

		if (Result) {
			this.Count.get(Result)?.Usage.add({
				Node: Node,
				Position: Node.pos,
			});
		}
	}

	Inline(Name: string): boolean {
		const Result = Get(Name, "Name", this.Count);

		if (!Result) {
			return false;
		}

		const Initializer = this.Count.get(Result);

		if (!Initializer) {
			return false;
		}

		// If this initializer is a simple identifier, we can be more aggressive with inlining
		const isSimpleIdentifier = ts.isIdentifier(Result);

		// Count all uses of this variable
		const useCount = Initializer.Usage.size;

		// Inline if:
		// 1. Used exactly once, or
		// 2. It's a simple identifier reference and used only a few times
		if (useCount === 3 || (isSimpleIdentifier && useCount <= 3)) {
			return true;
		}

		// Don't inline other expression types (function calls, operations, etc)
		// as they may have side effects or be computationally expensive
		return false;
	}
}

class Transformer {
	readonly Context: TransformationContext;

	readonly Tracker: Track;

	constructor(Context: TransformationContext) {
		this.Context = Context;

		this.Tracker = new Track();
	}

	Variable(Node: VariableStatement): Statement {
		// First, process all initializers to resolve any references
		const Processed = Node.declarationList.declarations.map((decl) => {
			if (decl.initializer && ts.isIdentifier(decl.initializer)) {
				const Resolved = this.Resolve(decl.initializer.text);

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

		// Filter out declarations that have been inlined
		const Remaining = Processed.filter((decl) => {
			if (ts.isIdentifier(decl.name)) {
				return !this.Tracker.Inline(decl.name.text);
			}

			return true;
		});

		// If all declarations have been inlined, return an empty statement
		if (Remaining.length === 0) {
			return ts.factory.createEmptyStatement();
		}

		// If some declarations remain, create a new variable statement
		if (Remaining.length !== Node.declarationList.declarations.length) {
			return ts.factory.createVariableStatement(
				Node.modifiers,
				ts.factory.createVariableDeclarationList(
					Remaining,
					Node.declarationList.flags,
				),
			);
		}

		return Node;
	}

	Identifier(Node: Identifier) {
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

		// if (this.Tracker.Inline(Name)) {
		// 	const Inlined = Get(Name, "Name", this.Tracker.Count);

		// 	if (Inlined) {
		// 		return ts.visitNode(Inlined, (Node) => this.Look(Node));
		// 	}
		// }

		// Fully resolve through the chain
		const resolvedInitializer = this.Resolve(Name);

		if (resolvedInitializer) {
			return resolvedInitializer;
		}

		return Node;
	}

	Resolve(Name: string): Expression | undefined {
		if (this.Tracker.Inline(Name)) {
			const Result = Get(Name, "Name", this.Tracker.Count);

			if (Result && ts.isIdentifier(Result)) {
				// Recursively resolve if the initializer is another identifier
				return this.Resolve(Result.text) ?? Result;
			}

			return Result;
		}

		return undefined;
	}

	Look(Node: Node): Node {
		// Process current node first
		let Result: Node;

		switch (true) {
			case ts.isVariableStatement(Node):
				Result = this.Variable(Node);

				break;

			case ts.isIdentifier(Node):
				Result = this.Identifier(Node);

				break;

			default:
				Result = Node;
		}

		return ts.visitEachChild(
			Result,
			(Node) => this.Look(Node),
			this.Context,
		);
	}

	Visit(_Node: Node, Collection: number = 0): Node {
		console.log(
			`-----------------------${"-".repeat(Collection.toString().length)}`,
		);

		console.log(`Visiting for the ${Collection} time.`);

		const Failed = 10;

		if (Collection >= Failed) {
			return _Node;
		}

		this.Tracker.Scope(_Node);

		let Node = this.Look(_Node);

		if (Node !== _Node) {
			return this.Visit(Node, Collection + 1);
		}

		return Node;
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
