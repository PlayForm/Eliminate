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
class Transformer {
	readonly Context: TransformationContext;

	readonly Tracker: Track;

	constructor(Context: TransformationContext) {
		this.Context = Context;

		this.Tracker = new Track();
	}

	Variable(Node: VariableStatement): Statement {
		// Reset tracking for each new pass to catch newly inlinable variables
		this.Tracker.Status.clear();

		// Visit children first to process any nested references
		const Result = ts.visitEachChild(
			Node,
			(Node) => this.Look(Node),
			this.Context,
		);

		// Filter out declarations that have been inlined
		const Remaining = Result.declarationList.declarations.filter((decl) => {
			if (ts.isIdentifier(decl.name)) {
				const shouldInline = this.Tracker.Inline(decl.name.text);
				if (shouldInline) {
					// Mark this declaration as handled to avoid duplicate processing
					this.Tracker.Status.add(decl);
				}

				return !shouldInline;
			}

			return true;
		});

		// If all declarations have been inlined, return an empty statement
		if (Remaining.length === 0) {
			return ts.factory.createEmptyStatement();
		}

		// If some declarations remain, create a new variable statement
		if (Remaining.length !== Result.declarationList.declarations.length) {
			// Create new statement with remaining declarations
			const New = ts.factory.createVariableStatement(
				Result.modifiers,
				ts.factory.createVariableDeclarationList(
					Remaining,
					Result.declarationList.flags,
				),
			);

			// Re-run analysis on the new statement to catch newly inlinable variables
			this.Tracker.Scope(New);

			return New;
		}

		return Result;
	}

	Identifier(Node: Identifier) {
		// Visit any child nodes first (though identifiers typically don't have children)
		const Result = ts.visitEachChild(
			Node,
			(Node) => this.Look(Node),
			this.Context,
		);

		const name = Result.text;

		if (
			(ts.isPropertyAccessExpression(Result.parent) &&
				Result.parent.name === Result) ||
			ts.isVariableDeclaration(Result.parent) ||
			ts.isBindingElement(Result.parent)
		) {
			return Result;
		}

		if (this.Tracker.Inline(name)) {
			const Inlined = Get(name, "Name", this.Tracker.Count);

			if (Inlined) {
				return ts.visitNode(Inlined, (node) =>
					ts.isExpression(node)
						? node
						: ts.factory.createIdentifier(name),
				) as Expression;
			}
		}

		return Result;
	}

	Look(Node: Node): Node {
		switch (true) {
			case ts.isVariableStatement(Node):
				return this.Variable(Node);

			case ts.isIdentifier(Node):
				return this.Identifier(Node);

			default:
				return ts.visitEachChild(
					Node,
					(Node) => this.Look(Node),
					this.Context,
				);
		}
	}

	Visit(_Node: Node, Collection: number = 0): Node {
		const Failed = 10;

		if (Collection >= Failed) {
			return _Node;
		}

		// Clear status before each full pass
		this.Tracker.Status.clear();

		this.Tracker.Scope(_Node);

		// Transform the node
		let Node = ts.visitNode(_Node, (Node) => this.Look(Node));

		// If changes were made, process again to catch newly inlinable variables
		if (Node !== _Node) {
			// Re-analyze the entire tree since inlining may have created new opportunities
			return this.Visit(Node, Collection + 1);
		}

		return Node;
	}
}

class Track {
	Count: CountInitializer = new Map();

	Status: Set<Node> = new Set();

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
		if (useCount === 1 || (isSimpleIdentifier && useCount <= 3)) {
			return true;
		}

		// Don't inline other expression types (function calls, operations, etc)
		// as they may have side effects or be computationally expensive
		return false;
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
