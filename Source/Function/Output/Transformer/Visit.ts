import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	ArrowFunction,
	Block,
	CallExpression,
	Expression,
	FunctionDeclaration,
	FunctionExpression,
	Identifier,
	Node,
	ParameterDeclaration,
	SourceFile,
	Statement,
	TransformationContext,
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
	scope: ScopeInfo;
	complexity: number;
	parameters: ParameterDeclaration[];
	usageCount: number;
	isAsync: boolean;
	isGenerator: boolean;
	capturedVariables: Set<string>;
}

interface TransformerState {
	readonly visitCount: number;

	readonly iterationCount: number;

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
	CIRCULAR_REFERENCE = "CIRCULAR_REFERENCE",
	UNINITIALIZED_VARIABLE = "UNINITIALIZED_VARIABLE",
	INVALID_REPLACEMENT = "INVALID_REPLACEMENT",
	SCOPE_ERROR = "SCOPE_ERROR",
	TRANSFORMATION_ERROR = "TRANSFORMATION_ERROR",
}

enum WarningCode {
	MULTIPLE_DECLARATIONS = "MULTIPLE_DECLARATIONS",
	UNSAFE_REPLACEMENT = "UNSAFE_REPLACEMENT",
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

	private functions = new Map<string, FunctionInfo>();

	private uses = new Map<
		string,
		Set<{
			node: Node;

			scope: ScopeInfo;
		}>
	>();

	private sideEffects = new Set<string>();

	trackFunctionDeclaration(
		name: string,
		node: FunctionDeclaration | ArrowFunction | FunctionExpression,
		scope: ScopeInfo,
	): void {
		const complexity = this.calculateComplexity(node);

		const capturedVariables = this.analyzeCapturedVariables(node);

		this.functions.set(name, {
			node,
			scope,
			complexity,
			parameters: Array.from(node.parameters),
			usageCount: 0,
			isAsync:
				node.modifiers?.some(
					(m) => m.kind === ts.SyntaxKind.AsyncKeyword,
				) ?? false,
			isGenerator: node.asteriskToken !== undefined,
			capturedVariables,
		});
	}

	private analyzeCapturedVariables(node: Node): Set<string> {
		const captured = new Set<string>();

		const localDeclarations = new Set<string>();

		// First pass: collect local declarations
		ts.forEachChild(node, (child) => {
			if (
				ts.isVariableDeclaration(child) &&
				ts.isIdentifier(child.name)
			) {
				localDeclarations.add(child.name.text);
			}

			if (ts.isParameter(child) && ts.isIdentifier(child.name)) {
				localDeclarations.add(child.name.text);
			}
		});

		// Second pass: find captured variables
		const visitor = (node: Node): void => {
			if (ts.isIdentifier(node)) {
				const name = node.text;

				if (!localDeclarations.has(name)) {
					captured.add(name);
				}
			}

			ts.forEachChild(node, visitor);
		};

		visitor(node);

		return captured;
	}

	trackFunctionCall(
		name: string,
		node: CallExpression,
		scope: ScopeInfo,
	): void {
		const functionInfo = this.functions.get(name);

		if (functionInfo) {
			functionInfo.usageCount++;
		}

		this.trackUse(name, node, scope);
	}

	canInlineFunction(name: string): boolean {
		const info = this.functions.get(name);

		if (!info) return false;

		return (
			info.usageCount === 1 && // Used exactly once
			!info.isAsync && // Not async
			!info.isGenerator && // Not a generator
			info.capturedVariables.size === 0 && // No captured variables
			!this.hasSideEffects(name) && // No side effects
			info.complexity < CONFIG.PERFORMANCE_WARNING_THRESHOLD // Not too complex
		);
	}

	getFunctionInfo(name: string): FunctionInfo | undefined {
		return this.functions.get(name);
	}

	trackDeclaration(name: string, node: Node, scope: ScopeInfo): void {
		const complexity = this.calculateComplexity(node);

		this.declarations.set(name, { node, scope, complexity });
	}

	trackUse(name: string, node: Node, scope: ScopeInfo): void {
		if (!this.uses.has(name)) {
			this.uses.set(name, new Set());
		}

		this.uses.get(name)!.add({ node, scope });
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
	}
}

export const Fn = ((_Usage, _Initializer) => {
	class Transformer {
		private readonly state: TransformerState;

		private readonly tracker: DeclarationTracker;

		constructor(context: TransformationContext) {
			this.state = {
				visitCount: 0,
				iterationCount: 0,
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

		private createFunctionReplacement(
			call: CallExpression,
			funcInfo: FunctionInfo,
			_scope: ScopeInfo,
		): Expression {
			const args = call.arguments;

			const params = funcInfo.parameters;

			// Create a map of parameter names to their argument expressions
			const paramMap = new Map<string, Expression>();

			params.forEach((param, index) => {
				if (ts.isIdentifier(param.name)) {
					const arg =
						args[index] ??
						(param.initializer
							? (ts.visitNode(
									param.initializer,
									(node) => node,
								) as Expression)
							: ts.factory.createIdentifier("undefined"));

					paramMap.set(param.name.text, arg);
				}
			});

			// Clone the function body and replace parameter references
			const visitor = (node: Node): Node => {
				if (ts.isIdentifier(node)) {
					const replacement = paramMap.get(node.text);

					if (replacement) {
						return ts.factory.createParenthesizedExpression(
							ts.visitNode(replacement, visitor) as Expression,
						);
					}
				}

				return ts.visitEachChild(node, visitor, this.state.context);
			};

			// Get the function body
			let body: Expression;

			if (
				ts.isFunctionDeclaration(funcInfo.node) ||
				ts.isFunctionExpression(funcInfo.node)
			) {
				const statements = (funcInfo.node.body as Block).statements;

				if (
					statements.length === 1 &&
					typeof statements[0] !== "undefined" &&
					ts.isReturnStatement(statements[0])
				) {
					body = statements[0].expression as Expression;
				} else {
					body = ts.factory.createArrowFunction(
						undefined,
						undefined,
						[],
						undefined,
						undefined,
						ts.factory.createBlock(statements, true),
					);
				}
			} else {
				// ArrowFunction
				body = funcInfo.node.body as Expression;
			}

			// Visit the body with our parameter replacement visitor
			const replacedBody = ts.visitNode(body, visitor) as Expression;

			// Wrap in parentheses to maintain operator precedence
			return ts.factory.createParenthesizedExpression(replacedBody);
		}

		private handleFunctionCall(
			node: CallExpression,
			scope: ScopeInfo,
		): VisitResult<Expression> {
			if (!ts.isIdentifier(node.expression)) {
				return { node, modified: false, scope };
			}

			const name = node.expression.text;

			if (!this.tracker.canInlineFunction(name)) {
				return { node, modified: false, scope };
			}

			const funcInfo = this.tracker.getFunctionInfo(name);

			if (!funcInfo) {
				return { node, modified: false, scope };
			}

			try {
				const replacement = this.createFunctionReplacement(
					node,
					funcInfo,
					scope,
				);

				return {
					node: replacement,
					modified: true,
					dependencies: new Set([name]),
					scope,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				this.state.errors.push({
					code: ErrorCode.TRANSFORMATION_ERROR,
					message: `Error inlining function ${name}: ${errorMessage}`,
					node,
					stack:
						error instanceof Error
							? (error.stack ?? "undefined")
							: "undefined",
				});

				return { node, modified: false, scope };
			}
		}

		private processFunctionDeclaration(
			node: FunctionDeclaration,
			scope: ScopeInfo,
		): VisitResult<Statement> {
			if (node.name) {
				const name = node.name.text;

				this.tracker.trackFunctionDeclaration(name, node, scope);

				// Don't remove the function yet - we'll do it in a subsequent pass
				// after we know if it's used exactly once
				return { node, modified: false, scope };
			}

			return { node, modified: false, scope };
		}

		private createScope(parent: ScopeInfo): ScopeInfo {
			return {
				variables: new Set(),
				parent,
			};
		}

		private detectSideEffects(node: Node): boolean {
			let hasSideEffects = false;

			const visitor = (node: Node): void => {
				if (
					ts.isCallExpression(node) ||
					ts.isNewExpression(node) ||
					ts.isPropertyAccessExpression(node) ||
					ts.isElementAccessExpression(node)
				) {
					hasSideEffects = true;

					return;
				}

				ts.forEachChild(node, visitor);
			};

			visitor(node);

			return hasSideEffects;
		}

		private handleVariableReplacement(
			node: Identifier,
			scope: ScopeInfo,
		): VisitResult<Expression> {
			const name = node.text;

			if (!this.tracker.isInScope(name, scope)) {
				return { node, modified: false, scope };
			}

			try {
				const complexity = this.tracker.getDeclarationComplexity(name);

				if (complexity > CONFIG.PERFORMANCE_WARNING_THRESHOLD) {
					this.state.warnings.push({
						code: WarningCode.PERFORMANCE_IMPACT,
						message: `Inlining variable ${name} may impact performance due to high complexity`,
						node,
						details: { complexity },
					});
				}

				// Check for side effects
				if (this.detectSideEffects(node)) {
					this.tracker.markSideEffects(name);

					this.state.warnings.push({
						code: WarningCode.POSSIBLE_SIDE_EFFECT,
						message: `Variable ${name} may have side effects`,
						node,
					});
				}

				// Create replacement with proper parentheses
				const replacement = ts.factory.createParenthesizedExpression(
					ts.factory.createIdentifier(name) as Expression,
				);

				return {
					node: replacement,
					modified: true,
					dependencies: new Set([name]),
					scope,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				this.state.errors.push({
					code: ErrorCode.TRANSFORMATION_ERROR,
					message: `Error replacing variable ${name}: ${errorMessage}`,
					node,
					stack:
						error instanceof Error
							? (error.stack ?? errorMessage)
							: "undefined",
				});

				return { node, modified: false, scope };
			}
		}

		private processVariableStatement(
			node: VariableStatement,
			scope: ScopeInfo,
		): VisitResult<Statement> {
			const newScope = this.createScope(scope);

			const declarations = node.declarationList.declarations.filter(
				(decl) => {
					if (!ts.isIdentifier(decl.name)) return true;

					const name = decl.name.text;

					if (this.tracker.isUnused(name) && decl.initializer) {
						if (!this.tracker.hasSideEffects(name)) {
							this.tracker.trackDeclaration(
								name,
								decl.initializer,
								newScope,
							);

							newScope.variables.add(name);

							return false;
						}
					}

					return true;
				},
			);

			if (declarations.length === 0) {
				return {
					node: ts.factory.createEmptyStatement(),
					modified: true,
					scope: newScope,
				};
			}

			if (
				declarations.length !== node.declarationList.declarations.length
			) {
				return {
					node: ts.factory.updateVariableStatement(
						node,
						node.modifiers,
						ts.factory.createVariableDeclarationList(
							declarations,
							node.declarationList.flags,
						),
					),
					modified: true,
					scope: newScope,
				};
			}

			return { node, modified: false, scope: newScope };
		}

		public visitNode(
			node: Node,
			scope: ScopeInfo = this.state.currentScope!,
		): VisitResult {
			if (ts.isCallExpression(node)) {
				return this.handleFunctionCall(node, scope);
			}

			if (ts.isFunctionDeclaration(node)) {
				return this.processFunctionDeclaration(node, scope);
			}

			if (ts.isBlock(node) || ts.isModuleBlock(node)) {
				const blockScope = this.createScope(scope);

				const result = ts.visitEachChild(
					node,
					(child) => this.visitNode(child, blockScope).node,
					this.state.context,
				);

				return {
					node: result,
					modified: result !== node,
					scope: blockScope,
				};
			}

			if (ts.isIdentifier(node)) {
				return this.handleVariableReplacement(node, scope);
			}

			if (ts.isVariableStatement(node)) {
				return this.processVariableStatement(node, scope);
			}

			// Recursively visit child nodes
			let modified = false;

			const visitedNode = ts.visitEachChild(
				node,
				(child) => {
					const result = this.visitNode(child, scope);

					modified = modified || result.modified;

					return result.node;
				},
				this.state.context,
			);

			return { node: visitedNode, modified, scope };
		}

		public transform(sourceFile: Node) {
			this.tracker.clear();

			// First pass: collect all function declarations and their usage
			let result = ts.visitNode(
				sourceFile,
				(node) => this.visitNode(node).node,
			);

			// Second pass: perform the actual inlining
			let modified = true;
			let iteration = 0;

			while (modified && iteration < CONFIG.MAX_ITERATIONS) {
				const visitResult = this.visitNode(result);

				modified = visitResult.modified;

				result = visitResult.node as SourceFile;

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
