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

	Variable(Name: string, Node: Node): void {
		const Result = Get(Name, "Name", this.Count);

		if (Result) {
			this.Count.get(Result)?.Usage.add({
				Node: Node,

				Position: Node.pos,
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

	Inline(Name: string, _Node?: Node): boolean {
		const Result = Get(Name, "Name", this.Count);

		if (!Result) {
			return false;
		}

		const Initializer = this.Count.get(Result);

		if (!Initializer) {
			return false;
		}

		const _Usage = Array.from(Initializer.Usage).sort(
			(Previous, Next) => Previous.Position - Next.Position,
		);

		if (_Usage.length === 0) {
			return false;
		}

		// If we have a current scope, check all usages are in same scope
		if (_Node) {
			while (
				_Node &&
				!ts.isFunctionDeclaration(_Node) &&
				!ts.isMethodDeclaration(_Node) &&
				!ts.isSourceFile(_Node)
			) {
				_Node = _Node.parent;
			}

			// Check if all usages are in the same function/method scope
			const _UsageNode = _Usage.every(({ Node }) => {
				while (
					Node &&
					!ts.isFunctionDeclaration(Node) &&
					!ts.isMethodDeclaration(Node) &&
					!ts.isSourceFile(Node)
				) {
					Node = Node.parent;
				}

				return Node === _Node;
			});

			if (!_UsageNode) {
				return false;
			}
		}

		if (
			ts.isArrayLiteralExpression(Result) ||
			// ts.isAwaitExpression(Result) ||
			// ts.isMethodDeclaration(Result) ||
			// ts.isFunctionDeclaration(Result) ||
			ts.isBinaryExpression(Result) ||
			// ts.isCallExpression(Result) ||
			ts.isNewExpression(Result)
		) {
			return false;
		}

		const Count = _Usage.length;

		return (
			Count === 1 ||
			ts.isIdentifier(Result) ||
			// Include conditional expressions as valid nodes for inlining
			ts.isConditionalExpression(Result) ||
			(ts.isLiteralExpression(Result) && Count <= 3)
		);
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
				const Resolved = this.Resolve(Node.initializer.text, Node);

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

		const Remaining = Processed.filter((Variable) => {
			if (ts.isIdentifier(Variable.name)) {
				return !this.Tracker.Inline(Variable.name.text, Variable);
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
			// Parameter in function/method declaration
			ts.isParameter(Node.parent) ||
			// Property access (e.g., obj.prop)
			(ts.isPropertyAccessExpression(Node.parent) &&
				Node.parent.name === Node) ||
			// Variable declaration
			ts.isVariableDeclaration(Node.parent) ||
			// Binding patterns
			ts.isBindingElement(Node.parent) ||
			// Class member
			ts.isMethodDeclaration(Node.parent) ||
			ts.isPropertyDeclaration(Node.parent) ||
			ts.isConstructorDeclaration(Node.parent) ||
			// Import/Export statements
			ts.isImportSpecifier(Node.parent) ||
			ts.isExportSpecifier(Node.parent) ||
			// Object literal property names
			(ts.isPropertyAssignment(Node.parent) &&
				Node.parent.name === Node) ||
			// Method parameters
			ts.isMethodSignature(Node.parent) ||
			// Type annotations
			ts.isTypeReferenceNode(Node.parent) ||
			// Class/Interface declarations
			ts.isClassDeclaration(Node.parent) ||
			ts.isInterfaceDeclaration(Node.parent)
		) {
			return Node;
		}

		return this.Resolve(Name, Node) || Node;
	}

	Resolve(Name: string, Node: Node): Expression | undefined {
		if (!this.Tracker.Inline(Name, Node)) {
			return undefined;
		}

		const Result = Get(Name, "Name", this.Tracker.Count);

		if (!Result) {
			return undefined;
		}

		if (ts.isShorthandPropertyAssignment(Result.parent)) {
			return Result as Expression;
		}

		if (ts.isIdentifier(Result)) {
			return this.Resolve(Result.text, Node) || Result;
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
				const Name = Node.name.text;
				const Resolved = this.Resolve(Name, Node);

				if (Resolved) {
					Result = ts.factory.createPropertyAssignment(
						ts.factory.createIdentifier(Name),
						ts.isConditionalExpression(Resolved)
							? ts.factory.createParenthesizedExpression(Resolved)
							: Resolved,
					);
				} else {
					Result = Node;
				}

				break;

			// Class-related nodes
			case ts.isPropertyDeclaration(Node):
			case ts.isMethodDeclaration(Node):
			case ts.isConstructorDeclaration(Node):
			case ts.isGetAccessor(Node):
			case ts.isSetAccessor(Node):
			case ts.isClassExpression(Node):

			// Function-related nodes
			case ts.isFunctionDeclaration(Node):
			case ts.isFunctionExpression(Node):
			case ts.isArrowFunction(Node):
			case ts.isCallExpression(Node):
			case ts.isNewExpression(Node):

			// Complex expressions
			case ts.isAwaitExpression(Node):
			case ts.isYieldExpression(Node):
			case ts.isSpreadElement(Node):
			case ts.isTemplateLiteral(Node):
			case ts.isTaggedTemplateExpression(Node):
			case ts.isJsxElement(Node):
			case ts.isJsxFragment(Node):

			// Object and property nodes
			case ts.isObjectLiteralExpression(Node):
			case ts.isPropertyAccessExpression(Node):
			case ts.isElementAccessExpression(Node):

			// Control flow nodes
			case ts.isIfStatement(Node):
			case ts.isSwitchStatement(Node):
			case ts.isForStatement(Node):
			case ts.isWhileStatement(Node):
			case ts.isDoStatement(Node):
			case ts.isTryStatement(Node):
				Result = Node; // Preserve these nodes as-is
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

		let Node = _Node;

		try {
			Node = this.Look(_Node) ?? _Node;
		} catch (_Error) {
			console.log("-------------------------");
			console.log("Could not transform Node:");
			console.log(_Node.getText());

			console.log("--------------");
			console.log("Errored with:");
			console.log(_Error);
		}

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
