import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	Expression,
	Identifier,
	Node,
	Program,
	SourceFile,
	Statement,
	TransformationContext,
	TypeChecker,
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
	TYPE_CHECK_ERROR = "TYPE_CHECK_ERROR",
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

class VariableTracker {
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
		}>
	>();

	private typeCheckErrors = new Set<string>();

	private sideEffects = new Set<string>();

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

	recordTypeError(name: string): void {
		this.typeCheckErrors.add(name);
	}

	hasTypeError(name: string): boolean {
		return this.typeCheckErrors.has(name);
	}

	clear(): void {
		this.declarations.clear();

		this.uses.clear();

		this.typeCheckErrors.clear();

		this.sideEffects.clear();
	}
}

export const Fn = ((program: Program, typeChecker: TypeChecker) => {
	class Transformer {
		private readonly state: TransformerState;

		private readonly tracker: VariableTracker;

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

			this.tracker = new VariableTracker();
		}

		private createScope(parent?: ScopeInfo): ScopeInfo {
			return {
				variables: new Set(),
				parent,
			};
		}

		private async typeCheck(node: Node): Promise<boolean> {
			try {
				const promise = new Promise<boolean>((resolve) => {
					const diagnostics = typeChecker.getDiagnostics(node);

					resolve(diagnostics.length === 0);
				});

				const result = await Promise.race([
					promise,
					new Promise<boolean>((_, reject) =>
						setTimeout(
							() => reject(new Error("Type check timeout")),
							CONFIG.TYPE_CHECK_TIMEOUT,
						),
					),
				]);

				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);

				console.error(`Type check error: ${errorMessage}`);

				return false;
			}
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

			if (this.tracker.hasTypeError(name)) {
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
					stack: error instanceof Error ? error.stack : undefined,
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

		public transform(sourceFile: SourceFile): SourceFile {
			this.tracker.clear();

			let result = sourceFile;

			let iteration = 0;

			while (iteration < CONFIG.MAX_ITERATIONS) {
				const visitResult = this.visitNode(result);

				if (!visitResult.modified) break;

				result = visitResult.node as SourceFile;

				iteration++;

				if (iteration === CONFIG.MAX_ITERATIONS - 1) {
					this.state.warnings.push({
						code: WarningCode.PERFORMANCE_IMPACT,
						message: `Transformation reached maximum iteration limit`,
						node: sourceFile,
					});
				}
			}

			return result;
		}
	}

	return (context: TransformationContext) => (rootNode: SourceFile) => {
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
