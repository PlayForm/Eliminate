import type Option from "@Interface/Output/Option.js";
import type {
	Expression,
	FunctionDeclaration,
	Identifier,
	Modifier,
	Node,
	PostfixUnaryExpression as PostfixUnaryExpressionInterface,
	PrefixUnaryExpression as PrefixUnaryExpressionInterface,
	Program,
	Statement,
	Symbol as SymbolInterface,
	SyntaxKind,
	TransformationContext,
	TypeChecker,
	VariableDeclaration,
} from "typescript";

export const {
	forEachChild,
	getLeadingCommentRanges,
	isAwaitExpression,
	isBinaryExpression,
	isCallExpression,
	isConditionalExpression,
	isFunctionDeclaration,
	isIdentifier,
	isPropertyAccessExpression,
	isThisTypeNode,
	isVariableDeclaration,
	isVariableStatement,
	isYieldExpression,
	NodeFlags,
	SymbolFlags,
	SyntaxKind: {
		AsyncKeyword,
		DefaultKeyword,
		ExportKeyword,

		PlusPlusToken,
		MinusMinusToken,
		EqualsToken,
		PlusEqualsToken,
		MinusEqualsToken,
		AsteriskEqualsToken,
		SlashEqualsToken,

		PrefixUnaryExpression,

		PostfixUnaryExpression,
	},
	visitEachChild,
	visitNode,
} = await import("typescript");

export type UsageType = {
	Declaration: VariableDeclaration | FunctionDeclaration;

	Reference: Identifier[];

	Inline: boolean;

	Size: number;

	Modified: boolean;
};

export default class {
	private Usage = new Map<SymbolInterface, UsageType>();

	private Type: TypeChecker | undefined;

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

	private _FunctionInline(Node: Node, Context: TransformationContext): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 5000) {
				console.warn(
					"Recursion depth limit reached in _FunctionInline",
				);

				return Node;
			}

			if (isFunctionDeclaration(Node)) {
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

						return undefined as unknown as Statement;
					}
				}
			}

			return visitEachChild(
				Node,
				(Child) => Visit(Child, Depth + 1),
				Context,
			);
		};

		return visitNode(Node, Visit);
	}

	private _VariableInline(Node: Node, Context: TransformationContext): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 5000) {
				console.warn(
					"Recursion depth limit reached in _VariableInline",
				);

				return Node;
			}

			if (isVariableStatement(Node)) {
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

					return undefined as unknown as Statement;
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

			return visitEachChild(
				Node,
				(Child) => Visit(Child, Depth + 1),
				Context,
			);
		};

		return visitNode(Node, Visit);
	}

	private _CallExpressionInline(
		Node: Node,
		Context: TransformationContext,
	): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 5000) {
				console.warn(
					"Recursion depth limit reached in _CallExpressionInline",
				);

				return Node;
			}

			if (isCallExpression(Node)) {
				const Expression = Node.expression;

				if (isIdentifier(Expression)) {
					const _Symbol = this.Type?.getSymbolAtLocation(Expression);

					if (_Symbol && this.Usage.has(_Symbol)) {
						// biome-ignore lint/style/noNonNullAssertion:
						const _Usage = this.Usage.get(_Symbol)!;

						if (
							isFunctionDeclaration(_Usage.Declaration) &&
							_Usage.Declaration.typeParameters &&
							_Usage.Declaration.typeParameters.length > 0
						) {
							return Node;
						}

						if (
							_Usage.Inline &&
							_Usage.Reference.length === 2 &&
							isFunctionDeclaration(_Usage.Declaration)
						) {
							this.Change = true;

							return Context.factory.updateCallExpression(
								Node,
								Context.factory.createParenthesizedExpression(
									Context.factory.createArrowFunction(
										_Usage.Declaration
											.modifiers as readonly Modifier[],
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

			return visitEachChild(
				Node,
				(Child) => Visit(Child, Depth + 1),
				Context,
			);
		};

		return visitNode(Node, Visit);
	}

	private _BinaryExpressionInline(
		Node: Node,
		Context: TransformationContext,
	): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 5000) {
				console.warn(
					"Recursion depth limit reached in _BinaryExpressionInline",
				);

				return Node;
			}

			if (isBinaryExpression(Node)) {
				const Left = visitNode(Node.left, Visit);

				const Right = visitNode(Node.right, Visit);

				if (Left !== Node.left || Right !== Node.right) {
					this.Change = true;

					return Context.factory.createParenthesizedExpression(
						Context.factory.createBinaryExpression(
							Left as Expression,
							Node.operatorToken,
							Right as Expression,
						),
					);
				}
			}

			return visitEachChild(
				Node,
				(Child) => Visit(Child, Depth + 1),
				Context,
			);
		};

		return visitNode(Node, Visit);
	}

	private _ExpressionInline(
		Node: Node,
		Context: TransformationContext,
	): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 5000) {
				console.warn(
					"Recursion depth limit reached in _ExpressionInline",
				);

				return Node;
			}

			if (isIdentifier(Node)) {
				if (
					(isVariableDeclaration(Node.parent) &&
						Node.parent.name === Node) ||
					(isFunctionDeclaration(Node.parent) &&
						Node.parent.name === Node)
				) {
					return Node;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node);

				const _Usage = _Symbol && this.Usage.get(_Symbol);

				if (
					_Usage?.Inline &&
					!_Usage.Modified &&
					_Usage.Reference.length === 2 &&
					isVariableDeclaration(_Usage.Declaration) &&
					_Usage.Declaration.initializer
				) {
					const Initializer = this.Iterative(
						_Usage.Declaration.initializer,
						Context,
					);

					this.Change = true;

					return isBinaryExpression(Initializer) ||
						isConditionalExpression(Initializer)
						? Context.factory.createParenthesizedExpression(
								Initializer,
							)
						: Initializer;
				}
			}

			return visitEachChild(
				Node,
				(Child) => Visit(Child, Depth + 1),
				Context,
			);
		};

		return visitNode(Node, Visit);
	}

	private Iterative(Node: Node, Context: TransformationContext): Node {
		/**
		 * DEBUG
		 */
		if (this.Option.Debug) {
			for (const [_Symbol, Usage] of this.Usage) {
				console.log(`Variable: ${_Symbol.name}`);

				console.log(`- Reference: ${Usage.Reference.length}`);

				console.log(`- Inline: ${Usage.Inline}`);

				console.log(`- Size: ${Usage.Size}`);

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
			console.warn(
				"Potential infinite loop detected in AST transformations!",
			);
		}

		return Transform;
	}

	public Transform(
		Program: Program,
	): (Context: TransformationContext) => (Node: Node) => Node {
		this.Type = Program.getTypeChecker();

		return (Context: TransformationContext) =>
			(Node: Node): Node => {
				this.Collect(Node);

				return this.Iterative(Node, Context);
			};
	}

	private Collect(Source: Node): void {
		const CallGraph = new Map<SymbolInterface, Set<SymbolInterface>>();

		const Collect = (Node: Node): void => {
			if (isVariableDeclaration(Node) || isFunctionDeclaration(Node)) {
				if (!Node.name) {
					return;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node.name);

				if (_Symbol) {
					let Inline = true;

					let Size = 0;

					if (isVariableDeclaration(Node)) {
						if (
							this.Option.Const &&
							Node.parent?.parent?.flags & NodeFlags.Const
						) {
							Inline = false;
						}

						const Statement = Node.parent.parent;

						if (
							isVariableStatement(Statement) &&
							Statement.modifiers &&
							Statement.modifiers.some(
								({ kind }) =>
									kind === ExportKeyword ||
									kind === DefaultKeyword,
							)
						) {
							Inline = false;
						}

						if (Node.initializer) {
							Inline = Inline && this.Inline(Node.initializer);

							Size = this.Size(Node.initializer);
						}
					} else if (isFunctionDeclaration(Node)) {
						if (this.Option.Function) {
							Inline = false;
						}

						if (
							Node.modifiers?.some(
								({ kind }) =>
									kind === ExportKeyword ||
									kind === DefaultKeyword ||
									(this.Option.Async &&
										kind === AsyncKeyword),
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

						Modified: false,
					});
				}
			} else if (isIdentifier(Node)) {
				const _Symbol = this.Type?.getSymbolAtLocation(Node);

				if (_Symbol && this.Usage.has(_Symbol)) {
					const Usage = this.Usage.get(_Symbol);

					Usage?.Reference.push(Node);

					if (Usage && this.Modification(Node)) {
						Usage.Modified = true;
					}
				}
			}

			forEachChild(Node, Collect);
		};

		Collect(Source);
	}

	private Modification(Node: Identifier): boolean {
		const Parent = Node.parent;

		if (
			this.isPostfixUnaryExpression(
				Parent as PostfixUnaryExpressionInterface,
			)
		) {
			const Expression = Parent as PostfixUnaryExpressionInterface;

			if (
				Expression.operator === PlusPlusToken ||
				Expression.operator === MinusMinusToken
			) {
				// e.g., i++ or i--
				return true;
			}
		}

		if (
			this.isPrefixUnaryExpression(
				Parent as PrefixUnaryExpressionInterface,
			)
		) {
			const Expression = Parent as PrefixUnaryExpressionInterface;

			if (
				Expression.operator === PlusPlusToken ||
				Expression.operator === MinusMinusToken
			) {
				// e.g., ++i or --i
				return true;
			}
		}

		if (
			isBinaryExpression(Parent) &&
			Parent.left === Node &&
			this.Operator(Parent.operatorToken.kind)
		) {
			// e.g., i = ..., i += ..., etc.
			return true;
		}

		return false;
	}

	private isPostfixUnaryExpression({
		kind,
		operator,
	}: Node & PostfixUnaryExpressionInterface): boolean {
		if (kind === PostfixUnaryExpression) {
			return operator === PlusPlusToken || operator === MinusMinusToken;
		}

		return false;
	}

	private isPrefixUnaryExpression({
		kind,
		operator,
	}: Node & PrefixUnaryExpressionInterface): boolean {
		if (kind === PrefixUnaryExpression) {
			return operator === PlusPlusToken || operator === MinusMinusToken;
		}

		return false;
	}

	private Operator(kind: SyntaxKind): boolean {
		return [
			EqualsToken,
			PlusEqualsToken,
			MinusEqualsToken,
			AsteriskEqualsToken,
			SlashEqualsToken,
			// ... other assignment operators ...
		].includes(kind);
	}

	private Size(Node: Node): number {
		let Size = 0;

		const Visit = (Node: Node): void => {
			Size++;

			forEachChild(Node, Visit);
		};

		Visit(Node);

		return Size;
	}

	private Comment(Node: Node): boolean {
		if (!this.Option.Comment) {
			return false;
		}

		return (
			(getLeadingCommentRanges(Node.getSourceFile().text, Node.pos) || [])
				.length > 0
		);
	}

	private Inline(Node: Node): boolean {
		if (this.Size(Node) > (this.Option.Max || Number.POSITIVE_INFINITY)) {
			return false;
		}

		if (this.Option.Async && isAwaitExpression(Node)) {
			return false;
		}

		if (isThisTypeNode(Node)) {
			return false;
		}

		if (isYieldExpression(Node)) {
			return false;
		}

		if (isPropertyAccessExpression(Node)) {
			const _Symbol = this.Type?.getTypeAtLocation(
				Node.expression,
			)?.getProperty(Node.name.text);

			if (_Symbol?.flags && _Symbol?.flags & SymbolFlags.Accessor) {
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
