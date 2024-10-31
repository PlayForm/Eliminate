import ts, { type SourceFile } from "typescript";

interface InlinerOptions {
	allowComplexExpressions?: boolean;

	maxInlineDepth?: number;

	inlineInFunctions?: boolean;

	excludeVariables?: string[];

	includeVariables?: string[];

	// New options
	preserveComments?: boolean;

	generateSourceMaps?: boolean;

	inlineDestructuring?: boolean;

	optimizationLevel?: "conservative" | "aggressive";

	maxExpressionSize?: number; // Limit size of inlined expressions
}

interface TransformationResult {
	code: string;

	sourceMap?: string;

	statistics: TransformationStatistics;
}

interface TransformationStatistics {
	totalVariables: number;

	inlinedVariables: number;

	skippedVariables: {
		scope: number;

		complexity: number;

		size: number;

		excluded: number;

		multiple: number;
	};

	optimizationTime: number;
}

// Expression complexity analyzer
class ExpressionAnalyzer {
	private readonly maxSize: number;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
	}

	getExpressionSize(node: ts.Expression): number {
		let size = 0;

		const visit = (node: ts.Node) => {
			size++;

			ts.forEachChild(node, visit);
		};

		visit(node);

		return size;
	}

	analyzeSideEffects(node: ts.Expression): boolean {
		const hasSideEffects = (node: ts.Node): boolean => {
			if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
				return true;
			}

			if (ts.isPropertyAccessExpression(node)) {
				// Getter might have side effects
				return true;
			}

			let result = false;

			ts.forEachChild(node, (child) =>
				hasSideEffects(child) ? (result = true) : null,
			);

			return result;
		};

		return hasSideEffects(node);
	}

	analyzeComplexity(node: ts.Expression): {
		safe: boolean;

		reason?: string;
	} {
		if (this.getExpressionSize(node) > this.maxSize) {
			return { safe: false, reason: "Expression too large" };
		}

		if (this.analyzeSideEffects(node)) {
			return { safe: false, reason: "Contains side effects" };
		}

		// Check for potential runtime errors
		const hasRuntimeRisks = (node: ts.Node): boolean => {
			if (
				ts.isPropertyAccessExpression(node) ||
				ts.isElementAccessExpression(node)
			) {
				// Could throw if accessing undefined
				return true;
			}

			if (ts.isBinaryExpression(node)) {
				// Division could throw
				if (node.operatorToken.kind === ts.SyntaxKind.SlashToken) {
					return true;
				}
			}

			let result = false;

			ts.forEachChild(node, (child) =>
				hasRuntimeRisks(child) ? (result = true) : null,
			);

			return result;
		};

		if (hasRuntimeRisks(node)) {
			return { safe: false, reason: "Potential runtime errors" };
		}

		return { safe: true };
	}
}

// Scope analyzer for handling destructuring and complex patterns
class ScopeAnalyzer {
	private readonly typeChecker: ts.TypeChecker;

	private readonly scopeMap = new Map<ts.Node, Set<ts.Symbol>>();

	constructor(typeChecker: ts.TypeChecker) {
		this.typeChecker = typeChecker;
	}

	analyzeScope(node: ts.Node) {
		if (
			ts.isSourceFile(node) ||
			ts.isBlock(node) ||
			ts.isFunctionLike(node)
		) {
			const scope = new Set<ts.Symbol>();

			this.scopeMap.set(node, scope);

			// Collect declarations in this scope
			const visitNode = (child: ts.Node) => {
				if (ts.isVariableDeclaration(child)) {
					this.collectBindings(child.name, scope);
				}

				ts.forEachChild(child, visitNode);
			};

			ts.forEachChild(node, visitNode);
		}
	}

	private collectBindings(name: ts.BindingName, scope: Set<ts.Symbol>) {
		if (ts.isIdentifier(name)) {
			const symbol = this.typeChecker.getSymbolAtLocation(name);

			if (symbol) {
				scope.add(symbol);
			}
		} else if (
			ts.isObjectBindingPattern(name) ||
			ts.isArrayBindingPattern(name)
		) {
			for (const element of name.elements) {
				if (ts.isBindingElement(element)) {
					this.collectBindings(element.name, scope);
				}
			}
		}
	}

	isInScope(symbol: ts.Symbol, node: ts.Node): boolean {
		let current: ts.Node | undefined = node;

		while (current) {
			const scope = this.scopeMap.get(current);

			if (scope?.has(symbol)) {
				return true;
			}

			current = current.parent;
		}

		return false;
	}
}

class VariableInliner {
	private readonly options: Required<InlinerOptions>;

	private readonly expressionAnalyzer: ExpressionAnalyzer;

	private readonly statistics: TransformationStatistics;

	private scopeAnalyzer!: ScopeAnalyzer;

	constructor(options: InlinerOptions = {}) {
		this.options = {
			allowComplexExpressions: false,
			maxInlineDepth: 3,
			inlineInFunctions: true,
			excludeVariables: [],
			includeVariables: [],
			preserveComments: true,
			generateSourceMaps: false,
			inlineDestructuring: true,
			optimizationLevel: "conservative",
			maxExpressionSize: 100,
			...options,
		};

		this.expressionAnalyzer = new ExpressionAnalyzer(
			this.options.maxExpressionSize,
		);

		this.statistics = {
			totalVariables: 0,
			inlinedVariables: 0,
			skippedVariables: {
				scope: 0,
				complexity: 0,
				size: 0,
				excluded: 0,
				multiple: 0,
			},
			optimizationTime: 0,
		};
	}

	private handleDestructuring(pattern: ts.BindingPattern): ts.Expression {
		if (ts.isObjectBindingPattern(pattern)) {
			const properties: ts.PropertyAssignment[] = [];

			for (const element of pattern.elements) {
				if (ts.isBindingElement(element)) {
					const propName = element.propertyName || element.name;

					if (ts.isIdentifier(propName)) {
						properties.push(
							ts.factory.createPropertyAssignment(
								propName.text,
								element.initializer ||
									ts.factory.createIdentifier(propName.text),
							),
						);
					}
				}
			}

			return ts.factory.createObjectLiteralExpression(properties);
		}

		if (ts.isArrayBindingPattern(pattern)) {
			return ts.factory.createArrayLiteralExpression(
				pattern.elements.map((element) => {
					if (ts.isBindingElement(element)) {
						return (
							element.initializer ||
							ts.factory.createIdentifier("undefined")
						);
					}

					return ts.factory.createIdentifier("undefined");
				}),
			);
		}

		throw new Error("Unsupported binding pattern type");
	}

	private shouldInlineExpression(node: ts.Expression): boolean {
		if (!this.expressionAnalyzer.analyzeComplexity(node).safe) {
			this.statistics.skippedVariables.complexity++;

			return false;
		}

		if (
			this.expressionAnalyzer.getExpressionSize(node) >
			this.options.maxExpressionSize
		) {
			this.statistics.skippedVariables.size++;

			return false;
		}

		return true;
	}

	public transform(
		sourceFile: ts.SourceFile,
		program: ts.Program,
	): TransformationResult {
		const startTime = Date.now();

		const typeChecker = program.getTypeChecker();

		this.scopeAnalyzer = new ScopeAnalyzer(typeChecker);

		// First pass: analyze scopes
		const analyzeNode = (node: ts.Node) => {
			this.scopeAnalyzer.analyzeScope(node);

			ts.forEachChild(node, analyzeNode);
		};

		analyzeNode(sourceFile);

		// Second pass: perform transformation
		const transformer = (context: ts.TransformationContext) => {
			const visit = (node: ts.Node): ts.Node => {
				if (ts.isVariableStatement(node)) {
					this.statistics.totalVariables +=
						node.declarationList.declarations.length;

					return this.transformVariableStatement(node, typeChecker);
				}

				return ts.visitEachChild(node, visit, context);
			};

			return visit;
		};

		// Generate output
		this.statistics.optimizationTime = Date.now() - startTime;

		const result: TransformationResult = {
			code: ts
				.createPrinter({
					newLine: ts.NewLineKind.LineFeed,
					removeComments: !this.options.preserveComments,
				})
				.printNode(
					ts.EmitHint.SourceFile,
					ts.transform(sourceFile, [transformer])
						.transformed[0] as SourceFile,
					sourceFile,
				),
			statistics: this.statistics,
		};

		if (this.options.generateSourceMaps) {
			// Source map generation would go here
			result.sourceMap = ""; // TODO: Implement source map generation
		}

		return result;
	}

	private transformVariableStatement(
		node: ts.VariableStatement,
		typeChecker: ts.TypeChecker,
	): ts.Node {
		const declarations = node.declarationList.declarations.filter(
			(decl) => {
				const name = decl.name;

				if (ts.isIdentifier(name)) {
					if (this.isVariableExcluded(name.text)) {
						this.statistics.skippedVariables.excluded++;

						return true;
					}

					const symbol = typeChecker.getSymbolAtLocation(name);

					if (!symbol) {
						return true;
					}

					// Check usage count
					if (this.findReferences(symbol, typeChecker).length !== 1) {
						this.statistics.skippedVariables.multiple++;

						return true;
					}

					// Check if we can inline the initializer
					if (
						decl.initializer &&
						this.shouldInlineExpression(decl.initializer)
					) {
						this.statistics.inlinedVariables++;

						return false;
					}
				} else if (
					(ts.isArrayBindingPattern(name) ||
						ts.isObjectBindingPattern(name)) &&
					this.options.inlineDestructuring
				) {
					if (!decl.initializer) {
						return true;
					}

					// Check if we can inline the destructuring pattern
					if (this.canInlineDestructuring(name, decl.initializer)) {
						try {
							// Transform the destructuring pattern and check if it's safe to inline
							if (
								this.shouldInlineExpression(
									this.handleDestructuring(name),
								)
							) {
								this.statistics.inlinedVariables++;

								return false; // Remove this declaration from the list
							}
						} catch (error) {
							// If transformation fails, keep the original declaration
							console.warn(
								"Failed to transform destructuring pattern:",
								error,
							);

							return true;
						}
					}

					this.statistics.skippedVariables.complexity++;

					return true;
				}

				return true;
			},
		);

		if (declarations.length === 0) {
			return ts.factory.createEmptyStatement();
		}

		return ts.factory.updateVariableStatement(
			node,
			node.modifiers,
			ts.factory.createVariableDeclarationList(
				declarations,
				node.declarationList.flags,
			),
		);
	}

	// Helper method to check if pattern matches initializer structure
	private validateDestructuringPattern(
		pattern: ts.BindingPattern,
		initializer: ts.Expression,
	): boolean {
		if (ts.isObjectBindingPattern(pattern)) {
			// For object patterns, check if initializer is an object literal
			// or has a type that matches the pattern
			return (
				ts.isObjectLiteralExpression(initializer) ||
				ts.isIdentifier(initializer) ||
				ts.isPropertyAccessExpression(initializer)
			);
		} else if (ts.isArrayBindingPattern(pattern)) {
			// For array patterns, check if initializer is an array literal
			// or has array-like type
			return (
				ts.isArrayLiteralExpression(initializer) ||
				ts.isIdentifier(initializer) ||
				ts.isPropertyAccessExpression(initializer) ||
				ts.isCallExpression(initializer)
			);
		}

		return false;
	}

	private canInlineDestructuring(
		pattern: ts.BindingPattern,
		initializer: ts.Expression,
	): boolean {
		// Validate basic pattern structure
		if (!this.validateDestructuringPattern(pattern, initializer)) {
			return false;
		}

		// Check if the initializer is safe to inline
		if (!this.shouldInlineExpression(initializer)) {
			return false;
		}

		// For object patterns, ensure all properties exist and are safe
		if (ts.isObjectBindingPattern(pattern)) {
			for (const element of pattern.elements) {
				if (!ts.isBindingElement(element)) continue;

				// Check default values in destructuring
				if (
					element.initializer &&
					!this.shouldInlineExpression(element.initializer)
				) {
					return false;
				}

				// Check property access is safe
				if (
					element.propertyName &&
					ts.isIdentifier(initializer) &&
					!this.isPropertyAccessSafe(initializer)
				) {
					return false;
				}
			}
		}

		// For array patterns, check spread operators and nested patterns
		if (ts.isArrayBindingPattern(pattern)) {
			for (const element of pattern.elements) {
				if (ts.isOmittedExpression(element)) continue;

				if (element.dotDotDotToken) {
					// Spread operators make inlining more complex
					return false;
				}
			}
		}

		return true;
	}

	private findReferences(
		symbol: ts.Symbol,
		typeChecker: ts.TypeChecker,
	): ts.Identifier[] {
		const references: ts.Identifier[] = [];

		const root = symbol.declarations?.[0]?.getSourceFile();

		if (!root) {
			return references;
		}

		const visit = (node: ts.Node) => {
			if (ts.isIdentifier(node)) {
				const nodeSymbol = typeChecker.getSymbolAtLocation(node);

				if (nodeSymbol === symbol) {
					references.push(node);
				}
			}

			ts.forEachChild(node, visit);
		};

		visit(root);

		return references;
	}

	private isVariableExcluded(name: string): boolean {
		if (this.options.includeVariables.length > 0) {
			return !this.options.includeVariables.includes(name);
		}

		return this.options.excludeVariables.includes(name);
	}

	// Helper to check if property access is safe
	private isPropertyAccessSafe(obj: ts.Expression): boolean {
		// This could be expanded to do more thorough analysis
		// Currently just ensures basic safety
		return !this.expressionAnalyzer.analyzeSideEffects(obj);
	}
}

// Example usage with the new features
async function optimizeTypeScriptFile(
	filePath: string,
	options: InlinerOptions = {},
): Promise<TransformationResult> {
	const program = ts.createProgram([filePath], {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.CommonJS,
	});

	const sourceFile = program.getSourceFile(filePath);

	if (!sourceFile) {
		throw new Error(`Source file '${filePath}' not found`);
	}

	return new VariableInliner(options).transform(sourceFile, program);
}

export {
	VariableInliner,
	optimizeTypeScriptFile,
	type InlinerOptions,
	type TransformationResult,
	type TransformationStatistics,
	ExpressionAnalyzer,
	ScopeAnalyzer,
};
