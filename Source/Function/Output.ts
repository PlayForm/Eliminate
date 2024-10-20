import type {
	Expression,
	Node,
	SourceFile,
	TransformationContext,
} from "typescript";

export default (sourceCode: string) => {
	const sourceFile = ts.createSourceFile(
		"temp.ts",
		sourceCode,
		ts.ScriptTarget.Latest,
		true,
	);


	const variableUsageCount: Record<string, number> = {};

	const variableInitializers: Record<string, Expression> = {};

	const exportedVariables = new Set<string>();

	const visit = (node: Node) => {
		if (ts.isVariableDeclaration(node) && node.initializer) {
			const name = node.name.getText();

			variableUsageCount[name] = 0;

			variableInitializers[name] = node.initializer;
		} else if (ts.isIdentifier(node)) {
			const name = node.getText();

			if (typeof variableUsageCount[name] !== "undefined") {
				variableUsageCount[name]++;
			}
		} else if (ts.isExportAssignment(node) || ts.isExportSpecifier(node)) {
			exportedVariables.add(node.name?.getText() ?? "");
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);

	const transformer = <T extends Node>(context: TransformationContext) => {
		return (rootNode: T) => {
			const visitAndTransform = (node: Node): Node => {
				if (ts.isVariableStatement(node)) {
					const declarations =
						node.declarationList.declarations.filter(
							(declaration) => {
								const name = declaration.name.getText();

								return (
									variableUsageCount[name] !== 1 ||
									exportedVariables.has(name)
								);
							},
						);

					if (declarations.length === 0) {
						return ts.factory.createEmptyStatement();
					}

					return ts.factory.updateVariableStatement(
						node,
						node.modifiers,
						ts.factory.updateVariableDeclarationList(
							node.declarationList,
							declarations,
						),
					);
				} else if (ts.isIdentifier(node)) {
					const name = node.getText();

					if (
						variableUsageCount[name] === 1 &&
						variableInitializers[name] &&
						!exportedVariables.has(name)
					) {
						return variableInitializers[name];
					}
				}

				return ts.visitEachChild(node, visitAndTransform, context);
			};

			return ts.visitNode(rootNode, visitAndTransform);
		};
	};

	return ts
		.createPrinter()
		.printFile(
			ts.transform(sourceFile, [transformer])
				.transformed[0] as SourceFile,
		);
};

export const ts = await import("typescript");
