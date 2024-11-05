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

			declarationNode: VariableStatement;
		}
	>();

	trackVariable(
		name: string,
		initializer: Expression,
		declarationNode: VariableStatement,
	): void {
		console.log(`Tracking variable: ${name}`);

		if (!this.variableMap.has(name)) {
			this.variableMap.set(name, {
				initializer,
				uses: new Set(),
				isInlined: false,
				declarationNode,
			});
		}
	}

	trackUse(name: string, node: Node, isReference: boolean = true): void {
		const entry = this.variableMap.get(name);

		if (entry) {
			console.log(`Tracking use of ${name}, isReference: ${isReference}`);

			entry.uses.add({ node, isReference });
		}
	}

	shouldInline(name: string): boolean {
		const entry = this.variableMap.get(name);

		console.log(`Checking inline for ${name}:`);

		if (!entry || entry.isInlined) {
			console.log(`${name}: Cannot inline - no entry or already inlined`);

			return false;
		}

		const referenceUses = Array.from(entry.uses).filter(
			(use) => use.isReference,
		);

		console.log(`${name}: Reference uses:`, referenceUses.length);

		// Only inline if:
		// 1. Has initializer
		// 2. Used between 1-2 times as reference
		const shouldInline =
			referenceUses.length > 0 && referenceUses.length <= 1;

		console.log(`${name}: Final inline decision:`, shouldInline, {
			referenceCount: referenceUses.length,
		});

		return shouldInline;
	}

	getInitializer(name: string): Expression | undefined {
		return this.variableMap.get(name)?.initializer;
	}

	markInlined(name: string): void {
		console.log(`Marking ${name} as inlined`);

		const entry = this.variableMap.get(name);

		if (entry) {
			entry.isInlined = true;
		}
	}

	getDeclarationStatus(
		statement: VariableStatement,
	): { name: string; shouldInline: boolean }[] {
		return statement.declarationList.declarations.map((decl) => {
			if (!ts.isIdentifier(decl.name)) {
				return { name: "", shouldInline: false };
			}

			const name = decl.name.text;

			const shouldInline = this.shouldInline(name);

			console.log(`Declaration status for ${name}:`, shouldInline);

			return {
				name,
				shouldInline,
			};
		});
	}

	clear(): void {
		console.log("Clearing tracker");

		this.variableMap.clear();
	}

	hasInlinedVariables(): boolean {
		const result = Array.from(this.variableMap.values()).some(
			(entry) => entry.isInlined,
		);

		console.log("Has inlined variables:", result);

		return result;
	}

	dumpState(): void {
		console.log("\n=== Declaration Tracker State ===");

		for (const [name, entry] of this.variableMap.entries()) {
			console.log(`\nVariable: ${name}`);

			console.log("Inlined:", entry.isInlined);

			console.log("Uses:", entry.uses.size);

			console.log(
				"Uses detail:",
				Array.from(entry.uses).map((use) => ({
					kind: use.node.kind,
					isReference: use.isReference,
				})),
			);
		}

		console.log("\n==============================\n");
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
			console.log(`Skipping identifier ${name} - special case`);

			return node;
		}

		if (this.tracker.shouldInline(name)) {
			const initializer = this.tracker.getInitializer(name);

			console.log(`Attempting to inline ${name}`, {
				hasInitializer: !!initializer,
			});

			if (initializer) {
				// Mark as inlined to prevent duplicate processing
				this.tracker.markInlined(name);

				// Create a copy of the initializer
				const inlined = ts.visitNode(initializer, (node) =>
					ts.isExpression(node)
						? node
						: ts.factory.createIdentifier(name),
				) as Expression;

				console.log(`Successfully inlined ${name}`);

				return inlined;
			}
		}

		return node;
	}

	private visitVariableStatement(node: VariableStatement): Statement {
		// First track all declarations in this statement
		node.declarationList.declarations.forEach((decl) => {
			if (ts.isIdentifier(decl.name) && decl.initializer) {
				this.tracker.trackVariable(
					decl.name.text,
					decl.initializer,
					node,
				);
			}
		});

		// Check inlining status for all declarations in this statement
		const declarationStatuses = this.tracker.getDeclarationStatus(node);

		console.log(
			"Variable statement declaration statuses:",
			declarationStatuses,
		);

		// If all declarations can be inlined, mark for removal
		if (declarationStatuses.every((status) => status.shouldInline)) {
			console.log("All declarations can be inlined, removing statement");

			// Mark all as inlined
			declarationStatuses.forEach((status) => {
				if (status.name) {
					this.tracker.markInlined(status.name);
				}
			});

			return ts.factory.createEmptyStatement();
		}

		return node;
	}

	private visitNode(node: Node): Node {
		// First collect all variable uses
		if (ts.isIdentifier(node) && !ts.isVariableDeclaration(node.parent)) {
			this.tracker.trackUse(
				node.text,
				node,
				!ts.isPropertyAccessExpression(node.parent) ||
					node.parent.expression === node,
			);
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

	transform(sourceFile: Node, passCount: number = 0): Node {
		const MAX_PASSES = 10;

		console.log(`\n=== Starting transform pass ${passCount} ===`);

		if (passCount >= MAX_PASSES) {
			console.log("Reached max passes");

			return sourceFile;
		}

		// Clear the tracker for this pass
		this.tracker.clear();

		// First pass: collect all declarations and uses
		ts.visitNode(sourceFile, (node) => {
			if (ts.isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (ts.isIdentifier(decl.name) && decl.initializer) {
						this.tracker.trackVariable(
							decl.name.text,
							decl.initializer,
							node,
						);
					}
				});
			}

			if (
				ts.isIdentifier(node) &&
				!ts.isVariableDeclaration(node.parent)
			) {
				this.tracker.trackUse(
					node.text,
					node,
					!ts.isPropertyAccessExpression(node.parent) ||
						node.parent.expression === node,
				);
			}

			return node;
		});

		console.log("\nTracker state after collecting declarations and uses:");

		this.tracker.dumpState();

		// Second pass: perform the transformation
		const result = ts.visitNode(sourceFile, (node) => this.visitNode(node));

		// If we made any changes in this pass, do another pass
		if (this.tracker.hasInlinedVariables() && result !== sourceFile) {
			console.log("Changes detected, starting another pass");

			return this.transform(result, passCount + 1);
		}

		console.log("No more changes needed");

		return result;
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
