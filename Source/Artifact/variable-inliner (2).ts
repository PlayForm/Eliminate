import ts from "typescript";

interface InlinerOptions {
	// Allow inlining of complex expressions (function calls, new expressions, etc)
	allowComplexExpressions?: boolean;
	// Maximum depth for recursive inlining
	maxInlineDepth?: number;
	// Allow inlining inside functions
	inlineInFunctions?: boolean;
	// Skip variables with specific names
	excludeVariables?: string[];
	// Only inline variables with specific names
	includeVariables?: string[];
}

class VariableInliner {
	private variableUsages = new Map<
		ts.Symbol,
		{
			declaration: ts.VariableDeclaration;
			references: ts.Identifier[];
			canInline: boolean;
			scope: ts.Node;
			inlineDepth: number;
		}
	>();

	private currentScope: ts.Node | undefined;
	private inlineDepth = 0;
	private readonly options: Required<InlinerOptions>;

	constructor(options: InlinerOptions = {}) {
		this.options = {
			allowComplexExpressions: false,
			maxInlineDepth: 3,
			inlineInFunctions: true,
			excludeVariables: [],
			includeVariables: [],
			...options,
		};
	}

	private isVariableExcluded(name: string): boolean {
		if (this.options.includeVariables.length > 0) {
			return !this.options.includeVariables.includes(name);
		}
		return this.options.excludeVariables.includes(name);
	}

	private isInlinable(node: ts.Expression, depth: number = 0): boolean {
		if (depth > this.options.maxInlineDepth) {
			return false;
		}

		switch (node.kind) {
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.NumericLiteral:
			case ts.SyntaxKind.TrueKeyword:
			case ts.SyntaxKind.FalseKeyword:
			case ts.SyntaxKind.NullKeyword:
			case ts.SyntaxKind.UndefinedKeyword:
				return true;

			case ts.SyntaxKind.Identifier:
				return true;

			case ts.SyntaxKind.ParenthesizedExpression:
				return this.isInlinable(
					(node as ts.ParenthesizedExpression).expression,
					depth + 1,
				);

			case ts.SyntaxKind.BinaryExpression: {
				const binExp = node as ts.BinaryExpression;
				return (
					this.isInlinable(binExp.left, depth + 1) &&
					this.isInlinable(binExp.right, depth + 1)
				);
			}

			case ts.SyntaxKind.PropertyAccessExpression: {
				const propAccess = node as ts.PropertyAccessExpression;
				return this.isInlinable(propAccess.expression, depth + 1);
			}

			case ts.SyntaxKind.ElementAccessExpression: {
				const elemAccess = node as ts.ElementAccessExpression;
				return (
					this.isInlinable(elemAccess.expression, depth + 1) &&
					this.isInlinable(elemAccess.argumentExpression, depth + 1)
				);
			}

			case ts.SyntaxKind.ConditionalExpression: {
				const condExp = node as ts.ConditionalExpression;
				return (
					this.isInlinable(condExp.condition, depth + 1) &&
					this.isInlinable(condExp.whenTrue, depth + 1) &&
					this.isInlinable(condExp.whenFalse, depth + 1)
				);
			}

			case ts.SyntaxKind.CallExpression:
			case ts.SyntaxKind.NewExpression:
				return this.options.allowComplexExpressions;

			default:
				return false;
		}
	}

	private shouldInlineInCurrentScope(
		declaration: ts.VariableDeclaration,
		reference: ts.Identifier,
	): boolean {
		if (!this.currentScope || !declaration.parent) {
			return false;
		}

		// Check if the reference is within the same scope or a nested scope
		let referenceScope: ts.Node | undefined = reference;
		while (referenceScope && referenceScope !== this.currentScope) {
			if (
				!this.options.inlineInFunctions &&
				ts.isFunctionLike(referenceScope)
			) {
				return false;
			}
			referenceScope = referenceScope.parent;
		}

		return referenceScope === this.currentScope;
	}

	private analyzeNode(node: ts.Node, typeChecker: ts.TypeChecker): void {
		const previousScope = this.currentScope;

		if (ts.isSourceFile(node) || ts.isBlock(node)) {
			this.currentScope = node;
		}

		if (ts.isVariableDeclaration(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node.name);
			if (
				symbol &&
				node.initializer &&
				!this.isVariableExcluded(node.name.getText())
			) {
				this.variableUsages.set(symbol, {
					declaration: node,
					references: [],
					canInline: this.isInlinable(node.initializer),
					scope: this.currentScope!,
					inlineDepth: 0,
				});
			}
		}

		if (ts.isIdentifier(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node);
			if (symbol && this.variableUsages.has(symbol)) {
				const usage = this.variableUsages.get(symbol)!;
				if (this.shouldInlineInCurrentScope(usage.declaration, node)) {
					usage.references.push(node);
				}
			}
		}

		ts.forEachChild(node, (child) => this.analyzeNode(child, typeChecker));
		this.currentScope = previousScope;
	}

	private createTransformer(
		typeChecker: ts.TypeChecker,
	): ts.TransformerFactory<ts.Node> {
		return (context: ts.TransformationContext) => {
			const visit = (node: ts.Node): ts.Node => {
				if (ts.isVariableStatement(node)) {
					const declarations =
						node.declarationList.declarations.filter((decl) => {
							const symbol = typeChecker.getSymbolAtLocation(
								decl.name,
							);
							if (!symbol) return true;

							const usage = this.variableUsages.get(symbol);
							return (
								!usage ||
								usage.references.length !== 1 ||
								!usage.canInline ||
								usage.inlineDepth >= this.options.maxInlineDepth
							);
						});

					if (declarations.length === 0) {
						return ts.factory.createEmptyStatement();
					}

					if (
						declarations.length !==
						node.declarationList.declarations.length
					) {
						return ts.factory.updateVariableStatement(
							node,
							node.modifiers,
							ts.factory.createVariableDeclarationList(
								declarations,
								node.declarationList.flags,
							),
						);
					}
				}

				if (ts.isIdentifier(node)) {
					const symbol = typeChecker.getSymbolAtLocation(node);
					if (symbol) {
						const usage = this.variableUsages.get(symbol);
						if (
							usage &&
							usage.references.length === 1 &&
							usage.canInline &&
							usage.inlineDepth < this.options.maxInlineDepth
						) {
							usage.inlineDepth++;
							return usage.declaration.initializer!;
						}
					}
				}

				return ts.visitEachChild(node, visit, context);
			};

			return visit;
		};
	}

	public transform(sourceFile: ts.SourceFile, program: ts.Program): ts.Node {
		const typeChecker = program.getTypeChecker();

		// Reset state
		this.variableUsages.clear();
		this.currentScope = undefined;
		this.inlineDepth = 0;

		// Analyze the source file
		this.analyzeNode(sourceFile, typeChecker);

		// Transform the source file
		return ts.transform(sourceFile, [this.createTransformer(typeChecker)])
			.transformed[0];
	}
}

// Helper function to transform a file
function transformFile(sourceFile: string, options?: InlinerOptions) {
	const program = ts.createProgram([sourceFile], {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.CommonJS,
	});

	const sourceFileObj = program.getSourceFile(sourceFile);
	if (!sourceFileObj) {
		throw new Error(`Source file '${sourceFile}' not found`);
	}

	const inliner = new VariableInliner(options);
	const result = inliner.transform(sourceFileObj, program);

	const printer = ts.createPrinter({
		newLine: ts.NewLineKind.LineFeed,
		removeComments: false,
	});

	return printer.printNode(ts.EmitHint.SourceFile, result, sourceFileObj);
}

// Example usage with various configurations
const exampleOptions: InlinerOptions = {
	allowComplexExpressions: true,
	maxInlineDepth: 2,
	inlineInFunctions: true,
	excludeVariables: ["debug", "logger"],
	includeVariables: [],
};

export { VariableInliner, transformFile, InlinerOptions };
