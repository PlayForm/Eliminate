import { memoize } from "lodash";

interface ScopeVariable {
	name: string;

	declarations: VariableDeclarator[];

	references: Reference[];

	constant: boolean;
}

interface Scope {
	variables: Map<string, Variable>;

	// variables: Map<string, ScopeVariable>;
	// new

	parent?: Scope;
}

interface Reference {
	node: Identifier;

	identifier: Identifier;

	isWrite: boolean;

	resolved: ScopeVariable;
}

// Advanced type system for precise AST node types
type NodeType = ExpressionType | StatementType | PatternType | DeclarationType;

// type Node = Expression | VariableDeclarator | Property | SpreadElement;
// old

interface Node {
	type: NodeType;

	loc?: SourceLocation;

	range?: [number, number];

	parent?: Node;

	leadingComments?: Comment[];

	trailingComments?: Comment[];
}

// into here from there ⬇️⬅️
// BaseNode became Expression 3-4
// and type Node became NodeType 2-4

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

		if (!leftSafety.safe) {
			return leftSafety;
		}

		const rightSafety = this.isInitializerSafe(node.right);

		if (!rightSafety.safe) {
			return rightSafety;
		}

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

				if (!argSafety.safe) {
					return argSafety;
				}
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

				if (!valueSafety.safe) {
					return valueSafety;
				}
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

			if (!elementSafety.safe) {
				return elementSafety;
			}
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

			if (!variable) {
				return true;
			} // Unresolved reference is unsafe

			const declLoc = variable.declarations[0]?.id.loc?.start.line ?? 0;

			return declLoc > useLoc; // Reference before declaration
		});
	}

	private collectIdentifiers(node: Expression | null): Identifier[] {
		const identifiers: Identifier[] = [];

		if (!node) {
			return identifiers;
		}

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

			if (variable) {
				return variable;
			}

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

interface SpreadElement extends Node {
	type: "SpreadElement";

	argument: Expression;
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

interface ArrayExpression extends Node {
	type: "ArrayExpression";

	elements: Array<Expression | SpreadElement | null>;
}

interface ObjectExpression extends Node {
	type: "ObjectExpression";

	properties: Array<Property | SpreadElement>;
}

interface BinaryExpression extends Node {
	type: "BinaryExpression";

	operator: string;

	left: Expression;

	right: Expression;
}

interface CallExpression extends Node {
	type: "CallExpression";

	callee: Expression;

	arguments: Expression[];

	optional?: boolean;
}

interface CallExpression extends Expression {
	type: "CallExpression";

	callee: Expression;

	arguments: Expression[];

	optional?: boolean;
}

interface EffectSet {
	readonly effects: ReadonlySet<Effect>;

	readonly mutations: ReadonlySet<string>;

	readonly dependencies: ReadonlySet<string>;

	readonly complexity: number;

	readonly purity: number; // 0-1 score of how pure the expression is
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

interface EffectAnalysis {
	effects: Set<Effect>;

	mutations: Set<string>;

	dependencies: Set<string>;

	complexity: number;
}

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

type AnalysisResult = {
	effects: Set<Effect>;

	mutations: Set<string>;

	dependencies: Set<string>;

	errors: Set<string>;

	complexity: number;

	purity: number;
};

interface MemberExpression extends Node {
	type: "MemberExpression";

	object: Expression;

	property: Expression | Identifier;

	computed: boolean;

	optional?: boolean;
}

interface MemberExpression extends Expression {
	type: "MemberExpression";

	object: Expression;

	property: Expression;

	computed: boolean;

	optional?: boolean;
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

interface Variable {
	name: string;

	mutable: boolean;

	references: Reference[];
}

interface Literal extends Node {
	type: "Literal";

	value: string | number | boolean | null;

	raw?: string;
}

interface Literal extends Expression {
	type: "Literal";

	value: string | number | boolean | null | RegExp;

	raw: string;

	regex?: { pattern: string; flags: string };
}

interface Identifier extends Node {
	type: "Identifier";

	name: string;
}

interface Identifier extends Expression {
	type: "Identifier";

	name: string;
}

interface SourceLocation {
	start: Position;

	end: Position;

	source?: string;
}

// Types for AST nodes
// Core interfaces

// type Node = {
//
//
//
//

// 	name?: string;
//
//
// 	init?: Node;
//
//
// 	callee?: Node;
//
//
// 	object?: Node;
//
//
// 	property?: Node;
//
//
// 	operator?: string;
//
//
// 	left?: Node;
//
//
// 	right?: Node;
//
//
// 	arguments?: Node[];
//
//
// };
//
//

interface Comment extends Node {
	type: "Line" | "Block";

	value: string;
}

interface Declaration extends Node {
	type: DeclarationType;
}

interface Pattern extends Node {
	type: PatternType;
}

interface Statement extends Node {
	type: StatementType;
}

// Expression types
interface Expression extends Node {
	type: ExpressionType;
}

type DeclarationType =
	| "VariableDeclaration"
	| "FunctionDeclaration"
	| "ClassDeclaration";

type PatternType =
	| "ObjectPattern"
	| "ArrayPattern"
	| "RestElement"
	| "AssignmentPattern";

type StatementType =
	| "BlockStatement"
	| "ExpressionStatement"
	| "IfStatement"
	| "SwitchStatement"
	| "ForStatement"
	| "ForInStatement"
	| "ForOfStatement"
	| "WhileStatement"
	| "DoWhileStatement"
	| "TryStatement"
	| "ThrowStatement"
	| "ReturnStatement"
	| "BreakStatement"
	| "ContinueStatement"
	| "LabeledStatement";

type ExpressionType =
	| "Identifier"
	| "Literal"
	| "MemberExpression"
	| "CallExpression"
	| "BinaryExpression"
	| "LogicalExpression"
	| "UnaryExpression"
	| "ObjectExpression"
	| "ArrayExpression"
	| "ConditionalExpression"
	| "TemplateLiteral"
	| "ArrowFunctionExpression"
	| "FunctionExpression"
	| "AwaitExpression"
	| "NewExpression"
	| "ThisExpression"
	| "SequenceExpression"
	| "TaggedTemplateExpression"
	| "YieldExpression"
	| "SpreadElement"
	| "ChainExpression";

// type Expression =
// | Identifier
// | Literal
// | MemberExpression
// | CallExpression
// | BinaryExpression
// | ObjectExpression
// | ArrayExpression;
//
//
//

// Configuration interfaces
interface AnalyzerOptions {
	maxSize?: number;

	maxDepth?: number;

	complexityThreshold?: number;

	purityThreshold?: number;

	allowAsyncAwait?: boolean;

	strictMode?: boolean;

	optimizationLevel?: 0 | 1 | 2;
}

interface SimplificationPattern {
	match: string;

	replacement: string;

	conditions: string[];
}

interface Transformation {
	type: "constFold" | "deadCodeElim" | "simplify";

	nodes?: Node[];

	patterns?: SimplificationPattern[];
}

// Types for optimization planning
interface OptimizationPlan {
	shouldInline: boolean;

	inlineStyle: "direct" | "wrapped";

	transformations: Transformation[];

	cost: number;

	benefit: number;
}

// Core types for AST nodes with precise type information
interface Position {
	line: number;

	column: number;

	offset: number;
}

// Export main class and types
export {
	InlineSafetyAnalyzer,
	AnalyzerOptions,
	AnalysisResult,
	OptimizationPlan,
	Effect,
	NodeType,
};

class InlineSafetyAnalyzer {
	private readonly cache = new WeakMap<Node, AnalysisResult>();

	private readonly options: Required<AnalyzerOptions>;

	private static readonly DEFAULT_OPTIONS: AnalyzerOptions = {
		maxSize: 500,
		maxDepth: 4,
		complexityThreshold: 150,
		purityThreshold: 0.8,
		allowAsyncAwait: false,
		strictMode: true,
		optimizationLevel: 2,
	};

	private readonly MAX_COMPLEXITY = 150;

	private readonly MAX_DEPTH = 4;

	private readonly MAX_SIZE = 500;

	private readonly PURE_BUILTIN_METHODS = new Map([
		[
			"Object",
			new Set([
				"keys",
				"values",
				"entries",
				"freeze",
				"seal",
				"preventExtensions",
				"isSealed",
				"isFrozen",
			]),
		],
		["Array", new Set(["isArray", "from", "of"])],
		[
			"Math",
			new Set([
				"abs",
				"acos",
				"acosh",
				"asin",
				"asinh",
				"atan",
				"atanh",
				"cbrt",
				"ceil",
				"clz32",
				"cos",
				"cosh",
				"exp",
				"expm1",
				"floor",
				"fround",
				"hypot",
				"imul",
				"log",
				"log1p",
				"log2",
				"log10",
				"max",
				"min",
				"pow",
				"random",
				"round",
				"sign",
				"sin",
				"sinh",
				"sqrt",
				"tan",
				"tanh",
				"trunc",
			]),
		],
		[
			"Number",
			new Set([
				"isFinite",
				"isInteger",
				"isNaN",
				"isSafeInteger",
				"parseFloat",
				"parseInt",
			]),
		],
		["String", new Set(["fromCharCode", "fromCodePoint", "raw"])],
	]);

	private readonly PURE_GLOBAL_VARS = new Set([
		"undefined",
		"Infinity",
		"NaN",
	]);

	private readonly SAFE_UNARY_OPERATORS = new Set([
		"+",
		"-",
		"!",
		"~",
		"typeof",
		"void",
	]);

	private readonly SAFE_BINARY_OPERATORS = new Set([
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
		"<<",
		">>",
		">>>",
		"&",
		"|",
		"^",
	]);

	private readonly SAFE_LOGICAL_OPERATORS = new Set(["&&", "||", "??"]);

	constructor(options: Partial<AnalyzerOptions> = {}) {
		this.options = { ...InlineSafetyAnalyzer.DEFAULT_OPTIONS, ...options };
	}

	constructor(
		private readonly options: {
			allowComplex?: boolean;

			maxSize?: number;

			maxDepth?: number;

			strictMode?: boolean;
		} = {},
	) {}

	private validateDeclaration(
		declaration: VariableDeclarator,
		result: AnalysisResultBuilder,
	): void {
		if (!declaration.init) {
			result.addError("Declaration has no initializer");

			return;
		}

		if (declaration.id.type !== "Identifier") {
			result.addError("Complex destructuring patterns not supported");

			return;
		}

		// Add more validation as needed...
	}

	private analyzeScopeImpact(
		declaration: VariableDeclarator,
		scope: Scope,
		context: AnalysisContext,
	): ScopeAnalysis {
		const analysis: ScopeAnalysis = {
			references: new Set<Reference>(),
			mutations: new Set<Mutation>(),
			closureImpact: new Set<string>(),
			temporalIssues: new Set<TemporalIssue>(),
		};

		// Analyze variable references
		const references = this.findReferences(declaration.id.name, scope);

		for (const ref of references) {
			analysis.references.add(ref);

			if (this.isMutation(ref)) {
				analysis.mutations.add({
					type: "reference",
					node: ref.node,
					path: ref.node.name,
				});
			}
		}

		// Analyze closure captures
		if (declaration.init) {
			const captures = this.analyzeClosureCaptures(
				declaration.init,
				scope,
			);

			analysis.closureImpact = captures;
		}

		// Analyze temporal dead zone issues
		const temporal = this.analyzeTemporalDeadZone(declaration, scope);

		analysis.temporalIssues = temporal;

		return analysis;
	}

	private performAnalysis(
		useNode: Expression,
		declaration: VariableDeclarator,
		scope: Scope,
		context: AnalysisContext,
	): AnalysisResult {
		const result = new AnalysisResultBuilder();

		// Phase 1: Basic Validation
		this.validateDeclaration(declaration, result);

		if (!result.isValid()) {
			return result.build();
		}

		// Phase 2: Scope Analysis
		const scopeAnalysis = this.analyzeScopeImpact(
			declaration,
			scope,
			context,
		);

		result.mergeScopeAnalysis(scopeAnalysis);

		if (!result.isValid()) {
			return result.build();
		}

		// Phase 3: Expression Analysis
		if (declaration.init) {
			const expressionAnalysis = this.analyzeExpression(
				declaration.init,
				context,
			);

			result.mergeExpressionAnalysis(expressionAnalysis);
		}

		// Phase 4: Safety Checks
		this.performSafetyChecks(result, useNode, declaration, context);

		// Phase 5: Optimization Analysis
		if (result.isValid()) {
			this.analyzeOptimizations(result, declaration, context);
		}

		return result.build();
	}

	@memoize
	public analyze(
		useNode: Expression,
		declaration: VariableDeclarator,
		scope: Scope,
		context: AnalysisContext = this.createContext(),
	): AnalysisResult {
		try {
			// Check cache first
			const cached = this.cache.get(declaration);

			if (cached && this.isCacheValid(cached, context)) {
				return cached;
			}

			const result = this.performAnalysis(
				useNode,
				declaration,
				scope,
				context,
			);

			// Cache the result
			if (this.shouldCache(result)) {
				this.cache.set(declaration, result);
			}

			return result;
		} catch (error) {
			return this.createErrorResult(error);
		}
	}

	public analyzeSafety(
		useNode: Expression,
		declaration: VariableDeclarator,
		scope: Scope,
	): SafetyAnalysis {
		const analysis: SafetyAnalysis = {
			safe: false,
			reasons: new Set<string>(),
			effects: new Set<Effect>(),
			mutations: new Set<string>(),
			dependencies: new Set<string>(),
			complexity: 0,
		};

		try {
			// Basic declaration checks
			if (!this.checkDeclaration(declaration, analysis)) {
				return analysis;
			}

			// Initialize context for deep analysis
			const context: AnalysisContext = {
				scope,
				depth: 0,
				seenNodes: new WeakSet(),
				effects: analysis.effects,
				mutations: analysis.mutations,
				dependencies: analysis.dependencies,
			};

			// Analyze initialization expression
			if (!declaration.init) {
				analysis.reasons.add("No initializer present");

				return analysis;
			}

			const initResults = this.analyzeExpression(
				declaration.init,
				context,
			);

			this.mergeAnalysis(analysis, initResults);

			// Check temporal dead zone risks
			if (this.checkTemporalDeadZone(useNode, declaration, context)) {
				analysis.reasons.add("Potential temporal dead zone violation");

				return analysis;
			}

			// Size and complexity checks
			const size = this.measureSize(declaration.init);

			if (size > (this.options.maxSize || this.MAX_SIZE)) {
				analysis.reasons.add(`Expression too large (size: ${size})`);

				return analysis;
			}

			// Effect analysis
			if (analysis.effects.has("writes")) {
				analysis.reasons.add("Expression contains mutations");

				return analysis;
			}

			if (analysis.effects.has("calls") && !this.options.allowComplex) {
				analysis.reasons.add("Expression contains function calls");

				return analysis;
			}

			if (analysis.effects.has("async")) {
				analysis.reasons.add("Expression contains async operations");

				return analysis;
			}

			// All checks passed
			analysis.safe = true;

			return analysis;
		} catch (error) {
			analysis.reasons.add(`Analysis error: ${error.message}`);

			return analysis;
		}
	}

	private analyzeExpression(
		node: Expression,
		context: AnalysisContext,
	): ExpressionAnalysis {
		const builder = new ExpressionAnalysisBuilder();

		// Prevent infinite recursion
		if (context.seen.has(node)) {
			builder.addEffect("recursive");

			return builder.build();
		}

		context.seen.add(node);

		try {
			switch (node.type) {
				case "Identifier":
					return this.analyzeIdentifier(
						node as Identifier,
						context,
						builder,
					);

				case "Literal":
					return this.analyzeLiteral(node as Literal, builder);

				case "MemberExpression":
					return this.analyzeMemberExpression(
						node as MemberExpression,
						context,
						builder,
					);

				case "CallExpression":
					return this.analyzeCallExpression(
						node as CallExpression,
						context,
						builder,
					);

				case "ObjectExpression":
					return this.analyzeObjectExpression(
						node as ObjectExpression,
						context,
						builder,
					);

				case "ArrayExpression":
					return this.analyzeArrayExpression(
						node as ArrayExpression,
						context,
						builder,
					);

				// ... handle other expression types
				default:
					builder.addError(
						`Unsupported expression type: ${node.type}`,
					);

					return builder.build();
			}
		} finally {
			context.seen.delete(node);
		}
	}

	private analyzeExpression(
		node: Expression,
		context: AnalysisContext,
	): EffectAnalysis {
		// Prevent infinite recursion
		if (context.seenNodes.has(node)) {
			throw new Error("Circular reference detected");
		}

		context.seenNodes.add(node);

		// Check depth
		if (context.depth > (this.options.maxDepth || this.MAX_DEPTH)) {
			throw new Error("Maximum expression depth exceeded");
		}

		context.depth++;

		try {
			switch (node.type) {
				case "Identifier":
					return this.analyzeIdentifier(node, context);

				case "Literal":
					return this.analyzeLiteral(node);

				case "MemberExpression":
					return this.analyzeMemberExpression(node, context);

				case "CallExpression":
					return this.analyzeCallExpression(node, context);

				case "BinaryExpression":
					return this.analyzeBinaryExpression(node, context);

				case "LogicalExpression":
					return this.analyzeLogicalExpression(node, context);

				case "UnaryExpression":
					return this.analyzeUnaryExpression(node, context);

				case "ObjectExpression":
					return this.analyzeObjectExpression(node, context);

				case "ArrayExpression":
					return this.analyzeArrayExpression(node, context);

				case "ConditionalExpression":
					return this.analyzeConditionalExpression(node, context);

				case "TemplateLiteral":
					return this.analyzeTemplateLiteral(node, context);

				default:
					throw new Error(
						`Unsupported expression type: ${node.type}`,
					);
			}
		} finally {
			context.depth--;
		}
	}

	private addOptimizationTransformations(
		plan: OptimizationPlan,
		result: AnalysisResult,
	): void {
		// Add constant folding where possible
		if (this.canFoldConstants(result)) {
			plan.transformations.push({
				type: "constFold",
				nodes: Array.from(result.constants),
			});
		}

		// Add dead code elimination
		if (result.deadCode.size > 0) {
			plan.transformations.push({
				type: "deadCodeElim",
				nodes: Array.from(result.deadCode),
			});
		}

		// Add expression simplification
		if (this.canSimplifyExpressions(result)) {
			plan.transformations.push({
				type: "simplify",
				patterns: this.identifySimplificationPatterns(result),
			});
		}
	}

	private createOptimizationPlan(
		result: AnalysisResult,
		declaration: VariableDeclarator,
	): OptimizationPlan {
		const plan: OptimizationPlan = {
			shouldInline: false,
			inlineStyle: "direct",
			transformations: [],
			cost: 0,
			benefit: 0,
		};

		// Calculate costs and benefits
		const size = this.measureSize(declaration.init!);

		const complexity = result.complexity;

		const purity = result.purity;

		// Size-based costs
		plan.cost += size * 0.1;

		// Complexity costs
		plan.cost += complexity * 0.05;

		// Purity benefits
		plan.benefit += purity * 10;

		// Frequency benefits
		const referenceCount = result.references.size;

		plan.benefit += Math.log(referenceCount + 1) * 5;

		// Determine inline style
		if (complexity > 50 || size > 100) {
			plan.inlineStyle = "wrapped";
		}

		// Determine transformations
		if (this.options.optimizationLevel >= 2) {
			this.addOptimizationTransformations(plan, result);
		}

		// Make final decision
		plan.shouldInline = plan.benefit > plan.cost;

		return plan;
	}

	private analyzeIdentifier(
		node: Identifier,
		context: AnalysisContext,
		builder: ExpressionAnalysisBuilder,
	): ExpressionAnalysis {
		const name = node.name;

		// Check for known constants
		if (this.isKnownConstant(name)) {
			builder.addEffect("pure");

			return builder.build();
		}

		// Check scope
		const binding = this.resolveBinding(name, context.scope);

		if (!binding) {
			builder.addError(`Unresolved reference: ${name}`);

			return builder.build();
		}

		// Analyze binding
		if (binding.mutable) {
			builder.addEffect("reads");

			builder.addDependency(name);
		}

		if (binding.modified) {
			builder.addEffect("mutates");
		}

		return builder.build();
	}

	private analyzeIdentifier(
		node: Identifier,
		context: AnalysisContext,
	): EffectAnalysis {
		const analysis: EffectAnalysis = {
			effects: new Set(["reads"]),
			mutations: new Set(),
			dependencies: new Set([node.name]),
			complexity: 1,
		};

		// Check if it's a safe global
		if (this.PURE_GLOBAL_VARS.has(node.name)) {
			analysis.effects = new Set(["pure"]);

			analysis.dependencies.clear();
		}

		// Check scope for mutability
		const variable = this.resolveVariable(node.name, context.scope);

		if (variable?.mutable) {
			analysis.effects.add("writes");
		}

		return analysis;
	}

	private analyzeMemberExpression(
		node: MemberExpression,
		context: AnalysisContext,
	): EffectAnalysis {
		const objectAnalysis = this.analyzeExpression(node.object, context);

		const propertyAnalysis = node.computed
			? this.analyzeExpression(node.property, context)
			: {
					effects: new Set(["pure"]),
					mutations: new Set(),
					dependencies: new Set(),
					complexity: 1,
				};

		// Combine analyses
		const analysis: EffectAnalysis = {
			effects: new Set([
				...objectAnalysis.effects,
				...propertyAnalysis.effects,
			]),
			mutations: new Set([
				...objectAnalysis.mutations,
				...propertyAnalysis.mutations,
			]),
			dependencies: new Set([
				...objectAnalysis.dependencies,
				...propertyAnalysis.dependencies,
			]),
			complexity:
				objectAnalysis.complexity + propertyAnalysis.complexity + 1,
		};

		// Check for safe static property access
		if (this.isStaticPropertyAccess(node)) {
			const objName = (node.object as Identifier).name;

			const propName = (node.property as Identifier).name;

			if (this.PURE_BUILTIN_METHODS.get(objName)?.has(propName)) {
				analysis.effects = new Set(["pure"]);

				analysis.mutations.clear();

				analysis.dependencies.clear();
			}
		}

		return analysis;
	}

	private analyzeCallExpression(
		node: CallExpression,
		context: AnalysisContext,
	): EffectAnalysis {
		const calleeAnalysis = this.analyzeExpression(node.callee, context);

		const argAnalyses = node.arguments.map((arg) =>
			this.analyzeExpression(arg, context),
		);

		const analysis: EffectAnalysis = {
			effects: new Set(["calls"]),
			mutations: new Set(),
			dependencies: new Set([...calleeAnalysis.dependencies]),
			complexity: calleeAnalysis.complexity + 1,
		};

		// Combine argument analyses
		for (const argAnalysis of argAnalyses) {
			analysis.effects = new Set([
				...analysis.effects,
				...argAnalysis.effects,
			]);

			analysis.mutations = new Set([
				...analysis.mutations,
				...argAnalysis.mutations,
			]);

			analysis.dependencies = new Set([
				...analysis.dependencies,
				...argAnalysis.dependencies,
			]);

			analysis.complexity += argAnalysis.complexity;
		}

		// Check for known pure function calls
		if (
			node.callee.type === "MemberExpression" &&
			this.isPureMethodCall(node)
		) {
			analysis.effects = new Set(["pure"]);

			analysis.mutations.clear();
		}

		return analysis;
	}

	private isPureMethodCall(node: CallExpression): boolean {
		if (node.callee.type !== "MemberExpression") {
			return false;
		}

		const { object, property } = node.callee;

		if (object.type === "Identifier" && property.type === "Identifier") {
			const methods = this.PURE_BUILTIN_METHODS.get(object.name);

			return methods?.has(property.name) ?? false;
		}

		return false;
	}

	private isStaticPropertyAccess(node: MemberExpression): boolean {
		return (
			node.object.type === "Identifier" &&
			node.property.type === "Identifier" &&
			!node.computed
		);
	}

	private resolveVariable(name: string, scope: Scope): Variable | undefined {
		let currentScope: Scope | undefined = scope;

		while (currentScope) {
			const variable = currentScope.variables.get(name);

			if (variable) {
				return variable;
			}

			currentScope = currentScope.parent;
		}

		return undefined;
	}

	private measureSize(node: Expression): number {
		let size = 0;

		const visit = (node: Node): void => {
			size++;

			for (const key in node) {
				const value = (node as any)[key];

				if (Array.isArray(value)) {
					value.forEach((item) => {
						if (item && typeof item === "object") {
							visit(item);
						}
					});
				} else if (value && typeof value === "object") {
					visit(value);
				}
			}
		};

		visit(node);

		return size;
	}

	private measureSize(node: Expression): number {
		let size = 0;

		const visit = (node: Expression): void => {
			size++;

			for (const key in node) {
				const value = (node as any)[key];

				if (Array.isArray(value)) {
					value.forEach((item) => {
						if (item && typeof item === "object") visit(item);
					});
				} else if (value && typeof value === "object") {
					visit(value);
				}
			}
		};

		visit(node);

		return size;
	}

	private mergeAnalysis(
		target: SafetyAnalysis,
		source: EffectAnalysis,
	): void {
		source.effects.forEach((effect) => target.effects.add(effect));

		source.mutations.forEach((mutation) => target.mutations.add(mutation));

		source.dependencies.forEach((dep) => target.dependencies.add(dep));

		target.complexity = Math.max(target.complexity, source.complexity);
	}

	// ... Additional helper methods for specific expression types ...
}

interface SafetyAnalysis extends EffectAnalysis {
	safe: boolean;

	reasons: Set<string>;
}

interface AnalysisContext {
	scope: Scope;

	depth: number;

	seenNodes: WeakSet<Expression>;

	effects: Set<Effect>;

	mutations: Set<string>;

	dependencies: Set<string>;
}

function isSafeToInline(node: Node, declaration: Node, scope: any): boolean {
	// Check if it's an exported const
	if (isExported(declaration)) {
		return false;
	}

	// Get the initializer
	const initializer = declaration.init;

	if (!initializer) {
		return false;
	}

	// Check for reassignment in scope
	if (isReassigned(declaration.name, scope)) {
		return false;
	}

	return isInitializerSafe(initializer);
}

function isInitializerSafe(node: Node): boolean {
	switch (node.type) {
		// Safe cases
		case "Literal":
		case "Identifier":
			return true;

		// Arithmetic operations
		case "BinaryExpression":
			return (
				isSimpleArithmetic(node) &&
				isInitializerSafe(node.left!) &&
				isInitializerSafe(node.right!)
			);

		// Property access
		case "MemberExpression":
			return false; // Property access may have side effects (getters)

		// Function calls
		case "CallExpression":
			return isPureFunctionCall(node);

		// Object/Array literals
		case "ObjectExpression":
		case "ArrayExpression":
			return node.type === "ArrayExpression"
				? (node.arguments?.every(isInitializerSafe) ?? true)
				: false; // Objects might have getters/setters

		default:
			return false; // Conservative approach for unknown types
	}
}

function isSimpleArithmetic(node: Node): boolean {
	const safeOperators = ["+", "-", "*", "/", "%", "**"];

	return (
		node.type === "BinaryExpression" &&
		safeOperators.includes(node.operator ?? "")
	);
}

function isPureFunctionCall(node: Node): boolean {
	// Known pure functions like Math.max, Number.parseInt, etc.
	const pureFunctions = new Set([
		"Math.max",
		"Math.min",
		"Math.floor",
		"Math.ceil",
		"Math.round",
		"Number.parseInt",
		"Number.parseFloat",
		"String.fromCharCode",
	]);

	if (
		node.type === "CallExpression" &&
		node.callee?.type === "MemberExpression"
	) {
		const callString = getCalleeString(node.callee);

		return pureFunctions.has(callString);
	}

	return false;
}

function getCalleeString(node: Node): string {
	if (node.type === "MemberExpression") {
		const obj = node.object?.type === "Identifier" ? node.object.name : "";

		const prop =
			node.property?.type === "Identifier" ? node.property.name : "";

		return `${obj}.${prop}`;
	}

	return "";
}

function isExported(declaration: Node): boolean {
	// Check for export keyword or if parent is an ExportNamedDeclaration
	return (
		declaration.type === "ExportNamedDeclaration" ||
		(declaration as any).parent?.type === "ExportNamedDeclaration"
	);
}

function isReassigned(varName: string | undefined, scope: any): boolean {
	// This would need to analyze the scope chain to find reassignments
	// Implementation depends on your AST traversal library
	return false; // Placeholder
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
//
//
//
// const result = checker.isSafeToInline(useNode, declaration, scope);
//
//
//
//
// if (result.safe) {
//
//
//
//
//
//   // Proceed with inlining
// } else {
//
//
//
//
//
//   console.log(`Cannot inline: ${result.reason}`);
//
//
//
//
// }
//
//
