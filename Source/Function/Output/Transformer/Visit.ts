import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	ArrowFunction,
	CallExpression,
	Expression,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	Node,
	Statement,
	TransformationContext,
	VariableStatement,
} from "typescript";

/**
 * @module Output
 * Enhanced transformer with comprehensive validation, error handling,
 *
 *
 * and bottom-up evaluation of variables with cycle detection and scope analysis
 */

type VisitResult<T extends Node = Node> = {
	readonly node: T;

	readonly modified: boolean;

	readonly dependencies?: Set<string>;

	readonly scope?: ScopeInfo;
};

interface ScopeInfo {
	readonly variables: Set<string>;

	readonly parent?: ScopeInfo;
}

interface FunctionInfo {
	node: FunctionDeclaration | ArrowFunction | FunctionExpression;

	uses: number;
}

interface TransformerState {
	readonly context: TransformationContext;

	readonly errors: Array<TransformError>;

	readonly currentScope?: ScopeInfo;
}

interface TransformError {
	readonly code: ErrorCode;

	readonly message: string;

	readonly node: Node;

	readonly stack?: string;
}

enum ErrorCode {
	INVALID_REPLACEMENT = "INVALID_REPLACEMENT",

	TRANSFORMATION_ERROR = "TRANSFORMATION_ERROR",
}

class DeclarationTracker {
	declarations = new Map<
		string,
		{
			node: Node;

			scope: ScopeInfo;

			complexity: number;
		}
	>();

	uses = new Map<
		string,
		Set<{
			node: Node;

			scope: ScopeInfo;

			isReference: boolean;
		}>
	>();

	functions = new Map<string, FunctionInfo>();

	trackFunction(
		name: string,

		node: FunctionDeclaration | ArrowFunction | FunctionExpression,
	): void {
		this.functions.set(name, { node, uses: 0 });
	}

	trackDeclaration(name: string, node: Node, scope: ScopeInfo): void {
		this.declarations.set(name, {
			node,

			scope,

			complexity: this.calculateComplexity(node),
		});

		if (!this.uses.has(name)) {
			this.uses.set(name, new Set());
		}
	}

	trackUse(
		name: string,

		node: Node,

		scope: ScopeInfo,

		isReference: boolean = true,
	): void {
		if (!this.uses.has(name)) {
			this.uses.set(name, new Set());
		}

		this.uses.get(name)!.add({ node, scope, isReference });
	}

	incrementFunctionUses(name: string): void {
		const func = this.functions.get(name);

		if (func) {
			func.uses++;
		}
	}

	getDeclaration(name: string): { node: Node; scope: ScopeInfo } | undefined {
		return this.declarations.get(name);
	}

	getFunctionUses(name: string): number {
		return this.functions.get(name)?.uses ?? 0;
	}

	isSimpleExpression(node: Expression): boolean {
		return (
			ts.isIdentifier(node) ||
			ts.isLiteralExpression(node) ||
			ts.isObjectLiteralExpression(node) ||
			ts.isArrayLiteralExpression(node) ||
			ts.isTemplateExpression(node) ||
			ts.isNoSubstitutionTemplateLiteral(node) ||
			(ts.isParenthesizedExpression(node) &&
				this.isSimpleExpression(node.expression))
		);
	}

	shouldInlineVariable(name: string): boolean {
		const decl = this.declarations.get(name);

		const uses = this.uses.get(name);

		console.log(`C: Checking inlining for ${name}:`);

		console.log(`- Has declaration: ${!!decl}`);

		console.log(`- Has uses: ${!!uses}`);

		if (!decl || !uses) return false;

		////////////////////////////////////////////
		// Check if the variable is ever reassigned
		// good thing

		// const isReassigned = Array.from(uses).some((use) => {

		// 	const parent = use.node.parent;

		// 	return (
		// 		ts.isBinaryExpression(parent) &&
		// 		parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
		// 		ts.isIdentifier(parent.left) &&
		// 		parent.left.text === name
		// 	);

		// });

		// if (isReassigned) return false;

		////////////////////////////////////////////

		// Count only reference uses
		const referenceUses = Array.from(uses).filter((use) => use.isReference);

		console.log(`- Reference uses count: ${referenceUses.length}`);

		// We want to inline if:
		// 1. The variable is referenced exactly once
		// 2. The declaration is a simple expression
		// 3. The complexity is reasonable
		if (referenceUses.length !== 2) return false;

		const node = decl.node;

		console.log(`- Node kind: ${ts.SyntaxKind[node.kind]}`);

		// Check if the initializer is safe to inline
		const isSafeToInline =
			ts.isIdentifier(node) ||
			ts.isLiteralExpression(node) ||
			ts.isObjectLiteralExpression(node) ||
			ts.isArrayLiteralExpression(node) ||
			(ts.isParenthesizedExpression(node) &&
				this.isSimpleExpression(node.expression));

		console.log(`- Is safe to inline: ${isSafeToInline}`);

		console.log(`- Complexity: ${decl.complexity}`);

		return isSafeToInline && decl.complexity <= 3;
	}

	calculateComplexity(node: Node): number {
		let complexity = 1;

		ts.forEachChild(node, (child) => {
			complexity += this.calculateComplexity(child);
		});

		return complexity;
	}

	clear(): void {
		this.declarations.clear();

		this.uses.clear();

		this.functions.clear();
	}
}

class Transformer {
	readonly state: TransformerState;

	readonly tracker: DeclarationTracker;

	constructor(context: TransformationContext) {
		this.state = {
			context,

			errors: [],

			currentScope: { variables: new Set() },
		};

		this.tracker = new DeclarationTracker();
	}

	handleIdentifier(
		node: Identifier,

		scope: ScopeInfo,
	): VisitResult<Expression> {
		const name = node.text;

		const decl = this.tracker.getDeclaration(name);

		console.log(`-----------------------${"-".repeat(name.length)}`);

		console.log(`H: Handling identifier ${name}`);

		if (!decl || !this.tracker.shouldInlineVariable(name)) {
			console.log(`N: Not inlining ${name}`);

			return { node, modified: false };
		}

		console.log(`I: Inlining ${name}`);

		try {
			// Create a deep copy by using the factory to recreate the expression
			const originalExpression = decl.node as Expression;

			let replacement: Expression;

			// Handle different types of expressions
			if (ts.isIdentifier(originalExpression)) {
				replacement = ts.factory.createIdentifier(
					originalExpression.text,
				);
			} else if (ts.isStringLiteral(originalExpression)) {
				replacement = ts.factory.createStringLiteral(
					originalExpression.text,
				);
			} else if (ts.isNumericLiteral(originalExpression)) {
				replacement = ts.factory.createNumericLiteral(
					originalExpression.text,
				);
			} else if (
				originalExpression.kind === ts.SyntaxKind.TrueKeyword ||
				originalExpression.kind === ts.SyntaxKind.FalseKeyword
			) {
				replacement =
					originalExpression.kind === ts.SyntaxKind.TrueKeyword
						? ts.factory.createTrue()
						: ts.factory.createFalse();
			} else if (ts.isTemplateExpression(originalExpression)) {
				replacement = ts.factory.createTemplateExpression(
					originalExpression.head,
					originalExpression.templateSpans.map((span) =>
						ts.factory.createTemplateSpan(
							ts.visitNode(
								span.expression,
								(node) => this.visitNode(node, scope).node,
							) as Expression,
							span.literal,
						),
					),
				);
			} else {
				// For more complex expressions, visit the node to create a fresh copy
				replacement = ts.visitNode(
					originalExpression,
					(node) => this.visitNode(node, scope).node,
				) as Expression;
			}

			// Wrap in parentheses to maintain operator precedence
			return {
				node: ts.factory.createParenthesizedExpression(replacement),

				modified: true,
			};
		} catch (error) {
			console.error(`Failed to inline ${name}:`, error);

			this.state.errors.push({
				code: ErrorCode.INVALID_REPLACEMENT,

				message: `Failed to create replacement for ${name}`,

				node,

				stack:
					error instanceof Error
						? (error.stack ?? "undefined")
						: "undefined",
			});

			return { node, modified: false };
		}
	}

	handleFunctionCall(
		node: CallExpression,

		_scope: ScopeInfo,
	): VisitResult<Expression> {
		if (ts.isIdentifier(node.expression)) {
			const name = node.expression.text;

			this.tracker.incrementFunctionUses(name);
		}

		return { node, modified: false };
	}

	processFunctionDeclaration(
		node: FunctionDeclaration,

		_scope: ScopeInfo,
	): VisitResult<Statement> {
		if (node.name) {
			const name = node.name.text;

			this.tracker.trackFunction(name, node);

			// Only consider removing the function if it's used exactly once
			if (this.tracker.getFunctionUses(name) === 1) {
				return {
					node: ts.factory.createEmptyStatement(),

					modified: true,
				};
			}
		}

		return { node, modified: false };
	}

	processVariableStatement(
		node: VariableStatement,

		_scope: ScopeInfo,
	): VisitResult<Statement> {
		// Just handle the declarations without tracking
		const declarations = node.declarationList.declarations.map((decl) => {
			if (ts.isIdentifier(decl.name)) {
				const name = decl.name.text;

				console.log(
					`------------------------------${"-".repeat(name.length)}`,
				);

				console.log(`P: Processing declaration for ${name}`);
			}

			return decl;
		});

		// Filter out declarations that should be removed
		const remainingDeclarations = declarations.filter((decl) => {
			if (!ts.isIdentifier(decl.name)) {
				return true;
			}

			const name = decl.name.text;

			const shouldInline = this.tracker.shouldInlineVariable(name);

			console.log(`S: Should inline ${name}? ${shouldInline}`);

			// Only keep declarations that shouldn't be inlined
			return !shouldInline;
		});

		if (remainingDeclarations.length === 0) {
			return {
				node: ts.factory.createEmptyStatement(),

				modified: true,
			};
		}

		if (remainingDeclarations.length !== declarations.length) {
			return {
				node: ts.factory.updateVariableStatement(
					node,

					node.modifiers,

					ts.factory.createVariableDeclarationList(
						remainingDeclarations,

						node.declarationList.flags,
					),
				),

				modified: true,
			};
		}

		return { node, modified: false };
	}

	visitNode(
		node: Node,

		scope: ScopeInfo = this.state.currentScope!,
	): VisitResult {
		let modified = false;

		let resultNode = ts.visitEachChild(
			node,

			(child) => {
				const result = this.visitNode(child, scope);

				modified = modified || result.modified;

				return result.node;
			},

			this.state.context,
		);

		// Create new scope for blocks
		if (ts.isBlock(node)) {
			const newScope: ScopeInfo = {
				variables: new Set(),

				parent: scope,
			};

			return {
				node: resultNode,

				modified,

				scope: newScope,
			};
		}

		// Handle declarations after children have been visited
		if (ts.isVariableStatement(node)) {
			const nodeResult = this.processVariableStatement(node, scope);

			return {
				node: nodeResult.node,
				modified: modified || nodeResult.modified,
				scope: nodeResult.scope ?? scope,
			};
		}

		let nodeResult: VisitResult;

		// Handle different node types
		if (ts.isIdentifier(node)) {
			nodeResult = this.handleIdentifier(node, scope);
		} else if (ts.isVariableStatement(node)) {
			nodeResult = this.processVariableStatement(node, scope);
		} else if (ts.isFunctionDeclaration(node)) {
			nodeResult = this.processFunctionDeclaration(node, scope);
		} else if (ts.isCallExpression(node)) {
			nodeResult = this.handleFunctionCall(node, scope);
		} else {
			return { node: resultNode, modified };
		}

		// Visit children
		return {
			node: nodeResult.node,

			modified: modified || nodeResult.modified,

			scope: nodeResult.scope ?? scope,
		};
	}

	collectUsages(
		node: Node,
		scope: ScopeInfo = this.state.currentScope!,
	): void {
		// Track declarations
		if (ts.isVariableStatement(node)) {
			node.declarationList.declarations.forEach((decl) => {
				if (ts.isIdentifier(decl.name)) {
					const name = decl.name.text;

					this.tracker.trackUse(name, decl.name, scope, false);

					if (decl.initializer) {
						this.tracker.trackDeclaration(
							name,
							decl.initializer,
							scope,
						);
					}
				}
			});
		}

		// Track uses
		if (
			ts.isIdentifier(node) &&
			!ts.isPropertyAccessExpression(node.parent)
		) {
			this.tracker.trackUse(node.text, node, scope, true);
		}

		// Visit children
		ts.forEachChild(node, (child) => this.collectUsages(child, scope));
	}

	transform(sourceFile: Node, passCount: number = 0): Node {
		const MAX_PASSES = 10; // Adjust this number as needed

		if (passCount >= MAX_PASSES) {
			return sourceFile;
		}

		this.tracker.clear();

		// First pass: collect both declarations and uses bottom-up
		this.collectUsages(sourceFile);

		// Second pass: perform inlining now that we have accurate usage information
		let result = ts.visitNode(
			sourceFile,
			(node) => this.visitNode(node).node,
		);

		// Check if any modifications were made by comparing the result with the input
		const modified = result !== sourceFile;

		if (modified) {
			// Recursively transform until no more changes
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
