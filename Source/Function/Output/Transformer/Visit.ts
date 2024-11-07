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

		if (!Node) {
			return;
		}

		if (ts.isIdentifier(Node)) {
			// Check for reassignment in assignment expressions
			if (
				Node.parent &&
				ts.isBinaryExpression(Node.parent) &&
				Node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				Node.parent.left === Node
			) {
				// this.Reassignment(Node.text, Node);
				const Result = Get(Node.text, "Name", this.Count);
				if (Result) {
					this.Count.delete(Result);
				}
			}

			if (!Node.parent || !ts.isVariableDeclaration(Node.parent)) {
				this.Variable(Node.text, Node);
			}
		} else if (ts.isVariableStatement(Node)) {
			Node.declarationList.declarations.forEach((decl) => {
				if (ts.isIdentifier(decl.name) && decl.initializer) {
					if (
						!(
							Node.modifiers?.some(
								(m) => m.kind === ts.SyntaxKind.ExportKeyword,
							) ?? false
						)
					) {
						this.Initializer(decl.name.text, decl.initializer);
					}
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

	Inline(Name: string): boolean {
		const Result = Get(Name, "Name", this.Count);

		if (!Result) {
			return false;
		}

		const Initializer = this.Count.get(Result);

		if (!Initializer) {
			return false;
		}

		// Don't inline if it's a method/function definition
		if (
			ts.isMethodDeclaration(Result) ||
			ts.isFunctionDeclaration(Result)
		) {
			return false;
		}

		// Don't inline if it's a function call or new expression
		if (ts.isCallExpression(Result) || ts.isNewExpression(Result)) {
			return false;
		}

		const Count = Initializer.Usage.size;

		return (
			Count === 1 ||
			ts.isIdentifier(Result) ||
			// Include conditional expressions as valid nodes for inlining
			ts.isConditionalExpression(Result) ||
			(ts.isLiteralExpression(Result) && Count <= 3)
		);
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
		const Processed = Node.declarationList.declarations.map((Node) => {
			if (Node.initializer && ts.isIdentifier(Node.initializer)) {
				const Resolved = this.Resolve(Node.initializer.text);

				if (Resolved) {
					return ts.factory.updateVariableDeclaration(
						Node,
						Node.name,
						Node.exclamationToken,
						Node.type,
						Resolved,
					);
				}
			}

			return Node;
		});

		const Remaining = Processed.filter((decl) => {
			if (ts.isIdentifier(decl.name)) {
				return !this.Tracker.Inline(decl.name.text);
			}

			return true;
		});

		if (Remaining.length === 0) {
			return undefined;
		}

		return ts.factory.createVariableStatement(
			Node.modifiers,
			ts.factory.createVariableDeclarationList(
				Remaining,
				Node.declarationList.flags,
			),
		);
	}

	Identifier(Node: Identifier) {
		const Name = Node.text;

		// Add null checks for Node.parent
		if (!Node.parent) {
			return Node;
		}

		if (
			(ts.isPropertyAccessExpression(Node.parent) &&
				Node.parent.name === Node) ||
			ts.isVariableDeclaration(Node.parent) ||
			ts.isBindingElement(Node.parent)
		) {
			return Node;
		}

		return this.Resolve(Name) || Node;
	}

	Resolve(Name: string): Expression | undefined {
		if (!this.Tracker.Inline(Name)) {
			return undefined;
		}

		const Result = Get(Name, "Name", this.Tracker.Count);

		if (!Result) {
			return undefined;
		}

		// If we're in an object literal property assignment, create a property assignment node
		if (ts.isShorthandPropertyAssignment(Result.parent)) {
			// For shorthand properties, we want the expression from Result directly
			return Result as Expression;
		}

		if (ts.isIdentifier(Result)) {
			return this.Resolve(Result.text) || Result;
		}

		return Result;
	}

	Look(Node: Node): Node | undefined {
		let Result: Node | undefined;

		switch (true) {
			case ts.isVariableStatement(Node):
				Result = this.Variable(Node);

				break;

			case ts.isIdentifier(Node):
				Result = this.Identifier(Node);

				break;

			case ts.isShorthandPropertyAssignment(Node):
				// Handle shorthand property assignments with conditional expressions
				const Name = Node.name.text;
				const Resolved = this.Resolve(Name);

				if (Resolved) {
					// Wrap conditional expressions in parentheses
					const Value = ts.isConditionalExpression(Resolved)
						? ts.factory.createParenthesizedExpression(Resolved)
						: Resolved;

					Result = ts.factory.createPropertyAssignment(
						ts.factory.createIdentifier(Name),
						Value,
					);
				} else {
					Result = Node;
				}

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
		const Failed = 10;

		if (Collection >= Failed) {
			return _Node;
		}

		this.Tracker.Scope(_Node);

		let Node = this.Look(_Node);

		if (Node && Node !== _Node) {
			return this.Visit(Node, Collection + 1);
		}

		return _Node;
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
