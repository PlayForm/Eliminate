import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	ArrowFunction,
	// Block,
	CallExpression,
	Expression,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	Node,
	// ParameterDeclaration,
	// Program,
	SourceFile,
	Statement,
	TransformationContext,
	// TypeChecker,
	VariableStatement,
} from "typescript";

/**
 * @module Output
 * Enhanced transformer with comprehensive validation, error handling,
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

	// scope: ScopeInfo;

	// complexity: number;

	// parameters: ParameterDeclaration[];

	// usageCount: number;

	// isAsync: boolean;

	// isGenerator: boolean;

	// capturedVariables: Set<string>;
}

interface TransformerState {
	// readonly visitCount: number;

	// readonly iterationCount: number;

	readonly context: TransformationContext;

	readonly errors: Array<TransformError>;

	readonly warnings: Array<TransformWarning>;

	readonly processedNodes: Set<string>;

	readonly dependencyGraph: Map<string, Set<string>>;

	readonly sourceFiles: Map<string, SourceFile>;

	readonly currentScope?: ScopeInfo;
}

interface TransformError {
	readonly code: ErrorCode;

	readonly message: string;

	readonly node: Node;

	readonly fileName?: string;

	readonly stack?: string;

	readonly details?: Record<string, unknown>;
}

interface TransformWarning {
	readonly code: WarningCode;

	readonly message: string;

	readonly node: Node;

	readonly fileName?: string;

	readonly details?: Record<string, unknown>;
}

enum ErrorCode {
	INVALID_REPLACEMENT = "INVALID_REPLACEMENT",
	TRANSFORMATION_ERROR = "TRANSFORMATION_ERROR",
}

enum WarningCode {
	PERFORMANCE_IMPACT = "PERFORMANCE_IMPACT",
	POSSIBLE_SIDE_EFFECT = "POSSIBLE_SIDE_EFFECT",
}

const CONFIG = {
	MAX_ITERATIONS: 100,
	TYPE_CHECK_TIMEOUT: 5000,
	MAX_SCOPE_DEPTH: 10,
	PERFORMANCE_WARNING_THRESHOLD: 1000,
} as const;

class DeclarationTracker {
	private declarations = new Map<
		string,
		{
			node: Node;

			scope: ScopeInfo;

			complexity: number;
		}
	>();

	private uses = new Map<
		string,
		Set<{
			node: Node;

			scope: ScopeInfo;

			isReference: boolean;
		}>
	>();

	private functions = new Map<string, FunctionInfo>();

	private sideEffects = new Set<string>();

	// trackFunctionDeclaration(
	// 	name: string,
	// 	node: FunctionDeclaration | ArrowFunction | FunctionExpression,
	// 	scope: ScopeInfo,
	// ): void {
	// 	const complexity = this.calculateComplexity(node);

	// 	const capturedVariables = this.analyzeCapturedVariables(node);

	// 	this.functions.set(name, {
	// 		node,
	// 		scope,
	// 		complexity,
	// 		parameters: Array.from(node.parameters),
	// 		usageCount: 0,
	// 		isAsync:
	// 			node.modifiers?.some(
	// 				(m) => m.kind === ts.SyntaxKind.AsyncKeyword,
	// 			) ?? false,
	// 		isGenerator: node.asteriskToken !== undefined,
	// 		capturedVariables,
	// 	});
	// }

	// private analyzeCapturedVariables(node: Node): Set<string> {
	// 	const captured = new Set<string>();

	// 	const localDeclarations = new Set<string>();

	// 	// First pass: collect local declarations
	// 	ts.forEachChild(node, (child) => {
	// 		if (
	// 			ts.isVariableDeclaration(child) &&
	// 			ts.isIdentifier(child.name)
	// 		) {
	// 			localDeclarations.add(child.name.text);
	// 		}

	// 		if (ts.isParameter(child) && ts.isIdentifier(child.name)) {
	// 			localDeclarations.add(child.name.text);
	// 		}
	// 	});

	// 	// Second pass: find captured variables
	// 	const visitor = (node: Node): void => {
	// 		if (ts.isIdentifier(node)) {
	// 			const name = node.text;

	// 			if (!localDeclarations.has(name)) {
	// 				captured.add(name);
	// 			}
	// 		}

	// 		ts.forEachChild(node, visitor);
	// 	};

	// 	visitor(node);

	// 	return captured;
	// }

	// trackFunctionCall(
	// 	name: string,
	// 	node: CallExpression,
	// 	scope: ScopeInfo,
	// ): void {
	// 	const functionInfo = this.functions.get(name);

	// 	if (functionInfo) {
	// 		functionInfo.usageCount++;
	// 	}

	// 	this.trackUse(name, node, scope);
	// }

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

	// canInlineFunction(name: string): boolean {
	// 	const info = this.functions.get(name);

	// 	if (!info) return false;

	// 	return (
	// 		info.usageCount === 1 && // Used exactly once
	// 		!info.isAsync && // Not async
	// 		!info.isGenerator && // Not a generator
	// 		info.capturedVariables.size === 0 && // No captured variables
	// 		!this.hasSideEffects(name) && // No side effects
	// 		info.complexity < CONFIG.PERFORMANCE_WARNING_THRESHOLD // Not too complex
	// 	);
	// }

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

		if (!decl || !uses) return false;

		// Don't inline if there are no references
		if (!this.isOnlyUsedOnce(name)) return false;

		// Check if the variable is actually used
		const hasReferences = Array.from(uses).some((use) => use.isReference);

		if (!hasReferences) return false;

		// Only inline if the declaration is a simple expression
		const node = decl.node;

		return (
			ts.isIdentifier(node) ||
			ts.isLiteralExpression(node) ||
			ts.isObjectLiteralExpression(node) ||
			ts.isArrayLiteralExpression(node)
		);
	}

	shouldRemoveDeclaration(name: string): boolean {
		const uses = this.uses.get(name);

		return !uses || uses.size === 0;
	}

	trackDeclaration(name: string, node: Node, scope: ScopeInfo): void {
		const complexity = this.calculateComplexity(node);

		this.declarations.set(name, { node, scope, complexity });

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

	private calculateComplexity(node: Node): number {
		let complexity = 1;

		ts.forEachChild(node, (child) => {
			complexity += this.calculateComplexity(child);
		});

		return complexity;
	}

	isUnused(name: string): boolean {
		return !this.uses.has(name) || this.uses.get(name)!.size === 0;
	}

	hasSideEffects(name: string): boolean {
		return this.sideEffects.has(name);
	}

	markSideEffects(name: string): void {
		this.sideEffects.add(name);
	}

	getDeclarationComplexity(name: string): number {
		return this.declarations.get(name)?.complexity ?? 0;
	}

	isInScope(name: string, currentScope: ScopeInfo): boolean {
		const declaration = this.declarations.get(name);

		if (!declaration) return false;

		let scope: ScopeInfo | undefined = currentScope;

		while (scope) {
			if (scope === declaration.scope) return true;

			scope = scope.parent;
		}

		return false;
	}

	clear(): void {
		this.declarations.clear();

		this.uses.clear();

		this.sideEffects.clear();

		this.functions.clear();
	}
}

export const Fn = ((_Usage, _Initializer) => {
	class Transformer {
		private readonly state: TransformerState;

		private readonly tracker: DeclarationTracker;

		constructor(context: TransformationContext) {
			this.state = {
				context,
				errors: [],
				warnings: [],
				processedNodes: new Set(),
				dependencyGraph: new Map(),
				sourceFiles: new Map(),
				currentScope: { variables: new Set() },
			};

			this.tracker = new DeclarationTracker();
		}

		private handleIdentifier(
			node: Identifier,
			scope: ScopeInfo,
		): VisitResult<Expression> {
			const name = node.text;

			const decl = this.tracker.getDeclaration(name);

			// Track the use of this identifier
			this.tracker.trackUse(name, node, scope, true);

			if (!decl || !this.tracker.shouldInlineVariable(name)) {
				return { node, modified: false };
			}

			try {
				const replacement = ts.visitNode(
					decl.node,
					(node) => node,
				) as Expression;

				return {
					node: ts.factory.createParenthesizedExpression(replacement),
					modified: true,
				};
			} catch (error) {
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

		// private createFunctionReplacement(
		// 	call: CallExpression,
		// 	funcInfo: FunctionInfo,
		// 	_scope: ScopeInfo,
		// ): Expression {
		// 	const args = call.arguments;

		// 	const params = funcInfo.parameters;

		// 	// Create a map of parameter names to their argument expressions
		// 	const paramMap = new Map<string, Expression>();

		// 	params.forEach((param, index) => {
		// 		if (ts.isIdentifier(param.name)) {
		// 			const arg =
		// 				args[index] ??
		// 				(param.initializer
		// 					? (ts.visitNode(
		// 							param.initializer,
		// 							(node) => node,
		// 						) as Expression)
		// 					: ts.factory.createIdentifier("undefined"));

		// 			paramMap.set(param.name.text, arg);
		// 		}
		// 	});

		// 	// Clone the function body and replace parameter references
		// 	const visitor = (node: Node): Node => {
		// 		if (ts.isIdentifier(node)) {
		// 			const replacement = paramMap.get(node.text);

		// 			if (replacement) {
		// 				return ts.factory.createParenthesizedExpression(
		// 					ts.visitNode(replacement, visitor) as Expression,
		// 				);
		// 			}
		// 		}

		// 		return ts.visitEachChild(node, visitor, this.state.context);
		// 	};

		// 	// Get the function body
		// 	let body: Expression;

		// 	if (
		// 		ts.isFunctionDeclaration(funcInfo.node) ||
		// 		ts.isFunctionExpression(funcInfo.node)
		// 	) {
		// 		const statements = (funcInfo.node.body as Block).statements;

		// 		if (
		// 			statements.length === 1 &&
		// 			typeof statements[0] !== "undefined" &&
		// 			ts.isReturnStatement(statements[0])
		// 		) {
		// 			body = statements[0].expression as Expression;
		// 		} else {
		// 			body = ts.factory.createArrowFunction(
		// 				undefined,
		// 				undefined,
		// 				[],
		// 				undefined,
		// 				undefined,
		// 				ts.factory.createBlock(statements, true),
		// 			);
		// 		}
		// 	} else {
		// 		// ArrowFunction
		// 		body = funcInfo.node.body as Expression;
		// 	}

		// 	// Visit the body with our parameter replacement visitor
		// 	const replacedBody = ts.visitNode(body, visitor) as Expression;

		// 	// Wrap in parentheses to maintain operator precedence
		// 	return ts.factory.createParenthesizedExpression(replacedBody);
		// }

		private handleFunctionCall(
			node: CallExpression,
			_scope: ScopeInfo,
		): VisitResult<Expression> {
			if (ts.isIdentifier(node.expression)) {
				const name = node.expression.text;

				this.tracker.incrementFunctionUses(name);
			}

			return { node, modified: false };
		}

		private processFunctionDeclaration(
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

		// private createScope(parent: ScopeInfo): ScopeInfo {
		// 	return {
		// 		variables: new Set(),
		// 		parent,
		// 	};
		// }

		// private detectSideEffects(node: Node): boolean {
		// 	let hasSideEffects = false;

		// 	const visitor = (node: Node): void => {
		// 		if (
		// 			ts.isCallExpression(node) ||
		// 			ts.isNewExpression(node) ||
		// 			ts.isPropertyAccessExpression(node) ||
		// 			ts.isElementAccessExpression(node)
		// 		) {
		// 			hasSideEffects = true;

		// 			return;
		// 		}

		// 		ts.forEachChild(node, visitor);
		// 	};

		// 	visitor(node);

		// 	return hasSideEffects;
		// }

		// private handleVariableReplacement(
		// 	node: Identifier,
		// 	scope: ScopeInfo,
		// ): VisitResult<Expression> {
		// 	const name = node.text;

		// 	if (!this.tracker.isInScope(name, scope)) {
		// 		return { node, modified: false, scope };
		// 	}

		// 	try {
		// 		const complexity = this.tracker.getDeclarationComplexity(name);

		// 		if (complexity > CONFIG.PERFORMANCE_WARNING_THRESHOLD) {
		// 			this.state.warnings.push({
		// 				code: WarningCode.PERFORMANCE_IMPACT,
		// 				message: `Inlining variable ${name} may impact performance due to high complexity`,
		// 				node,
		// 				details: { complexity },
		// 			});
		// 		}

		// 		// Check for side effects
		// 		if (this.detectSideEffects(node)) {
		// 			this.tracker.markSideEffects(name);

		// 			this.state.warnings.push({
		// 				code: WarningCode.POSSIBLE_SIDE_EFFECT,
		// 				message: `Variable ${name} may have side effects`,
		// 				node,
		// 			});
		// 		}

		// 		// Create replacement with proper parentheses
		// 		const replacement = ts.factory.createParenthesizedExpression(
		// 			ts.factory.createIdentifier(name) as Expression,
		// 		);

		// 		return {
		// 			node: replacement,
		// 			modified: true,
		// 			dependencies: new Set([name]),
		// 			scope,
		// 		};
		// 	} catch (error) {
		// 		const errorMessage =
		// 			error instanceof Error ? error.message : String(error);

		// 		this.state.errors.push({
		// 			code: ErrorCode.TRANSFORMATION_ERROR,
		// 			message: `Error replacing variable ${name}: ${errorMessage}`,
		// 			node,
		// 			stack:
		// 				error instanceof Error
		// 					? (error.stack ?? errorMessage)
		// 					: "undefined",
		// 		});

		// 		return { node, modified: false, scope };
		// 	}
		// }

		private processVariableStatement(
			node: VariableStatement,
			scope: ScopeInfo,
		): VisitResult<Statement> {
			// First, visit the declarations to track them
			const declarations = node.declarationList.declarations.map(
				(decl) => {
					if (ts.isIdentifier(decl.name)) {
						const name = decl.name.text;

						if (decl.initializer) {
							this.tracker.trackDeclaration(
								name,
								decl.initializer,
								scope,
							);
						}
					}

					return decl;
				},
			);

			// Filter out declarations that should be removed
			const remainingDeclarations = declarations.filter((decl) => {
				if (!ts.isIdentifier(decl.name)) return true;

				return !this.tracker.shouldRemoveDeclaration(decl.name.text);
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

		public visitNode(
			node: Node,
			scope: ScopeInfo = this.state.currentScope!,
		): VisitResult {
			// Create new scope for blocks
			if (ts.isBlock(node)) {
				const newScope: ScopeInfo = {
					variables: new Set(),
					parent: scope,
				};

				return {
					node: ts.visitEachChild(
						node,
						(child) => this.visitNode(child, newScope).node,
						this.state.context,
					),
					modified: false,
					scope: newScope,
				};
			}

			// Handle different node types
			if (ts.isIdentifier(node)) {
				return this.handleIdentifier(node, scope);
			}

			if (ts.isVariableStatement(node)) {
				return this.processVariableStatement(node, scope);
			}

			if (ts.isFunctionDeclaration(node)) {
				return this.processFunctionDeclaration(node, scope);
			}

			if (ts.isCallExpression(node)) {
				return this.handleFunctionCall(node, scope);
			}

			// Visit children
			return {
				node: ts.visitEachChild(
					node,
					(child) => this.visitNode(child, scope).node,
					this.state.context,
				),
				modified: false,
				scope,
			};
		}

		public transform(sourceFile: Node) {
			this.tracker.clear();

			// First pass: collect declarations and uses
			let result = ts.visitNode(
				sourceFile,
				(node) => this.visitNode(node).node,
			);

			// Second pass: perform transformations
			let modified = true;

			let iteration = 0;

			while (modified && iteration < CONFIG.MAX_ITERATIONS) {
				const visitResult = this.visitNode(result);

				modified = visitResult.modified;

				if (modified) {
					result = visitResult.node as SourceFile;
				}

				iteration++;
			}

			return result;
		}
	}

	return (context: TransformationContext) => (rootNode) => {
		const transformer = new Transformer(context);

		return transformer.transform(rootNode);
	};
}) satisfies Interface as Interface;

export const {
	default: ts,
	isIdentifier,
	factory,
} = await import("typescript");

export default Fn;
