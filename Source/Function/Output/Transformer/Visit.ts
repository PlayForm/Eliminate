import type Interface from "@Interface/Output/Transformer/Visit.js";
import type {
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

const enum ErrorCode {
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

const enum WarningCode {
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

		private handleIdentifier(node: Identifier): VisitResult<Identifier> {
			const name = node.text;

			const usage = usageMap.get(name);

			const initializer = Get(name, initializerMap);

			if (!initializer || !usage) {
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
				const transformed = this.transformNodeSafely(initializer);

				return this.createVisitResult(
					transformed as Identifier,
					true,
					dependencies,
				);
			} catch (error) {
				this.handleError(error, node);

				return this.createVisitResult(node, false);
			}
		}

		private isSelfReference(node: Identifier, initializer: Node): boolean {
			if (!ts.isIdentifier(initializer)) return false;

			return node.text === initializer.text;
		}

		private collectDependencies(node: Node): Set<string> {
			const dependencies = new Set<string>();

			const visitor = (node: Node): void => {
				if (ts.isIdentifier(node)) {
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

			if (ts.isIdentifier(node)) {
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
				if (!ts.isIdentifier(declaration.name)) {
					newDeclarations.push(declaration);

					continue;
				}

				const usage = usageMap.get(declaration.name.text);

				if (!usage || usage > 1 || !declaration.initializer) {
					newDeclarations.push(declaration);

					continue;
				}

				modified = true;
			}

			if (!modified) {
				return this.createVisitResult(node, false);
			}

			if (newDeclarations.length === 0) {
				return this.createVisitResult(
					factory.createEmptyStatement() as any,
					true,
				);
			}

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

		let iterationCount = 0;

		while (iterationCount < CONFIG.MAX_ITERATIONS) {
			const result = transformer.visitNode(currentNode);

			if (!result.modified) {
				return result.node;
			}

			currentNode = result.node;

			iterationCount++;

			const state = transformer.getState();

			if (state.errors.length > 0) {
				console.error("Transformation errors:", state.errors);
			}

			if (state.warnings.length > 0) {
				console.warn("Transformation warnings:", state.warnings);
			}
		}

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
