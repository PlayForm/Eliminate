



// finish migration ⬇️⬅️


interface Literal extends Expression {
	type: "Literal";

	value: string | number | boolean | null | RegExp;

	raw: string;

	regex?: { pattern: string; flags: string };
}

interface Literal extends Node {
	type: "Literal";

	value: string | number | boolean | null;

	raw?: string;
}

interface Variable {
	name: string;

	mutable: boolean;

	references: Reference[];
}

interface VariableDeclarator extends Node {
	type: "VariableDeclarator";

	id: Identifier;

	init: Expression | null;
}

interface VariableDeclarator extends Node {
	type: "VariableDeclarator";

	id: Identifier;

	init: Expression | null;
}

interface MemberExpression extends Expression {
	type: "MemberExpression";

	object: Expression;

	property: Expression;

	computed: boolean;

	optional?: boolean;
}

interface MemberExpression extends Node {
	type: "MemberExpression";

	object: Expression;

	property: Expression | Identifier;

	computed: boolean;

	optional?: boolean;
}

type AnalysisResult = {
	effects: Set<Effect>;

	mutations: Set<string>;

	dependencies: Set<string>;

	errors: Set<string>;

	complexity: number;

	purity: number;
};

// Helper classes for building analysis results
class AnalysisResultBuilder {
	private readonly effects = new Set<Effect>();

	private readonly mutations = new Set<string>();

	private readonly dependencies = new Set<string>();

	private readonly errors = new Set<string>();

	private complexity = 0;

	private purity = 1;

	public addEffect(effect: Effect): void {
		this.effects.add(effect);

		if (effect !== "pure") {
			this.purity *= 0.9;
		}
	}

	public addMutation(path: string): void {
		this.mutations.add(path);

		this.purity *= 0.8;
	}

	public addDependency(name: string): void {
		this.dependencies.add(name);
	}

	public addError(error: string): void {
		this.errors.add(error);
	}

	public isValid(): boolean {
		return this.errors.size === 0;
	}

	public build(): AnalysisResult {
		return {
			effects: new Set(this.effects),
			mutations: new Set(this.mutations),
			dependencies: new Set(this.dependencies),
			errors: new Set(this.errors),
			complexity: this.complexity,
			purity: this.purity,
		};
	}
}

interface EffectAnalysis {
	effects: Set<Effect>;

	mutations: Set<string>;

	dependencies: Set<string>;

	complexity: number;
}

// Advanced type system for tracking effects and mutations
// Effect system for tracking side effects and mutations
type Effect =
	| "pure" // No side effects
	| "reads" // Reads from variables/properties
	| "writes" // Writes to variables/properties
	| "calls" // Function calls
	| "allocates" // Object/array creation
	| "throws" // May throw exceptions
	| "async" // Async operations
	| "mutates" // Mutates existing objects
	| "captures" // Captures variables in closure
	| "generates" // Generates new values (Math.random etc)
	| "network" // Network operations
	| "dom" // DOM operations
	| "timing"; // Timing-dependent operations

interface EffectSet {
	readonly effects: ReadonlySet<Effect>;

	readonly mutations: ReadonlySet<string>;

	readonly dependencies: ReadonlySet<string>;

	readonly complexity: number;

	readonly purity: number; // 0-1 score of how pure the expression is
}

interface CallExpression extends Expression {
	type: "CallExpression";

	callee: Expression;

	arguments: Expression[];

	optional?: boolean;
}

interface CallExpression extends Node {
	type: "CallExpression";

	callee: Expression;

	arguments: Expression[];

	optional?: boolean;
}

interface BinaryExpression extends Node {
	type: "BinaryExpression";

	operator: string;

	left: Expression;

	right: Expression;
}

interface ObjectExpression extends Node {
	type: "ObjectExpression";

	properties: Array<Property | SpreadElement>;
}

interface ArrayExpression extends Node {
	type: "ArrayExpression";

	elements: Array<Expression | SpreadElement | null>;
}

interface Property extends Node {
	type: "Property";

	key: Expression;

	value: Expression;

	kind: "init" | "get" | "set";

	method: boolean;

	shorthand: boolean;

	computed: boolean;
}

interface SpreadElement extends Node {
	type: "SpreadElement";

	argument: Expression;
}

interface Scope {
	variables: Map<string, Variable>;

	parent?: Scope;
}

interface Scope {
	variables: Map<string, ScopeVariable>;

	parent?: Scope;
}

interface ScopeVariable {
	name: string;

	declarations: VariableDeclarator[];

	references: Reference[];

	constant: boolean;
}

interface Reference {
	node: Identifier;

	isWrite: boolean;
}

interface Reference {
	identifier: Identifier;

	isWrite: boolean;

	resolved: ScopeVariable;
}

class InlineSafetyChecker {
	private readonly SAFE_BUILTINS = new Set([
		"Object.freeze",
		"Object.seal",
		"Object.keys",
		"Object.values",
		"Object.entries",
		"Array.isArray",
		"Math.abs",
		"Math.max",
		"Math.min",
		"Math.floor",
		"Math.ceil",
		"Math.round",
		"Math.sign",
		"Math.trunc",
		"Number.isInteger",
		"Number.isFinite",
		"Number.parseInt",
		"Number.parseFloat",
		"String.fromCharCode",
		"String.fromCodePoint",
	]);

	private readonly SAFE_OPERATORS = new Set([
		"+",
		"-",
		"*",
		"/",
		"%",
		"**",
		"==",
		"===",
		"!=",
		"!==",
		"<",
		"<=",
		">",
		">=",
		"&&",
		"||",
		"??",
	]);

	public isSafeToInline(
		useNode: Node,
		declaration: VariableDeclarator,
		scope: Scope,
	): { safe: boolean; reason?: string } {
		// Check if declaration is exported
		if (this.isExported(declaration)) {
			return {
				safe: false,
				reason: "Variable is exported and cannot be safely inlined",
			};
		}

		// Check for destructuring patterns
		if (declaration.id.type !== "Identifier") {
			return {
				safe: false,
				reason: "Destructuring patterns are not safe to inline",
			};
		}

		// Check if variable is reassigned
		const varInfo = this.analyzeVariableUsage(declaration.id.name, scope);

		if (!varInfo.constant) {
			return {
				safe: false,
				reason: "Variable is reassigned in scope",
			};
		}

		// Check initializer safety
		if (!declaration.init) {
			return {
				safe: false,
				reason: "Variable has no initializer",
			};
		}

		const initSafety = this.isInitializerSafe(declaration.init);

		if (!initSafety.safe) {
			return initSafety;
		}

		// Check for potential temporal dead zone issues
		if (this.hasTemporalDeadZoneRisk(useNode, declaration, scope)) {
			return {
				safe: false,
				reason: "Inlining could cause temporal dead zone violations",
			};
		}

		// Check size complexity
		if (this.isTooBigToInline(declaration.init)) {
			return {
				safe: false,
				reason: "Initializer is too complex to safely inline",
			};
		}

		return { safe: true };
	}

	private isInitializerSafe(node: Expression): {
		safe: boolean;

		reason?: string;
	} {
		switch (node.type) {
			case "Literal":
				return { safe: true };

			case "Identifier":
				return this.isIdentifierSafe(node);

			case "BinaryExpression":
				return this.isBinaryExpressionSafe(node);

			case "MemberExpression":
				return this.isMemberExpressionSafe(node);

			case "CallExpression":
				return this.isCallExpressionSafe(node);

			case "ObjectExpression":
				return this.isObjectExpressionSafe(node);

			case "ArrayExpression":
				return this.isArrayExpressionSafe(node);

			default:
				return {
					safe: false,
					reason: `Unsupported expression type: ${node.type}`,
				};
		}
	}

	private isIdentifierSafe(node: Identifier): {
		safe: boolean;

		reason?: string;
	} {
		// Check if identifier refers to a constant
		const name = node.name;

		// Allow built-in globals that are known to be immutable
		const safeGlobals = ["undefined", "Infinity", "NaN"];

		if (safeGlobals.includes(name)) {
			return { safe: true };
		}

		return {
			safe: false,
			reason: "Identifier might refer to mutable value",
		};
	}

	private isBinaryExpressionSafe(node: BinaryExpression): {
		safe: boolean;

		reason?: string;
	} {
		if (!this.SAFE_OPERATORS.has(node.operator)) {
			return {
				safe: false,
				reason: `Operator ${node.operator} might have side effects`,
			};
		}

		const leftSafety = this.isInitializerSafe(node.left);

		if (!leftSafety.safe) return leftSafety;

		const rightSafety = this.isInitializerSafe(node.right);

		if (!rightSafety.safe) return rightSafety;

		return { safe: true };
	}

	private isMemberExpressionSafe(node: MemberExpression): {
		safe: boolean;

		reason?: string;
	} {
		// Generally unsafe due to potential getters
		if (node.computed) {
			return {
				safe: false,
				reason: "Computed property access might have side effects",
			};
		}

		// Check if it's a safe static property access
		if (this.isStaticPropertyAccessSafe(node)) {
			return { safe: true };
		}

		return {
			safe: false,
			reason: "Property access might involve getters",
		};
	}

	private isCallExpressionSafe(node: CallExpression): {
		safe: boolean;

		reason?: string;
	} {
		// Check if it's a known pure function
		const calleeStr = this.getCalleeString(node.callee);

		if (this.SAFE_BUILTINS.has(calleeStr)) {
			// Check arguments safety
			for (const arg of node.arguments) {
				const argSafety = this.isInitializerSafe(arg);

				if (!argSafety.safe) return argSafety;
			}

			return { safe: true };
		}

		return {
			safe: false,
			reason: "Function call might have side effects",
		};
	}

	private isObjectExpressionSafe(node: ObjectExpression): {
		safe: boolean;

		reason?: string;
	} {
		for (const prop of node.properties) {
			if (prop.type === "SpreadElement") {
				return {
					safe: false,
					reason: "Spread operations might have side effects",
				};
			}

			if (prop.type === "Property") {
				if (prop.kind !== "init" || prop.method) {
					return {
						safe: false,
						reason: "Object contains methods or accessors",
					};
				}

				const valueSafety = this.isInitializerSafe(prop.value);

				if (!valueSafety.safe) return valueSafety;
			}
		}

		return { safe: true };
	}

	private isArrayExpressionSafe(node: ArrayExpression): {
		safe: boolean;

		reason?: string;
	} {
		for (const element of node.elements) {
			if (!element) continue; // Skip holes in array

			if (element.type === "SpreadElement") {
				return {
					safe: false,
					reason: "Array spread might have side effects",
				};
			}

			const elementSafety = this.isInitializerSafe(element);

			if (!elementSafety.safe) return elementSafety;
		}

		return { safe: true };
	}

	private isStaticPropertyAccessSafe(node: MemberExpression): boolean {
		if (
			node.object.type === "Identifier" &&
			node.property.type === "Identifier"
		) {
			const objectName = node.object.name;

			const propName = node.property.name;

			// Check if it's accessing a known safe static property
			const safePaths = new Set([
				"Math.PI",
				"Math.E",
				"Number.MAX_SAFE_INTEGER",
				"Number.MIN_SAFE_INTEGER",
				"Number.POSITIVE_INFINITY",
				"Number.NEGATIVE_INFINITY",
			]);

			return safePaths.has(`${objectName}.${propName}`);
		}

		return false;
	}

	private getCalleeString(node: Expression): string {
		if (
			node.type === "MemberExpression" &&
			node.object.type === "Identifier" &&
			node.property.type === "Identifier"
		) {
			return `${node.object.name}.${node.property.name}`;
		}

		return "";
	}

	private isExported(node: Node): boolean {
		let current: Node | undefined = node;

		while (current?.parent) {
			if (
				current.parent.type === "ExportNamedDeclaration" ||
				current.parent.type === "ExportDefaultDeclaration"
			) {
				return true;
			}

			current = current.parent;
		}

		return false;
	}

	private analyzeVariableUsage(
		name: string,
		scope: Scope,
	): { constant: boolean } {
		const variable = scope.variables.get(name);

		if (!variable) {
			return { constant: false };
		}

		// Check if variable is ever written to after declaration
		const hasReassignment = variable.references.some(
			(ref) =>
				ref.isWrite && ref.identifier !== variable.declarations[0]?.id,
		);

		return { constant: !hasReassignment };
	}

	private hasTemporalDeadZoneRisk(
		useNode: Node,
		declaration: VariableDeclarator,
		scope: Scope,
	): boolean {
		// Check if any referenced identifiers in the initializer
		// could be in TDZ when inlined at the use site
		const identifiers = this.collectIdentifiers(declaration.init);

		const useLoc = useNode.loc?.start.line ?? 0;

		return identifiers.some((id) => {
			const variable = this.resolveIdentifier(id, scope);

			if (!variable) return true; // Unresolved reference is unsafe

			const declLoc = variable.declarations[0]?.id.loc?.start.line ?? 0;

			return declLoc > useLoc; // Reference before declaration
		});
	}

	private collectIdentifiers(node: Expression | null): Identifier[] {
		const identifiers: Identifier[] = [];

		if (!node) return identifiers;

		const visit = (node: Node): void => {
			if (node.type === "Identifier") {
				identifiers.push(node);
			}

			for (const key in node) {
				const value = (node as any)[key];

				if (value && typeof value === "object") {
					if (Array.isArray(value)) {
						value.forEach((item) => {
							if (item && typeof item === "object") {
								visit(item);
							}
						});
					} else {
						visit(value);
					}
				}
			}
		};

		visit(node);

		return identifiers;
	}

	private resolveIdentifier(
		id: Identifier,
		scope: Scope,
	): ScopeVariable | undefined {
		let currentScope: Scope | undefined = scope;

		while (currentScope) {
			const variable = currentScope.variables.get(id.name);

			if (variable) return variable;

			currentScope = currentScope.parent;
		}

		return undefined;
	}

	private isTooBigToInline(node: Expression): boolean {
		let size = 0;

		const MAX_SIZE = 100; // Adjustable threshold

		const visit = (node: Node): void => {
			size++;

			for (const key in node) {
				const value = (node as any)[key];

				if (value && typeof value === "object") {
					if (Array.isArray(value)) {
						value.forEach((item) => {
							if (item && typeof item === "object") {
								visit(item);
							}
						});
					} else {
						visit(value);
					}
				}
			}
		};

		visit(node);

		return size > MAX_SIZE;
	}
}

// Example usage:
/*
const analyzer = new InlineSafetyAnalyzer({

  allowComplex: false,
  maxSize: 200,
  maxDepth: 3,
  strictMode: true
});


const analysis = analyzer.analyzeSafety(useNode, declaration, scope);

if (analysis.safe) {

  // Proceed with inlining
} else {
 
  console.log('Cannot inline due to:', Array.from(analysis.reasons));

  console.log('Effects:', Array.from(analysis.effects));
  
  console.log('Mutations:', Array.from(analysis.mutations));
  
  console.log
*/

// Example usage:
// const checker = new InlineSafetyChecker();
//
// const result = checker.isSafeToInline(useNode, declaration, scope);
//
// if (result.safe) {
//
//   // Proceed with inlining
// } else {
//
//   console.log(`Cannot inline: ${result.reason}`);
//
// }
//
