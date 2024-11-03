import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
	Expression,
	Identifier,
	Node,
	TransformationContext,
	VariableStatement,
} from "typescript";

/**
 * @module Output
 * Enhanced transformer with comprehensive validation, error handling,
 * circular reference detection, and performance optimizations
 */

type VisitResult<T extends Node = Node> = {
	readonly node: T;

	readonly modified: boolean;

	readonly dependencies?: Set<string>;
};

interface TransformerState {
	readonly visitCount: number;

	readonly iterationCount: number;

	readonly context: TransformationContext;

	readonly errors: ReadonlyArray<TransformError>;

	readonly warnings: ReadonlyArray<TransformWarning>;

	readonly processedNodes: ReadonlySet<string>;

	readonly dependencyGraph: Map<string, Set<string>>;
}

interface TransformError {
	readonly code: ErrorCode;

	readonly message: string;

	readonly node: Node;

	readonly stack?: string;
}

interface TransformWarning {
	readonly code: WarningCode;

	readonly message: string;

	readonly node: Node;
}

interface ValidationResult {
	readonly isValid: boolean;

	readonly error?: TransformError;

	readonly warning?: TransformWarning;
}

enum ErrorCode {
	MAX_DEPTH_EXCEEDED = "MAX_DEPTH_EXCEEDED",
	MAX_VISITS_EXCEEDED = "MAX_VISITS_EXCEEDED",
	MAX_ITERATIONS_EXCEEDED = "MAX_ITERATIONS_EXCEEDED",
	CIRCULAR_REFERENCE = "CIRCULAR_REFERENCE",
	TRANSFORM_ERROR = "TRANSFORM_ERROR",
	INVALID_IDENTIFIER = "INVALID_IDENTIFIER",
	INVALID_PROPERTY_ACCESS = "INVALID_PROPERTY_ACCESS",
	UNINITIALIZED_VARIABLE = "UNINITIALIZED_VARIABLE",
	SELF_REFERENCE = "SELF_REFERENCE",
}

enum WarningCode {
	POTENTIAL_SIDE_EFFECT = "POTENTIAL_SIDE_EFFECT",
	UNUSED_DECLARATION = "UNUSED_DECLARATION",
	COMPLEX_INITIALIZATION = "COMPLEX_INITIALIZATION",
}

const CONFIG = {
	MAX_RECURSIVE_DEPTH: 100,
	MAX_NODE_VISITS: 1000,
	MAX_ITERATIONS: 100,
	BATCH_SIZE: 50,
	CACHE_SIZE_LIMIT: 10000,
} as const;

class CircularReferenceDetector {
	private readonly dependencies = new Map<string, Set<string>>();

	detectCircular(identifier: string, dependencies: Set<string>): boolean {
		const visited = new Set<string>();

		const stack = [identifier];

		while (stack.length > 0) {
			const current = stack.pop()!;

			visited.add(current);

			const deps = this.dependencies.get(current) || dependencies;

			if (!deps) continue;

			for (const dep of deps) {
				if (dep === identifier) return true;

				if (!visited.has(dep)) {
					stack.push(dep);
				}
			}
		}

		this.dependencies.set(identifier, dependencies);

		return false;
	}

	clear(): void {
		this.dependencies.clear();
	}
}

class TransformerCache {
	private readonly cache = new Map<string, VisitResult>();

	private size = 0;

	get(key: string): VisitResult | undefined {
		return this.cache.get(key);
	}

	set(key: string, value: VisitResult): void {
		if (this.size >= CONFIG.CACHE_SIZE_LIMIT) {
			// Implement LRU eviction if needed
			const firstKey = this.cache.keys().next().value;

			if (firstKey) {
				this.cache.delete(firstKey);
			}

			this.size--;
		}

		this.cache.set(key, value);

		this.size++;
	}

	clear(): void {
		this.cache.clear();

		this.size = 0;
	}
}

export const Fn = ((usageMap, initializerMap) => {
	class NodeTransformer {
		private readonly state: TransformerState;

		private readonly cache: TransformerCache;

		private readonly circularDetector: CircularReferenceDetector;

		constructor(context: TransformationContext) {
			this.state = {
				visitCount: 0,
				iterationCount: 0,
				context,
				errors: [],
				warnings: [],
				processedNodes: new Set(),
				dependencyGraph: new Map(),
			};

			this.cache = new TransformerCache();

			this.circularDetector = new CircularReferenceDetector();
		}

		private createVisitResult<T extends Node>(
			node: T,
			modified: boolean,
			dependencies?: Set<string>,
		): VisitResult<T> {
			return Object.freeze({
				node,
				modified,
				dependencies:
					typeof dependencies !== "undefined"
						? dependencies
						: new Set([]),
			});
		}

		private getCacheKey(node: Node): string {
			return `${node.kind}-${node.pos}-${node.end}-${this.state.iterationCount}`;
		}

		private validateNode(node: Node, depth: number): ValidationResult {
			if (depth > CONFIG.MAX_RECURSIVE_DEPTH) {
				return {
					isValid: false,
					error: {
						code: ErrorCode.MAX_DEPTH_EXCEEDED,
						message: `Maximum depth of ${CONFIG.MAX_RECURSIVE_DEPTH} exceeded`,
						node,
					},
				};
			}

			if (this.state.visitCount > CONFIG.MAX_NODE_VISITS) {
				return {
					isValid: false,
					error: {
						code: ErrorCode.MAX_VISITS_EXCEEDED,
						message: `Maximum visits of ${CONFIG.MAX_NODE_VISITS} exceeded`,
						node,
					},
				};
			}

			return { isValid: true };
		}

		private handleIdentifier(
			node: Identifier,
		): VisitResult<Identifier | Expression> {
			const name = node.text;

			const usage = usageMap.get(name);

			if (!usage) {
				return this.createVisitResult(node, false);
			}

			// Try to find an initializer that matches the name
			let initializer: Node | undefined;

			for (const [init, varName] of initializerMap.entries()) {
				if (varName === name) {
					initializer = init;

					break;
				}
			}

			if (!initializer) {
				return this.createVisitResult(node, false);
			}

			// Detect self-references
			if (this.isSelfReference(node, initializer)) {
				return this.createVisitResult(node, false, new Set([name]));
			}

			// Check for circular references
			const dependencies = this.collectDependencies(initializer);

			if (this.circularDetector.detectCircular(name, dependencies)) {
				return this.createVisitResult(node, false);
			}

			try {
				// Transform the initializer
				const transformedNode = this.transformNodeSafely(initializer);

				// Visit it to handle any nested identifiers
				const result = this.visitNode(transformedNode);

				// Ensure we have an expression
				if (!ts.isExpression(result.node)) {
					return this.createVisitResult(node, false);
				}

				return this.createVisitResult(
					result.node as Expression,
					true,
					dependencies,
				);
			} catch (error) {
				this.handleError(error, node);

				return this.createVisitResult(node, false);
			}
		}

		private isSelfReference(node: Identifier, initializer: Node): boolean {
			if (!isIdentifier(initializer)) {
				return false;
			}

			return node.text === initializer.text;
		}

		private collectDependencies(node: Node): Set<string> {
			const dependencies = new Set<string>();

			const visitor = (node: Node): void => {
				if (isIdentifier(node)) {
					dependencies.add(node.text);
				}

				ts.forEachChild(node, visitor);
			};

			visitor(node);

			return dependencies;
		}

		private transformNodeSafely(node: Node): Node {
			try {
				const transformed = ts.transform(
					node,
					[(_Context) => (node) => node],
					{
						noEmitHelpers: true,
						preserveConstEnums: true,
						preserveValueImports: true,
					},
				).transformed[0];

				return transformed || node;
			} catch (_Error) {
				console.log(_Error);

				return node;
			}
		}

		private handleError(error: unknown, node: Node): void {
			(this.state as any).errors = [
				...this.state.errors,
				{
					code: ErrorCode.TRANSFORM_ERROR,
					message:
						error instanceof Error ? error.message : String(error),
					node,
					stack:
						error instanceof Error
							? (error.stack ?? "undefined")
							: "undefined",
				},
			];
		}

		public visitNode(node: Node, depth = 0): VisitResult {
			const validation = this.validateNode(node, depth);

			if (!validation.isValid) {
				this.handleError(validation.error!, node);

				return this.createVisitResult(node, false);
			}

			const cacheKey = this.getCacheKey(node);

			const cached = this.cache.get(cacheKey);

			if (cached) return cached;

			(this.state as any).visitCount++;

			let result: VisitResult;

			if (isIdentifier(node)) {
				result = this.handleIdentifier(node);
			} else if (ts.isVariableStatement(node)) {
				result = this.handleVariableStatement(node);
			} else {
				result = this.handleGenericNode(node, depth);
			}

			this.cache.set(cacheKey, result);

			return result;
		}

		private handleVariableStatement(
			node: VariableStatement,
		): VisitResult<VariableStatement> {
			const newDeclarations = [];

			let modified = false;

			for (const declaration of node.declarationList.declarations) {
				if (!isIdentifier(declaration.name)) {
					newDeclarations.push(declaration);

					continue;
				}

				const name = declaration.name.text;

				const usage = usageMap.get(name);

				// Keep exported variables
				if (
					node.modifiers?.some(
						(mod) => mod.kind === ts.SyntaxKind.ExportKeyword,
					)
				) {
					// If it has an initializer that can be simplified, do so
					if (declaration.initializer) {
						const result = this.visitNode(declaration.initializer);

						if (result.modified && ts.isExpression(result.node)) {
							modified = true;

							newDeclarations.push(
								factory.updateVariableDeclaration(
									declaration,
									declaration.name,
									declaration.exclamationToken,
									declaration.type,
									result.node,
								),
							);
						} else {
							newDeclarations.push(declaration);
						}
					} else {
						newDeclarations.push(declaration);
					}

					continue;
				}

				// For non-exported variables with single usage, don't add to newDeclarations
				// This effectively removes them since they've been inlined
				if (usage === 1 && declaration.initializer) {
					// Store the initializer itself as the key for uniqueness
					if (!initializerMap.has(declaration.initializer)) {
						initializerMap.set(declaration.initializer, name);
					}

					modified = true;

					continue;
				}

				// Keep declarations that aren't eligible for inlining
				newDeclarations.push(declaration);
			}

			// If we have no declarations left, return an empty statement
			if (newDeclarations.length === 0) {
				return this.createVisitResult(
					factory.createEmptyStatement() as any,
					true,
				);
			}

			// If nothing changed, return original node
			if (!modified) {
				return this.createVisitResult(node, false);
			}

			// Create updated variable statement with remaining declarations
			return this.createVisitResult(
				factory.updateVariableStatement(
					node,
					node.modifiers,
					factory.createVariableDeclarationList(
						newDeclarations,
						node.declarationList.flags,
					),
				),
				true,
			);
		}

		private handleGenericNode(node: Node, depth: number): VisitResult {
			let modified = false;

			// Special handling for shorthand property assignments
			if (ts.isShorthandPropertyAssignment(node)) {
				const nameResult = this.visitNode(node.name);

				// If the name was modified and is an expression, create a regular property assignment
				if (nameResult.modified && ts.isExpression(nameResult.node)) {
					return this.createVisitResult(
						factory.createPropertyAssignment(
							node.name,
							nameResult.node,
						),
						true,
					);
				}

				return this.createVisitResult(node, false);
			}

			// Special handling for property assignments
			if (ts.isPropertyAssignment(node)) {
				const nameResult = ts.isComputedPropertyName(node.name)
					? this.visitNode(node.name.expression)
					: { node: node.name, modified: false };

				const initializerResult = this.visitNode(node.initializer);

				if (nameResult.modified || initializerResult.modified) {
					modified = true;

					const newName = ts.isComputedPropertyName(node.name)
						? factory.createComputedPropertyName(
								nameResult.node as Expression,
							)
						: node.name;

					return this.createVisitResult(
						factory.createPropertyAssignment(
							newName,
							initializerResult.node as Expression,
						),
						true,
					);
				}

				return this.createVisitResult(node, false);
			}

			// Special handling for array literals
			if (ts.isArrayLiteralExpression(node)) {
				const elements = node.elements.map((element) => {
					if (ts.isSpreadElement(element)) {
						const spreadResult = this.visitNode(element.expression);

						modified = modified || spreadResult.modified;

						return factory.createSpreadElement(
							spreadResult.node as Expression,
						);
					}

					const result = this.visitNode(element);

					modified = modified || result.modified;

					return result.node as Expression;
				});

				if (modified) {
					return this.createVisitResult(
						factory.createArrayLiteralExpression(elements),
						true,
					);
				}

				return this.createVisitResult(node, false);
			}

			// Special handling for object literals
			if (ts.isObjectLiteralExpression(node)) {
				const properties = node.properties.map((prop) => {
					// Skip spread assignments - they should be handled by visitEachChild
					if (ts.isSpreadAssignment(prop)) {
						return prop;
					}

					const result = this.visitNode(prop);

					modified = modified || result.modified;

					return result.node;
				});

				if (modified) {
					return this.createVisitResult(
						factory.createObjectLiteralExpression(
							properties as any,
						),
						true,
					);
				}

				return this.createVisitResult(node, false);
			}

			// Handle all other nodes
			const newNode = ts.visitEachChild(
				node,
				(child) => {
					const result = this.visitNode(child, depth + 1);

					modified = modified || result.modified;

					return result.node;
				},
				this.state.context,
			);

			return this.createVisitResult(newNode, modified);
		}

		public getState(): Readonly<TransformerState> {
			return this.state;
		}
	}

	return (context) => (rootNode) => {
		const transformer = new NodeTransformer(context);

		let currentNode = rootNode;

		// let iterationCount = 0;

		// while (iterationCount < CONFIG.MAX_ITERATIONS) {
		// 	const result = transformer.visitNode(currentNode);

		// 	if (!result.modified) {
		// 		return result.node;
		// 	}

		// 	currentNode = result.node;

		// 	iterationCount++;

		// 	const state = transformer.getState();

		// 	if (state.errors.length > 0) {
		// 		console.error("Transformation errors:", state.errors);
		// 	}

		// 	if (state.warnings.length > 0) {
		// 		console.warn("Transformation warnings:", state.warnings);
		// 	}
		// }

		return currentNode;
	};
}) satisfies Interface as Interface;

export const {
	default: ts,
	isIdentifier,
	factory,
} = await import("typescript");

export const { default: Get } = await import("@Function/Output/Visit/Get.js");

export default Fn;
