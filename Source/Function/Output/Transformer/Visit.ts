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
			entry.uses.add({ node, isReference });
		}
	}

	shouldInline(name: string): boolean {
		const entry = this.variableMap.get(name);

		if (!entry || entry.isInlined) {
			return false;
		}

		return (
			Array.from(entry.uses).filter((use) => use.isReference).length == 1
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

	getDeclarationStatus(
		statement: VariableStatement,
	): { name: string; shouldInline: boolean }[] {
		return statement.declarationList.declarations.map((decl) => {
			if (!ts.isIdentifier(decl.name)) {
				return { name: "", shouldInline: false };
			}

			const name = decl.name.text;

			const shouldInline = this.shouldInline(name);

			return {
				name,
				shouldInline,
			};
		});
	}

	clear(): void {
		this.variableMap.clear();
	}

	hasInlinedVariables(): boolean {
		const result = Array.from(this.variableMap.values()).some(
			(entry) => entry.isInlined,
		);

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

		console.log("\n=================================\n");
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

		if (!ts.isVariableDeclaration(node.parent)) {
			this.tracker.trackUse(
				node.text,
				node,
				!(
					ts.isPropertyAccessExpression(node.parent) &&
					node.parent.name === node
				),
			);
		}

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
				this.tracker.markInlined(name);

				const inlined = ts.visitNode(initializer, (node) =>
					ts.isExpression(node)
						? node
						: ts.factory.createIdentifier(name),
				) as Expression;

				return inlined;
			}
		}

		return node;
	}

	private visitVariableStatement(node: VariableStatement): Statement {
		node.declarationList.declarations.forEach((decl) => {
			if (ts.isIdentifier(decl.name) && decl.initializer) {
				this.tracker.trackVariable(
					decl.name.text,
					decl.initializer,
					node,
				);
			}
		});

		const declarationStatuses = this.tracker.getDeclarationStatus(node);

		if (declarationStatuses.every((status) => status.shouldInline)) {
			declarationStatuses.forEach((status) => {
				if (status.name) {
					this.tracker.markInlined(status.name);
				}
			});

			return ts.factory.createEmptyStatement();
		}

		return ts.visitEachChild(
			node,
			(child) => this.visitNode(child),
			this.context,
		) as VariableStatement;
	}

	private visitNode(node: Node): Node {
		if (ts.isVariableStatement(node)) {
			return this.visitVariableStatement(node);
		}

		if (ts.isIdentifier(node)) {
			return this.visitIdentifier(node);
		}

		return ts.visitEachChild(
			node,
			(child) => this.visitNode(child),
			this.context,
		);
	}

	transform(sourceFile: Node, passCount: number = 0): Node {
		const MAX_PASSES = 10;

		if (passCount >= MAX_PASSES) {
			return sourceFile;
		}

		this.tracker.clear();

		this.tracker.dumpState();

		let result = ts.visitNode(sourceFile, (node) => this.visitNode(node));

		if (this.tracker.hasInlinedVariables() && result !== sourceFile) {
			return this.transform(result, passCount + 1);
		}

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
