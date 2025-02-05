import * as ts from "typescript";

export interface Option {
	/** Preserve comments near declarations */
	Comment?: boolean;

	/** Maximum AST node count to inline */
	Max?: number;

	/** Allow inlining async expressions */
	Async?: boolean;

	/** Allow inlining variables declared with 'const' */
	Const?: boolean;

	/** Allow inlining function declarations */
	Function?: boolean;

	/** Debug mode with detailed logging */
	Debug?: boolean;
}

export default class {
	private Usage = new Map<
		ts.Symbol,
		{
			Declaration: ts.VariableDeclaration | ts.FunctionDeclaration;

			Reference: ts.Identifier[];

			Inline: boolean;

			Size: number;
		}
	>();

	private Type: ts.TypeChecker | undefined;

	private Option: Required<Option>;

	constructor(Option: Option = {}) {
		this.Option = {
			Comment: true,

			Max: 100,

			Async: false,

			Const: false,

			Function: false,

			Debug: false,

			...Option,
		};
	}

	public Transform(Program: ts.Program) {
		this.Type = Program.getTypeChecker();

		return (Context: ts.TransformationContext) =>
			(Source: ts.SourceFile) => {
				this.Collect(Source);

				return ts.visitNode(Source, (Source) =>
					this.Visit(Source, 1, Context),
				);
			};
	}

	private Collect(Source: ts.SourceFile) {
		const Collect = (Node: ts.Node) => {
			if (
				ts.isVariableDeclaration(Node) ||
				ts.isFunctionDeclaration(Node)
			) {
				const _Symbol = this.Type?.getSymbolAtLocation(Node.name!);

				if (_Symbol) {
					let Inline = true;

					let Size = 0;

					if (ts.isVariableDeclaration(Node)) {
						if (
							this.Option.Const &&
							Node.parent?.parent?.flags & ts.NodeFlags.Const
						) {
							Inline = false;
						}

						if (Node.initializer) {
							Inline = this.Inline(Node.initializer);

							Size = this.Size(Node.initializer);
						}
					} else if (ts.isFunctionDeclaration(Node)) {
						if (this.Option.Function) {
							Inline = false;
						}

						Size = this.Size(Node);
					}

					if (this.Comment(Node)) {
						Inline = false;
					}

					this.Usage.set(_Symbol, {
						Declaration: Node,

						Reference: [],

						Inline,

						Size,
					});
				}
			} else if (ts.isIdentifier(Node)) {
				const _Symbol = this.Type?.getSymbolAtLocation(Node);

				if (_Symbol && this.Usage.has(_Symbol)) {
					this.Usage.get(_Symbol)!.Reference.push(Node);
				}
			}

			ts.forEachChild(Node, Collect);
		};

		Collect(Source);
	}

	private Size(Node: ts.Node): number {
		let Size = 0;

		const Visit = (Node: ts.Node) => {
			Size++;

			ts.forEachChild(Node, Visit);
		};

		Visit(Node);

		return Size;
	}

	private Comment(Node: ts.Node): boolean {
		if (!this.Option.Comment) {
			return false;
		}

		return (
			(
				ts.getLeadingCommentRanges(
					Node.getSourceFile().text,
					Node.pos,
				) || []
			).length > 0
		);
	}

	private Visit(
		Node: ts.Node,
		Depth = 0,
		Context: ts.TransformationContext,
	): ts.Node {
		/**
		 * DEBUG
		 */
		if (this.Option.Debug) {
			for (const [_Symbol, Usage] of this.Usage) {
				console.log(`Variable: ${_Symbol.name} at Depth: ${Depth}`);

				console.log(`- Reference: ${Usage.Reference.length}`);

				console.log(`- Inline: ${Usage.Inline}`);

				console.log(`- Size: ${Usage.Size}`);

				console.log(`- Text: ${Usage.Declaration.getText()}`);
			}
		}

		/**
		 * 1. FUNCTION DECLARATIONS
		 */
		if (ts.isFunctionDeclaration(Node)) {
			// Skip inlining if the function is generic.
			if (Node.typeParameters && Node.typeParameters.length > 0) {
				return Node;
			}

			const _Symbol = this.Type?.getSymbolAtLocation(Node.name!);

			if (_Symbol) {
				const Usage = this.Usage.get(_Symbol);

				if (Usage && Usage.Inline && Usage.Reference.length === 2) {
					return undefined as unknown as ts.Statement;
				}
			}
		}

		/**
		 * 2. VARIABLE STATEMENTS
		 */
		if (ts.isVariableStatement(Node)) {
			const Declaration = Node.declarationList.declarations;

			const New = Declaration.filter((decl) => {
				const _Symbol = this.Type?.getSymbolAtLocation(decl.name);

				if (!_Symbol) {
					return true;
				}

				const Usage = this.Usage.get(_Symbol);

				if (!Usage) {
					return true;
				}

				return !(Usage.Inline && Usage.Reference.length === 2);
			});

			if (New.length === 0) {
				return undefined as unknown as ts.Statement;
			}

			if (New.length !== Declaration.length) {
				return Context.factory.updateVariableStatement(
					Node,

					Node.modifiers,

					Context.factory.createVariableDeclarationList(
						New,

						Node.declarationList.flags,
					),
				);
			}
		}

		/**
		 * 3. EXPRESSION STATEMENTS
		 */
		if (ts.isExpressionStatement(Node)) {
			return ts.visitEachChild(
				Node,
				(Child) => this.Visit(Child, Depth + 1, Context),
				Context,
			);
		}

		/**
		 * 1. Check identifiers
		 */
		if (ts.isIdentifier(Node)) {
			const _Symbol = this.Type?.getSymbolAtLocation(Node);

			if (_Symbol && this.Usage.has(_Symbol)) {
				const Usage = this.Usage.get(_Symbol)!;

				if (Usage.Inline && Usage.Reference.length === 2) {
					if (
						ts.isVariableDeclaration(Usage.Declaration) &&
						Usage.Declaration.initializer
					) {
						return this.Visit(
							ts.isBinaryExpression(
								Usage.Declaration.initializer,
							) ||
								ts.isConditionalExpression(
									Usage.Declaration.initializer,
								)
								? Context.factory.createParenthesizedExpression(
										Usage.Declaration.initializer,
									)
								: Usage.Declaration.initializer,
							Depth + 1,
							Context,
						);
					}
				}
			}
		}

		/**
		 * 2. Call expressions
		 */
		if (ts.isCallExpression(Node)) {
			const Expression = Node.expression;

			if (ts.isIdentifier(Expression)) {
				const _Symbol = this.Type?.getSymbolAtLocation(Expression);

				if (_Symbol && this.Usage.has(_Symbol)) {
					const Usage = this.Usage.get(_Symbol)!;

					if (
						ts.isFunctionDeclaration(Usage.Declaration) &&
						Usage.Declaration.typeParameters &&
						Usage.Declaration.typeParameters.length > 0
					) {
						return Node;
					}

					if (
						Usage.Inline &&
						Usage.Reference.length === 2 &&
						ts.isFunctionDeclaration(Usage.Declaration)
					) {
						return Context.factory.updateCallExpression(
							Node,
							Context.factory.createParenthesizedExpression(
								Context.factory.createArrowFunction(
									Usage.Declaration
										.modifiers as readonly ts.Modifier[],
									Usage.Declaration.typeParameters,
									Usage.Declaration.parameters,
									Usage.Declaration.type,
									undefined,
									Usage.Declaration.body!,
								),
							),
							Node.typeArguments,
							Node.arguments,
						);
					}
				}
			}
		}

		/**
		 * 3. Binary expressions
		 */
		if (ts.isBinaryExpression(Node)) {
			const Left = this.Visit(Node.left, Depth + 1, Context);

			const Right = this.Visit(Node.right, Depth + 1, Context);

			if (Left !== Node.left || Right !== Node.right) {
				return Context.factory.createParenthesizedExpression(
					Context.factory.createBinaryExpression(
						Left as ts.Expression,
						Node.operatorToken,
						Right as ts.Expression,
					),
				);
			}
		}

		return ts.visitEachChild(
			Node,
			(Node) => this.Visit(Node, Depth + 1, Context),
			Context,
		);
	}

	private Inline(Node: ts.Node): boolean {
		if (this.Size(Node) > (this.Option.Max || Infinity)) {
			return false;
		}

		// if (ts.isCallExpression(Node) || ts.isNewExpression(Node)) {
		// 	return false;
		// }

		if (this.Option.Async && ts.isAwaitExpression(Node)) {
			return false;
		}

		if (ts.isThisTypeNode(Node)) {
			return false;
		}

		if (ts.isYieldExpression(Node)) {
			return false;
		}

		if (ts.isPropertyAccessExpression(Node)) {
			const _Symbol = this.Type?.getTypeAtLocation(
				Node.expression,
			)?.getProperty(Node.name.text);

			if (_Symbol?.flags) {
				if (_Symbol?.flags & ts.SymbolFlags.Accessor) {
					return false;
				}
			}
		}

		let Valid = true;

		Node.forEachChild((Node) => {
			if (!this.Inline(Node)) {
				Valid = false;
			}
		});

		return Valid;
	}
}
