import type Interface from "@Interface/Output/Transformer/Visit.js";
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

class DeclarationTracker {
	private variableMap = new Map<
		string,
		{
			initializer: Expression;

			uses: Set<{
				node: Node;

				isReference: boolean;
			}>;

			isInlined: boolean;
		}
	>();

	trackVariable(name: string, initializer: Expression): void {
		if (!this.variableMap.has(name)) {
			this.variableMap.set(name, {
				initializer,
				uses: new Set(),
				isInlined: false,
			});
		}
	}

	trackUse(name: string, node: Node, isReference: boolean = true): void {
		const entry = this.variableMap.get(name);

		if (entry) {
			entry.uses.add({ node, isReference });
		}
	}

	shouldInline(name: string): boolean {
		const entry = this.variableMap.get(name);

		if (!entry || entry.isInlined) return false;

		const referenceUses = Array.from(entry.uses).filter(
			(use) => use.isReference,
		);

		// Check for reassignment
		const isReassigned = Array.from(entry.uses).some((use) => {
			const parent = use.node.parent;

			return (
				ts.isBinaryExpression(parent) &&
				parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				ts.isIdentifier(parent.left) &&
				parent.left.text === name
			);
		});

		// Only inline if:
		// 1. Has initializer
		// 2. Not reassigned
		// 3. Used between 1-2 times as reference
		return (
			!isReassigned &&
			referenceUses.length > 0 &&
			referenceUses.length <= 2
		);
	}

	getInitializer(name: string): Expression | undefined {
		return this.variableMap.get(name)?.initializer;
	}

	markInlined(name: string): void {
		const entry = this.variableMap.get(name);

		if (entry) {
			entry.isInlined = true;
		}
	}

	clear(): void {
		this.variableMap.clear();
	}
}

class Transformer {
	private readonly context: TransformationContext;

	private readonly tracker: DeclarationTracker;

	constructor(context: TransformationContext) {
		this.context = context;

		this.tracker = new DeclarationTracker();
	}

	private visitIdentifier(node: Identifier): Expression {
		const name = node.text;

		// Don't process identifiers that are property names or declaration names
		if (
			(ts.isPropertyAccessExpression(node.parent) &&
				node.parent.name === node) ||
			ts.isVariableDeclaration(node.parent) ||
			ts.isBindingElement(node.parent)
		) {
			return node;
		}

		if (this.tracker.shouldInline(name)) {
			const initializer = this.tracker.getInitializer(name);

			if (initializer) {
				// Mark as inlined to prevent duplicate processing
				this.tracker.markInlined(name);

				// Create a copy of the initializer
				return ts.visitNode(initializer, (node) =>
					ts.isExpression(node)
						? node
						: ts.factory.createIdentifier(name),
				) as Expression;
			}
		}

		return node;
	}

	private visitVariableStatement(node: VariableStatement): Statement {
		const declarations = node.declarationList.declarations;

		// Track all variable declarations and their initializers
		declarations.forEach((decl) => {
			if (ts.isIdentifier(decl.name) && decl.initializer) {
				const name = decl.name.text;

				this.tracker.trackVariable(name, decl.initializer);
			}
		});

		// Filter out declarations that have been inlined
		const remainingDeclarations = declarations.filter((decl) => {
			if (!ts.isIdentifier(decl.name)) return true;

			return !this.tracker.shouldInline(decl.name.text);
		});

		if (remainingDeclarations.length === 0) {
			return ts.factory.createEmptyStatement();
		}

		if (remainingDeclarations.length !== declarations.length) {
			return ts.factory.updateVariableStatement(
				node,
				node.modifiers,
				ts.factory.createVariableDeclarationList(
					remainingDeclarations,
					node.declarationList.flags,
				),
			);
		}

		return node;
	}

	private visitNode(node: Node): Node {
		// First collect all variable uses
		if (ts.isIdentifier(node) && !ts.isVariableDeclaration(node.parent)) {
			this.tracker.trackUse(node.text, node);
		}

		// Handle specific node types
		if (ts.isVariableStatement(node)) {
			return this.visitVariableStatement(node);
		}

		if (ts.isIdentifier(node)) {
			return this.visitIdentifier(node);
		}

		// Recursively visit all children
		return ts.visitEachChild(
			node,
			(child) => this.visitNode(child),
			this.context,
		);
	}

	transform(sourceFile: Node): Node {
		// First pass: collect all declarations and uses
		ts.visitNode(sourceFile, (node) => {
			if (ts.isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (ts.isIdentifier(decl.name) && decl.initializer) {
						this.tracker.trackVariable(
							decl.name.text,
							decl.initializer,
						);
					}
				});
			}

			if (
				ts.isIdentifier(node) &&
				!ts.isVariableDeclaration(node.parent)
			) {
				this.tracker.trackUse(node.text, node);
			}

			return node;
		});

		// Second pass: perform the actual transformation
		return ts.visitNode(sourceFile, (node) => this.visitNode(node));
	}
}

export const {
	default: ts,

	isIdentifier,

	factory,
} = await import("typescript");

export default ((context: TransformationContext) => (rootNode) =>
	new Transformer(context).transform(
		rootNode,
	)) satisfies Interface as Interface;
