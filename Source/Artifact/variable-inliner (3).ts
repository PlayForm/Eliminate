import ts from "typescript";

function createVariableInliner() {
	// Track variable declarations and their usage count
	const variableUsages = new Map<
		ts.Symbol,
		{
			declaration: ts.VariableDeclaration;
			references: ts.Identifier[];
			canInline: boolean;
		}
	>();

	function visitNode(
		node: ts.Node,
		program: ts.Program,
		typeChecker: ts.TypeChecker,
	): ts.Node {
		// Track variable declarations
		if (ts.isVariableDeclaration(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node.name);
			if (symbol && node.initializer) {
				variableUsages.set(symbol, {
					declaration: node,
					references: [],
					canInline: isInlinable(node.initializer),
				});
			}
		}

		// Track variable references
		if (ts.isIdentifier(node)) {
			const symbol = typeChecker.getSymbolAtLocation(node);
			if (symbol && variableUsages.has(symbol)) {
				const usage = variableUsages.get(symbol)!;
				usage.references.push(node);
			}
		}

		return ts.visitEachChild(
			node,
			(child) => visitNode(child, program, typeChecker),
			context,
		);
	}

	function isInlinable(node: ts.Expression): boolean {
		// Determine if an expression can be safely inlined
		switch (node.kind) {
			case ts.SyntaxKind.StringLiteral:
			case ts.SyntaxKind.NumericLiteral:
			case ts.SyntaxKind.TrueKeyword:
			case ts.SyntaxKind.FalseKeyword:
			case ts.SyntaxKind.NullKeyword:
			case ts.SyntaxKind.Identifier:
				return true;
			case ts.SyntaxKind.ParenthesizedExpression:
				return isInlinable(
					(node as ts.ParenthesizedExpression).expression,
				);
			case ts.SyntaxKind.BinaryExpression: {
				const binExp = node as ts.BinaryExpression;
				return isInlinable(binExp.left) && isInlinable(binExp.right);
			}
			default:
				return false;
		}
	}

	function inlineVariables(
		node: ts.Node,
		program: ts.Program,
		typeChecker: ts.TypeChecker,
	): ts.Node {
		// First pass: collect usage information
		visitNode(node, program, typeChecker);

		// Second pass: perform inlining
		const transformer = (context: ts.TransformationContext) => {
			const visit = (node: ts.Node): ts.Node => {
				// Handle variable declarations
				if (ts.isVariableStatement(node)) {
					const declarations =
						node.declarationList.declarations.filter((decl) => {
							const symbol = typeChecker.getSymbolAtLocation(
								decl.name,
							);
							if (!symbol) return true;

							const usage = variableUsages.get(symbol);
							return (
								!usage ||
								usage.references.length !== 1 ||
								!usage.canInline
							);
						});

					if (declarations.length === 0) {
						return ts.createEmptyStatement();
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

				// Handle variable references
				if (ts.isIdentifier(node)) {
					const symbol = typeChecker.getSymbolAtLocation(node);
					if (symbol) {
						const usage = variableUsages.get(symbol);
						if (
							usage &&
							usage.references.length === 1 &&
							usage.canInline
						) {
							return usage.declaration.initializer!;
						}
					}
				}

				return ts.visitEachChild(node, visit, context);
			};

			return visit;
		};

		return ts.transform(node, [transformer]).transformed[0];
	}

	return {
		inlineVariables,
	};
}

// Example usage
function transformFile(File: string) {
	const program = ts.createProgram([File], {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.CommonJS,
	});

	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(File);

	if (!sourceFile) {
		throw new Error("Source file not found");
	}

	const inliner = createVariableInliner();
	const result = inliner.inlineVariables(sourceFile, program, checker);

	const printer = ts.createPrinter();
	return printer.printNode(ts.EmitHint.SourceFile, result, sourceFile);
}

export { createVariableInliner, transformFile };
