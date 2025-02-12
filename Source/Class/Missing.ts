// private Visit(
// 	Node: ts.Node,
// 	Depth = 0,
// 	Context: ts.TransformationContext,
// ): ts.Node {

// 	/**
// 	 * 3. EXPRESSION STATEMENTS
// 	 */
// 	if (ts.isExpressionStatement(Node)) {
// 		return ts.visitEachChild(
// 			Node,
// 			(Child) => this.Visit(Child, Depth + 1, Context),
// 			Context,
// 		);
// 	}

// 	/**
// 	 * 1. Check identifiers
// 	 */
// 	if (ts.isIdentifier(Node)) {
// 		const _Symbol = this.Type?.getSymbolAtLocation(Node);

// 		if (_Symbol && this.Usage.has(_Symbol)) {
// 			const Usage = this.Usage.get(_Symbol)!;

// 			if (Usage.Inline && Usage.Reference.length === 2) {
// 				if (
// 					ts.isVariableDeclaration(Usage.Declaration) &&
// 					Usage.Declaration.initializer
// 				) {
// 					return this.Visit(
// 						ts.isBinaryExpression(
// 							Usage.Declaration.initializer,
// 						) ||
// 							ts.isConditionalExpression(
// 								Usage.Declaration.initializer,
// 							)
// 							? Context.factory.createParenthesizedExpression(
// 									Usage.Declaration.initializer,
// 								)
// 							: Usage.Declaration.initializer,
// 						Depth + 1,
// 						Context,
// 					);
// 				}
// 			}
// 		}
// 	}

// 	return ts.visitEachChild(
// 		Node,
// 		(Node) => this.Visit(Node, Depth + 1, Context),
// 		Context,
// 	);
// }
