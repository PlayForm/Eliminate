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

	sideEffects = new Set<string>();

	trackFunction(
		name: string,

		node: FunctionDeclaration | ArrowFunction | FunctionExpression,
	): void {
		this.functions.set(name, { node, uses: 0 });
	}

	incrementFunctionUses(name: string): void {
		const func = this.functions.get(name);

		if (func) {
			func.uses++;
		}
	}

	getFunctionInfo(name: string): FunctionInfo | undefined {
		return this.functions.get(name);
	}

	getDeclaration(name: string): { node: Node; scope: ScopeInfo } | undefined {
		return this.declarations.get(name);
	}

	getFunctionUses(name: string): number {
		return this.functions.get(name)?.uses ?? 0;
	}

	isOnlyUsedOnce(name: string): boolean {
		const uses = this.uses.get(name);

		if (!uses) return false;

		// Count only reference uses
		const referenceUses = Array.from(uses).filter((use) => use.isReference);

		return referenceUses.length === 1;
	}

	shouldInlineVariable(name: string): boolean {
		const decl = this.declarations.get(name);

		const uses = this.uses.get(name);

		console.log(`C: Checking inlining for ${name}:`);

		console.log(`- Has declaration: ${!!decl}`);

		console.log(`- Has uses: ${!!uses}`);

		if (!decl || !uses) return false;

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

	isSimpleExpression(node: Expression): boolean {
		return (
			ts.isIdentifier(node) ||
			ts.isLiteralExpression(node) ||
			ts.isObjectLiteralExpression(node) ||
			ts.isArrayLiteralExpression(node)
		);
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

		this.sideEffects.clear();

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

		console.log(`H: Handling identifier ${name}`);

		// Track the use of this identifier
		this.tracker.trackUse(name, node, scope, true);

		if (!decl || !this.tracker.shouldInlineVariable(name)) {
			console.log(`N: Not inlining ${name}`);

			return { node, modified: false };
		}

		console.log(`I: Inlining ${name}`);

		try {
			/////////////////
			//  // Create deep copy of the initializer expression
			//  const clone = ts.factory.createIdentifier(name);

			//  const replacement = ts.getMutableClone(decl.node as Expression);

			//  // Important: Apply any needed transformations to the replacement
			//  const transformed = ts.visitNode(
			// 	 replacement,
			// 	 (node) => this.visitNode(node, scope).node
			//  ) as Expression;

			//  return {
			// 	 node: ts.factory.createParenthesizedExpression(transformed),
			// 	 modified: true,
			//  };

			/////////////////

			return {
				node: ts.factory.createParenthesizedExpression(
					ts.visitNode(
						decl.node,

						(node) => node,
					) as Expression,
				),

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

		scope: ScopeInfo,
	): VisitResult<Statement> {
		// First, visit the declarations to track them
		const declarations = node.declarationList.declarations.map((decl) => {
			if (ts.isIdentifier(decl.name)) {
				const name = decl.name.text;

				console.log(`P: Processing declaration for ${name}`);

				// Track the declaration itself as a non-reference use
				this.tracker.trackUse(name, decl.name, scope, false);

				if (decl.initializer) {
					// Store the initializer in declarations map
					this.tracker.trackDeclaration(
						name,

						// Store the initializer expression
						decl.initializer,

						scope,
					);

					console.log(`T: Tracked initializer for ${name}`);
				}
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
		// First track any identifier uses before visiting children
		if (
			ts.isIdentifier(node) &&
			!ts.isPropertyAccessExpression(node.parent)
		) {
			const name = node.text;

			console.log(
				`--------------------------------------------${"-".repeat(name.length)}`,
			);

			console.log(`T: Tracking use of identifier ${name} in first pass`);

			this.tracker.trackUse(name, node, scope, true);
		}

		// Then visit children bottom-up
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

	replaceIdentifiers(node: Node): VisitResult {
		// Handle identifiers first before visiting children
		if (ts.isIdentifier(node)) {
			return this.handleIdentifier(node, this.state.currentScope!);
		}

		// Then visit children
		return {
			node: ts.visitEachChild(
				node,

				(child) => this.replaceIdentifiers(child).node,

				this.state.context,
			),

			modified: false,
		};
	}

	cleanupDeclarations(node: Node): VisitResult {
		// Handle variable declarations
		if (ts.isVariableStatement(node)) {
			return this.processVariableStatement(
				node,

				this.state.currentScope!,
			);
		}

		// Visit children
		return {
			node: ts.visitEachChild(
				node,

				(child) => this.cleanupDeclarations(child).node,

				this.state.context,
			),

			modified: false,
		};
	}

	transform(sourceFile: Node) {
		this.tracker.clear();

		console.log("S: Starting transformation");

		// First pass: collect both declarations and uses bottom-up
		let result = ts.visitNode(
			sourceFile,
			(node) => this.visitNode(node).node,
		);

		console.log("A: After first pass - Usage counts:");

		this.tracker.uses.forEach((uses, name) =>
			console.log(
				`${name}: ${
					Array.from(uses).filter((u) => u.isReference).length
				} reference uses`,
			),
		);

		// Second pass: perform inlining now that we have accurate usage information
		result = ts.visitNode(result, (node) => {
			if (ts.isIdentifier(node)) {
				// Now we have complete usage information for better inlining decisions
				return this.handleIdentifier(
					node,

					this.state.currentScope!,
				).node;
			}

			return ts.visitEachChild(
				node,

				(child) => ts.visitNode(child, (node) => node),

				this.state.context,
			);
		});

		// Third pass: clean up unused declarations
		result = ts.visitNode(result, (node) => {
			if (ts.isVariableStatement(node)) {
				return this.processVariableStatement(
					node,

					this.state.currentScope!,
				).node;
			}

			return ts.visitEachChild(
				node,

				(child) => ts.visitNode(child, (node) => node),

				this.state.context,
			);
		});

		console.log("C: Completed transformation");

		return result;
	}
}

export const Fn = ((_Usage, _Initializer) =>
	(context: TransformationContext) =>
	(rootNode) =>
		new Transformer(context).transform(
			rootNode,
		)) satisfies Interface as Interface;

export const {
	default: ts,

	isIdentifier,

	factory,
} = await import("typescript");

export default Fn;
