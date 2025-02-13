import type Option from "@Interface/Output/Option.js";
import ts from "typescript";

export type UsageType = {
	Declaration: ts.VariableDeclaration | ts.FunctionDeclaration;

	Reference: ts.Identifier[];

	Inline: boolean;

	Size: number;
};

export default class {
	private Usage = new Map<ts.Symbol, UsageType>();

	private Type: ts.TypeChecker | undefined;

	private Option: Required<Option>;

	private Change = false;

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

	private _FunctionInline(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		const Visit = (Node: ts.Node): ts.Node => {
			if (ts.isFunctionDeclaration(Node)) {
				if (Node.typeParameters && Node.typeParameters.length > 0) {
					return Node;
				}

				if (!Node.name) {
					return Node;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node.name);

				if (_Symbol) {
					const _Usage = this.Usage.get(_Symbol);

					if (_Usage?.Inline && _Usage.Reference.length === 2) {
						this.Change = true;

						return undefined as unknown as ts.Statement;
					}
				}
			}

			return ts.visitEachChild(Node, Visit, Context);
		};

		return ts.visitNode(Node, Visit);
	}

	private _VariableInline(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		const Visit = (Node: ts.Node): ts.Node => {
			if (ts.isVariableStatement(Node)) {
				const Declaration = Node.declarationList.declarations;

				const New = Declaration.filter((Declaration) => {
					const _Symbol = this.Type?.getSymbolAtLocation(
						Declaration.name,
					);

					if (!_Symbol) {
						return true;
					}

					const _Usage = this.Usage.get(_Symbol);

					if (!_Usage) {
						return true;
					}

					return !(_Usage.Inline && _Usage.Reference.length === 2);
				});

				if (New.length === 0) {
					this.Change = true;

					return undefined as unknown as ts.Statement;
				}

				if (New.length !== Declaration.length) {
					this.Change = true;

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

			return ts.visitEachChild(Node, Visit, Context);
		};

		return ts.visitNode(Node, Visit);
	}

	private _CallExpressionInline(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		const Visit = (Node: ts.Node): ts.Node => {
			if (ts.isCallExpression(Node)) {
				const Expression = Node.expression;

				if (ts.isIdentifier(Expression)) {
					const _Symbol = this.Type?.getSymbolAtLocation(Expression);

					if (_Symbol && this.Usage.has(_Symbol)) {
						// biome-ignore lint/style/noNonNullAssertion:
						const _Usage = this.Usage.get(_Symbol)!;

						if (
							ts.isFunctionDeclaration(_Usage.Declaration) &&
							_Usage.Declaration.typeParameters &&
							_Usage.Declaration.typeParameters.length > 0
						) {
							return Node;
						}

						if (
							_Usage.Inline &&
							_Usage.Reference.length === 2 &&
							ts.isFunctionDeclaration(_Usage.Declaration)
						) {
							this.Change = true;

							return Context.factory.updateCallExpression(
								Node,
								Context.factory.createParenthesizedExpression(
									Context.factory.createArrowFunction(
										_Usage.Declaration
											.modifiers as readonly ts.Modifier[],
										_Usage.Declaration.typeParameters,
										_Usage.Declaration.parameters,
										_Usage.Declaration.type,
										undefined,
										// biome-ignore lint/style/noNonNullAssertion:
										_Usage.Declaration.body!,
									),
								),
								Node.typeArguments,
								Node.arguments,
							);
						}
					}
				}
			}

			return ts.visitEachChild(Node, Visit, Context);
		};

		return ts.visitNode(Node, Visit);
	}

	private _BinaryExpressionInline(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		const Visit = (Node: ts.Node): ts.Node => {
			if (ts.isBinaryExpression(Node)) {
				const Left = ts.visitNode(Node.left, Visit);

				const Right = ts.visitNode(Node.right, Visit);

				if (Left !== Node.left || Right !== Node.right) {
					this.Change = true;

					return Context.factory.createParenthesizedExpression(
						Context.factory.createBinaryExpression(
							Left as ts.Expression,
							Node.operatorToken,
							Right as ts.Expression,
						),
					);
				}
			}

			return ts.visitEachChild(Node, Visit, Context);
		};

		return ts.visitNode(Node, Visit);
	}

	private _ExpressionInline(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		const Visit = (Node: ts.Node): ts.Node => {
			if (ts.isIdentifier(Node)) {
				if (
					(ts.isVariableDeclaration(Node.parent) &&
						Node.parent.name === Node) ||
					(ts.isFunctionDeclaration(Node.parent) &&
						Node.parent.name === Node)
				) {
					return Node;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node);

				const _Usage = _Symbol && this.Usage.get(_Symbol);

				if (
					_Usage?.Inline &&
					_Usage.Reference.length === 2 &&
					ts.isVariableDeclaration(_Usage.Declaration) &&
					_Usage.Declaration.initializer
				) {
					const Initializer = this.Iterative(
						_Usage.Declaration.initializer,
						Context,
					);

					this.Change = true;

					return ts.isBinaryExpression(Initializer) ||
						ts.isConditionalExpression(Initializer)
						? Context.factory.createParenthesizedExpression(
								Initializer,
							)
						: Initializer;
				}
			}

			return ts.visitEachChild(Node, Visit, Context);
		};

		return ts.visitNode(Node, Visit);
	}

	private Iterative(
		Node: ts.Node,
		Context: ts.TransformationContext,
	): ts.Node {
		/**
		 * DEBUG
		 */
		if (this.Option.Debug) {
			for (const [_Symbol, Usage] of this.Usage) {
				// biome-ignore lint/suspicious/noConsole:
				console.log(`Variable: ${_Symbol.name}`);

				// biome-ignore lint/suspicious/noConsole:
				console.log(`- Reference: ${Usage.Reference.length}`);

				// biome-ignore lint/suspicious/noConsole:
				console.log(`- Inline: ${Usage.Inline}`);

				// biome-ignore lint/suspicious/noConsole:
				console.log(`- Size: ${Usage.Size}`);

				// biome-ignore lint/suspicious/noConsole:
				console.log(`- Text: ${Usage.Declaration.getText()}`);
			}
		}

		let Transform = Node;

		let Iteration = 0;

		do {
			this.Change = false;

			// Pass 1: Inline functions
			Transform = this._FunctionInline(Transform, Context);

			// Pass 2: Inline variables
			Transform = this._VariableInline(Transform, Context);

			// Pass 3: Inline call expressions
			Transform = this._CallExpressionInline(Transform, Context);

			// Pass 4: Inline binary expressions
			Transform = this._BinaryExpressionInline(Transform, Context);

			// Pass 5: Inline expressions
			Transform = this._ExpressionInline(Transform, Context);

			Iteration++;
		} while (this.Change && Iteration < 100);

		if (Iteration >= 100) {
			// biome-ignore lint/suspicious/noConsole:
			console.warn(
				"Potential infinite loop detected in AST transformations!",
			);
		}

		return Transform;
	}

	// biome-ignore lint/nursery/useConsistentMemberAccessibility:
	public Transform(
		Program: ts.Program,
	): (Context: ts.TransformationContext) => (Node: ts.Node) => ts.Node {
		this.Type = Program.getTypeChecker();

		return (Context: ts.TransformationContext) =>
			(Node: ts.Node): ts.Node => {
				this.Collect(Node);

				return this.Iterative(Node, Context);
			};
	}

	private Collect(Source: ts.Node): void {
		const Collect = (Node: ts.Node): void => {
			if (
				ts.isVariableDeclaration(Node) ||
				ts.isFunctionDeclaration(Node)
			) {
				if (!Node.name) {
					return;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node.name);

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

						const Statement = Node.parent.parent;

						if (
							ts.isVariableStatement(Statement) &&
							Statement.modifiers &&
							Statement.modifiers.some(
								(Modifier) =>
									Modifier.kind ===
										ts.SyntaxKind.ExportKeyword ||
									Modifier.kind ===
										ts.SyntaxKind.DefaultKeyword,
							)
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

						if (
							Node.modifiers?.some(
								(Modifier) =>
									Modifier.kind ===
										ts.SyntaxKind.ExportKeyword ||
									Modifier.kind ===
										ts.SyntaxKind.DefaultKeyword,
							)
						) {
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
					this.Usage.get(_Symbol)?.Reference.push(Node);
				}
			}

			ts.forEachChild(Node, Collect);
		};

		Collect(Source);
	}

	private Size(Node: ts.Node): number {
		let Size = 0;

		const Visit = (Node: ts.Node): void => {
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

	private Inline(Node: ts.Node): boolean {
		if (this.Size(Node) > (this.Option.Max || Number.POSITIVE_INFINITY)) {
			return false;
		}

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

			if (_Symbol?.flags && _Symbol?.flags & ts.SymbolFlags.Accessor) {
				return false;
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
