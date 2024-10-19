import * as ts from "typescript";

function eliminateSingleUseVariables(sourceCode: string): string {
	const sourceFile = ts.createSourceFile(
		"temp.ts",
		sourceCode,
		ts.ScriptTarget.Latest,
		true,
	);

	const variableUsageCount: Record<string, number> = {};
	const variableInitializers: Record<string, ts.Expression> = {};

	function visit(node: ts.Node) {
		if (ts.isVariableDeclaration(node) && node.initializer) {
			const name = node.name.getText();
			variableUsageCount[name] = 0;
			variableInitializers[name] = node.initializer;
		} else if (ts.isIdentifier(node)) {
			const name = node.getText();
			if (variableUsageCount.hasOwnProperty(name)) {
				variableUsageCount[name]++;
			}
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	function transformer<T extends ts.Node>(context: ts.TransformationContext) {
		return (rootNode: T) => {
			function visitAndTransform(node: ts.Node): ts.Node {
				if (ts.isVariableStatement(node)) {
					const declarations =
						node.declarationList.declarations.filter(
							(declaration) => {
								const name = declaration.name.getText();
								return (
									variableUsageCount[name] !== 1 ||
									ts.isExportAssignment(declaration)
								);
							},
						);

					if (declarations.length === 0) {
						return ts.createEmptyStatement();
					}

					return ts.updateVariableStatement(
						node,
						node.modifiers,
						ts.updateVariableDeclarationList(
							node.declarationList,
							declarations,
						),
					);
				} else if (ts.isIdentifier(node)) {
					const name = node.getText();
					if (
						variableUsageCount[name] === 1 &&
						variableInitializers[name]
					) {
						return variableInitializers[name];
					}
				}
				return ts.visitEachChild(node, visitAndTransform, context);
			}
			return ts.visitNode(rootNode, visitAndTransform);
		};
	}

	const result = ts.transform(sourceFile, [transformer]);
	const printer = ts.createPrinter();
	const transformedSourceFile = result.transformed[0];
	const transformedCode = printer.printFile(
		transformedSourceFile as ts.SourceFile,
	);

	return transformedCode;
}

// Example usage:
const tsCode = `
let a = 5;
let b = 10;
let c = a + b;
console.log(c);
`;

console.log(eliminateSingleUseVariables(tsCode));
