import type Option from "@Interface/Output/Option.js";
import type {
	Expression,
	FunctionDeclaration,
	Identifier,
	Modifier,
	Node,
	ParenthesizedExpression,
	PostfixUnaryExpression as PostfixUnaryExpressionInterface,
	PrefixUnaryExpression as PrefixUnaryExpressionInterface,
	Program,
	Statement,
	Symbol as SymbolInterface,
	SyntaxKind as SyntaxKindType,
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
		AmpersandAmpersandEqualsToken,

		AmpersandEqualsToken,

		ArrayLiteralExpression,

		ArrowFunction,

		AsteriskEqualsToken,

		AsyncKeyword,

		BarBarEqualsToken,

		BarEqualsToken,

		BinaryExpression,

		CallExpression,

		CaretEqualsToken,

		ConditionalExpression,

		AwaitExpression,

		TemplateExpression,

		DefaultKeyword,

		EqualsToken,

		ExportKeyword,

		FalseKeyword,

		FunctionExpression,

		GreaterThanGreaterThanEqualsToken,

		GreaterThanGreaterThanGreaterThanEqualsToken,

		Identifier: IdentifierKind,

		LessThanLessThanEqualsToken,

		MinusEqualsToken,

		MinusMinusToken,

		NewExpression,

		NullKeyword,

		NumericLiteral,

		ObjectLiteralExpression,

		PercentEqualsToken,

		PlusEqualsToken,

		PlusPlusToken,

		PostfixUnaryExpression,

		PrefixUnaryExpression,

		PropertyAccessExpression,

		QuestionQuestionEqualsToken,

		RegularExpressionLiteral,

		SlashEqualsToken,

		StringLiteral,

		TrueKeyword,

		UndefinedKeyword,
		BigIntLiteral,
	},

	visitEachChild,

	visitNode,

	isArrowFunction,

	isBlock,
} = await import("typescript");

export const { SyntaxKind } = await import("typescript");

export type UsageType = {
	Declaration: VariableDeclaration | FunctionDeclaration;

	Reference: Identifier[];

	Inline: boolean;

	Size: number;

	Modified: boolean;

	Call: Set<SymbolInterface>;
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

	private Await(Node: Node): boolean {
		let True = false;

		const Visit = (Node: Node): void => {
			if (isAwaitExpression(Node)) {
				True = true;

				return;
			}

			Node.forEachChild(Visit);
		};

		Visit(Node);

		return True;
	}

	private Cycle(
		Graph: Map<SymbolInterface, Set<SymbolInterface>>,
	): Set<SymbolInterface>[] {
		const Visited = new Set<SymbolInterface>();

		const Stack = new Set<SymbolInterface>();

		const Cycle: Set<SymbolInterface>[] = [];

		const Search = (
			Node: SymbolInterface,

			Path: SymbolInterface[],
		): void => {
			if (Stack.has(Node)) {
				Cycle.push(new Set(Path.slice(Path.indexOf(Node))));

				return;
			}

			if (Visited.has(Node)) {
				return;
			}

			Visited.add(Node);

			Stack.add(Node);

			for (const Neighbor of Graph.get(Node) || new Set()) {
				Search(Neighbor, [...Path, Neighbor]);
			}

			Stack.delete(Node);
		};

		for (const Node of Graph.keys()) {
			if (!Visited.has(Node)) {
				Search(Node, [Node]);
			}
		}

		return Cycle;
	}

	private Call(Node: Node, Call: Set<SymbolInterface>): void {
		if (isCallExpression(Node) && isIdentifier(Node.expression)) {
			const Called = this.Type?.getSymbolAtLocation(Node.expression);

			if (Called) {
				Call.add(Called);
			}
		}

		Node.forEachChild((Child) => this.Call(Child, Call));
	}

	private Modification(Node: Identifier): boolean {
		const Parent = Node.parent;

		if (this.Postfix(Parent as PostfixUnaryExpressionInterface)) {
			const Expression = Parent as PostfixUnaryExpressionInterface;

			if (
				Expression.operator === PlusPlusToken ||
				Expression.operator === MinusMinusToken
			) {
				return true;
			}
		}

		if (this.Prefix(Parent as PrefixUnaryExpressionInterface)) {
			const Expression = Parent as PrefixUnaryExpressionInterface;

			if (
				Expression.operator === PlusPlusToken ||
				Expression.operator === MinusMinusToken
			) {
				return true;
			}
		}

		if (
			isBinaryExpression(Parent) &&
			Parent.left === Node &&
			this.Operator(Parent.operatorToken.kind)
		) {
			return true;
		}

		return false;
	}

	private Postfix({
		kind,

		operator,
	}: Node & PostfixUnaryExpressionInterface): boolean {
		if (kind === PostfixUnaryExpression) {
			return operator === PlusPlusToken || operator === MinusMinusToken;
		}

		return false;
	}

	private Prefix({
		kind,

		operator,
	}: Node & PrefixUnaryExpressionInterface): boolean {
		if (kind === PrefixUnaryExpression) {
			return operator === PlusPlusToken || operator === MinusMinusToken;
		}

		return false;
	}

	private Operator(kind: SyntaxKindType): boolean {
		return [
			AmpersandAmpersandEqualsToken,

			AmpersandEqualsToken,

			AsteriskEqualsToken,

			BarBarEqualsToken,

			BarEqualsToken,

			CaretEqualsToken,

			EqualsToken,

			GreaterThanGreaterThanEqualsToken,

			GreaterThanGreaterThanGreaterThanEqualsToken,

			LessThanLessThanEqualsToken,

			MinusEqualsToken,

			PercentEqualsToken,

			PlusEqualsToken,

			QuestionQuestionEqualsToken,

			SlashEqualsToken,
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

	private Safe(Node: Expression | undefined): boolean {
		if (
			// No initializer is not safe to substitute
			!Node
		) {
			return false;
		}

		switch (Node.kind) {
			case StringLiteral:

			case NumericLiteral:

			case TrueKeyword:

			case FalseKeyword:

			case NullKeyword:

			case UndefinedKeyword:

			case BigIntLiteral:

			case RegularExpressionLiteral:

			case ArrayLiteralExpression:

			case ObjectLiteralExpression:

			case FunctionExpression:

			case ArrowFunction:

			case CallExpression:

			case NewExpression:

			case IdentifierKind:

			case PropertyAccessExpression:

			case BinaryExpression:

			case ConditionalExpression:

			case AwaitExpression:

			case TemplateExpression:
				return true;

			default:
				if (this.Option.Debug) {
					console.log(
						`[Safe] Unhandled kind: ${SyntaxKind[Node.kind]} - Assuming unsafe`,
					);
				}

				return false;
		}
	}

	private _FunctionInline(Node: Node, Context: TransformationContext): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 100) {
				console.log("Recursion depth limit reached in _FunctionInline");

				return Node;
			}

			if (isFunctionDeclaration(Node)) {
				if (
					!Node.name ||
					(Node.typeParameters && Node.typeParameters.length > 0)
				) {
					return Node;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node.name);

				if (_Symbol) {
					const _Usage = this.Usage.get(_Symbol);

					if (_Usage?.Inline && _Usage.Reference.length === 1) {
						if (this.Option.Debug) {
							console.log(
								`[FuncInline] Removing declaration: ${_Symbol.name}`,
							);
						}

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
			if (Depth > 100) {
				console.log("Recursion depth limit reached in _VariableInline");

				return Node;
			}

			if (isVariableStatement(Node)) {
				const Declaration = Node.declarationList.declarations;

				const New = Declaration.filter((Declaration) => {
					if (!isIdentifier(Declaration.name)) {
						return true;
					}

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

					const Safe =
						isVariableDeclaration(_Usage.Declaration) &&
						this.Safe(_Usage.Declaration.initializer);

					const Remove =
						_Usage.Inline && _Usage.Reference.length === 1 && Safe;

					if (Remove && this.Option.Debug) {
						console.log(
							`[VarInline] Removing declaration: ${_Symbol.name}`,
						);
					} else if (
						_Usage.Inline &&
						_Usage.Reference.length === 1 &&
						!Safe &&
						this.Option.Debug
					) {
						console.log(
							`[VarInline] Keeping declaration ${
								_Symbol.name
							} because initializer kind ${
								SyntaxKind[_Usage.Declaration.kind]
							} is unsafe.`,
						);
					}

					return !Remove;
				});

				if (New.length < Declaration.length) {
					this.Change = true;

					if (New.length === 0) {
						return undefined as unknown as Statement;
					} else {
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

				return Node;
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
			if (Depth > 100) {
				console.log(
					"Recursion depth limit reached in _CallExpressionInline",
				);

				return Node;
			}

			if (isCallExpression(Node)) {
				const Expression = Node.expression;

				if (isIdentifier(Expression)) {
					const _Symbol = this.Type?.getSymbolAtLocation(Expression);

					if (_Symbol && this.Usage.has(_Symbol)) {
						const _Usage = this.Usage.get(_Symbol)!;

						if (
							!isFunctionDeclaration(_Usage.Declaration) ||
							(_Usage.Declaration.typeParameters &&
								_Usage.Declaration.typeParameters.length > 0)
						) {
							return Node;
						}

						if (_Usage.Inline && _Usage.Reference.length === 1) {
							if (this.Option.Debug) {
								console.log(
									`[CallInline] Inlining call to: ${_Symbol.name}`,
								);
							}

							if (!_Usage.Declaration.body) {
								if (this.Option.Debug) {
									console.log(
										`[CallInline] Warning: Inlineable function ${_Symbol.name} has no body.`,
									);
								}

								return Node;
							}

							this.Change = true;

							return Context.factory.updateCallExpression(
								Node,

								Context.factory.createParenthesizedExpression(
									Context.factory.createArrowFunction(
										_Usage.Declaration.modifiers as
											| readonly Modifier[]
											| undefined,

										_Usage.Declaration.typeParameters,

										_Usage.Declaration.parameters,

										_Usage.Declaration.type,

										undefined,

										_Usage.Declaration.body,
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
			if (Depth > 100) {
				console.log(
					"Recursion depth limit reached in _BinaryExpressionInline",
				);

				return Node;
			}

			if (Node.kind === SyntaxKind.ParenthesizedExpression) {
				const Inner = (Node as ParenthesizedExpression).expression;

				const InnerVisited = Visit(Inner, Depth + 1);

				if (InnerVisited !== Inner) {
					this.Change = true;

					return Context.factory.updateParenthesizedExpression(
						Node as ParenthesizedExpression,
						InnerVisited as Expression,
					);
				}

				return Node;
			}

			const Visited = visitEachChild(
				Node,

				(Child) => Visit(Child, Depth + 1),

				Context,
			);

			if (isBinaryExpression(Visited)) {
				const LeftNeed =
					isBinaryExpression(Visited.left) ||
					isConditionalExpression(Visited.left);

				const RightNeed =
					isBinaryExpression(Visited.right) ||
					isConditionalExpression(Visited.right);

				if (LeftNeed || RightNeed) {
					if (this.Option.Debug) {
						console.log(
							`[BinaryInline] Adding parens around: ${Visited.getText()}`,
						);
					}

					this.Change = true;

					return Context.factory.createParenthesizedExpression(
						Visited,
					);
				}
			}

			return Visited;
		};

		return Visit(Node, 0);
	}

	private _ExpressionInline(
		Node: Node,

		Context: TransformationContext,
	): Node {
		const Visit = (Node: Node, Depth = 0): Node => {
			if (Depth > 100) {
				console.log(
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
					_Usage.Reference.length === 1 &&
					isVariableDeclaration(_Usage.Declaration) &&
					_Usage.Declaration.initializer &&
					this.Safe(_Usage.Declaration.initializer)
				) {
					if (this.Option.Debug) {
						console.log(
							`[ExprInline] Inlining identifier: ${_Symbol?.name}`,
						);
					}

					const Initializer = this.Iterative(
						_Usage.Declaration.initializer,

						Context,
					);

					this.Change = true;

					if (this.Await(Initializer)) {
						let Parent = Node.parent;

						while (Parent) {
							if (isArrowFunction(Parent)) {
								if (
									!Parent.modifiers?.some(
										({ kind }) => kind === AsyncKeyword,
									) &&
									Parent.parameters.every((Declaration) =>
										isIdentifier(Declaration.name),
									)
								) {
									return Context.factory.createCallExpression(
										Context.factory.createParenthesizedExpression(
											Context.factory.createArrowFunction(
												[
													Context.factory.createModifier(
														AsyncKeyword,
													),
												],

												Parent.typeParameters,

												Parent.parameters,

												Parent.type,

												Parent.equalsGreaterThanToken,

												isBlock(Initializer)
													? Initializer
													: Context.factory.createBlock(
															[
																Context.factory.createReturnStatement(
																	Initializer as Expression,
																),
															],
														),
											),
										),

										undefined,

										Parent.parameters.map(
											(Declaration) =>
												Declaration.name as Identifier,
										),
									);
								}

								break;
							}

							Parent = Parent.parent;
						}
					}

					return isBinaryExpression(Initializer) ||
						isConditionalExpression(Initializer)
						? Context.factory.createParenthesizedExpression(
								Initializer,
							)
						: Initializer;
				} else if (
					_Usage?.Inline &&
					!_Usage.Modified &&
					_Usage.Reference.length === 1 &&
					isVariableDeclaration(_Usage.Declaration) &&
					_Usage.Declaration.initializer &&
					this.Option.Debug
				) {
					if (!this.Safe(_Usage.Declaration.initializer)) {
						console.log(
							`[ExprInline] Skipping unsafe initializer inline for: ${
								_Symbol?.name
							} (Kind: ${SyntaxKind[_Usage.Declaration.initializer.kind]})`,
						);
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

	private Iterative(Node: Node, Context: TransformationContext): Node {
		let Transform = Node;

		let Iteration = 0;

		const MaxIterations = 100;

		do {
			this.Change = false;

			if (this.Option.Debug) {
				console.log(`[Iterative] --- Iteration ${Iteration + 1} ---`);
			}

			// Pass 1: Inline functions
			Transform = this._FunctionInline(Transform, Context);

			// Pass 2: Inline variables
			Transform = this._VariableInline(Transform, Context);

			// Pass 3: Inline call expressions
			Transform = this._CallExpressionInline(Transform, Context);

			// Pass 4: Inline expressions
			Transform = this._ExpressionInline(Transform, Context);

			// Pass 5: Inline binary expressions
			Transform = this._BinaryExpressionInline(Transform, Context);

			Iteration++;

			if (this.Option.Debug) {
				console.log(
					`[Iterative] Changed in iteration ${Iteration}: ${this.Change}`,
				);
			}
		} while (this.Change && Iteration < MaxIterations);

		if (Iteration >= MaxIterations) {
			console.warn(
				"[Iterative] Max iterations reached. Possible complex interactions or infinite loop.",
			);
		}

		if (this.Option.Debug) {
			console.log(`[Iterative] Finished in ${Iteration} iterations.`);
		}

		return Transform;
	}

	public Transform(
		Program: Program,
	): (Context: TransformationContext) => (Node: Node) => Node {
		this.Type = Program.getTypeChecker();

		return (Context: TransformationContext) =>
			(SourceFile: Node): Node => {
				if (this.Option.Debug) {
					console.log(
						`[Transform] Starting transformation for: ${SourceFile.getSourceFile()?.fileName}`,
					);
				}

				this.Collect(SourceFile);

				const Transform = this.Iterative(SourceFile, Context);

				if (this.Option.Debug) {
					console.log(`[Transform] Finished transformation.`);
				}

				return Transform;
			};
	}

	private Collect(Source: Node): void {
		if (this.Option.Debug) {
			console.log("[Collect] Starting collection phase...");
		}

		this.Usage.clear();

		const Visit = (Node: Node): void => {
			if (isVariableDeclaration(Node) || isFunctionDeclaration(Node)) {
				if (!Node.name || !isIdentifier(Node.name)) {
					return;
				}

				const _Symbol = this.Type?.getSymbolAtLocation(Node.name);

				if (!_Symbol) {
					return;
				}

				if (this.Usage.has(_Symbol)) {
					return;
				}

				let Inline = true;

				let Size = 0;

				const DeclarationName = Node.name.text;

				if (isVariableDeclaration(Node)) {
					if (this.Option.Debug) {
						console.log(
							`[Collect] Found Variable Declaration: ${DeclarationName}`,
						);
					}

					if (
						this.Option.Const &&
						Node.parent?.parent &&
						isVariableStatement(Node.parent.parent) &&
						Node.parent.parent.declarationList.flags &
							NodeFlags.Const
					) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} is const and Option.Const=true -> Inline=false`,
							);
						}

						Inline = false;
					}

					const Statement = Node.parent.parent;

					if (
						isVariableStatement(Statement) &&
						Statement.modifiers?.some(
							({ kind }) =>
								kind === ExportKeyword ||
								kind === DefaultKeyword,
						)
					) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} is exported -> Inline=false`,
							);
						}

						Inline = false;
					}

					if (Node.initializer) {
						if (!this.Inline(Node.initializer)) {
							if (this.Option.Debug) {
								console.log(
									`[Collect] > ${DeclarationName} initializer fails Inline() check -> Inline=false`,
								);
							}

							Inline = false;
						}

						Size = this.Size(Node.initializer);

						if (
							Size > (this.Option.Max || Number.POSITIVE_INFINITY)
						) {
							if (this.Option.Debug) {
								console.log(
									`[Collect] > ${DeclarationName} initializer size ${Size} > Max ${this.Option.Max} -> Inline=false`,
								);
							}

							Inline = false;
						}
					} else {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} has no initializer -> Inline=false`,
							);
						}

						Inline = false;
					}
				} else if (isFunctionDeclaration(Node)) {
					if (this.Option.Debug) {
						console.log(
							`[Collect] Found Function Declaration: ${DeclarationName}`,
						);
					}

					if (this.Option.Function === false) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} Option.Function=false -> Inline=false`,
							);
						}

						Inline = false;
					}

					if (
						Node.modifiers?.some(
							({ kind }) =>
								kind === ExportKeyword ||
								kind === DefaultKeyword ||
								(this.Option.Async === false &&
									kind === AsyncKeyword),
						)
					) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} is ${
									Node.modifiers?.find(
										({ kind }) =>
											kind === ExportKeyword ||
											kind === DefaultKeyword,
									)
										? "exported"
										: "async (Option.Async=false)"
								} -> Inline=false`,
							);
						}

						Inline = false;
					}

					if (Node.typeParameters && Node.typeParameters.length > 0) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} has type parameters -> Inline=false`,
							);
						}

						Inline = false;
					}

					let Nested = false;

					if (Node.body) {
						for (const statement of Node.body.statements) {
							if (isFunctionDeclaration(statement)) {
								Nested = true;

								break;
							}
						}
					}

					if (Nested) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} has nested function -> Inline=false`,
							);
						}

						Inline = false;
					}

					Size = this.Size(Node);

					if (Size > (this.Option.Max || Number.POSITIVE_INFINITY)) {
						if (this.Option.Debug) {
							console.log(
								`[Collect] > ${DeclarationName} size ${Size} > Max ${this.Option.Max} -> Inline=false`,
							);
						}

						Inline = false;
					}
				}

				if (this.Comment(Node)) {
					if (this.Option.Debug) {
						console.log(
							`[Collect] > ${DeclarationName} has leading comment -> Inline=false`,
						);
					}

					Inline = false;
				}

				const Call = new Set<SymbolInterface>();

				this.Call(Node, Call);

				if (this.Option.Debug) {
					console.log(
						`[Collect] => Storing Usage for ${DeclarationName}: Inline=${Inline}, Size=${Size}`,
					);
				}

				this.Usage.set(_Symbol, {
					Declaration: Node,

					Reference: [],

					Inline,

					Size,

					Modified: false,

					Call,
				});
			} else if (isIdentifier(Node)) {
				if (
					!(
						(isVariableDeclaration(Node.parent) &&
							Node.parent.name === Node) ||
						(isFunctionDeclaration(Node.parent) &&
							Node.parent.name === Node)
					)
				) {
					const _Symbol = this.Type?.getSymbolAtLocation(Node);

					if (_Symbol && this.Usage.has(_Symbol)) {
						const Usage = this.Usage.get(_Symbol)!;

						Usage.Reference.push(Node);

						if (this.Modification(Node)) {
							if (!Usage.Modified && this.Option.Debug) {
								console.log(
									`[Collect] > Usage of ${Usage.Declaration.name?.getText()} at line ${Node.getSourceFile().getLineAndCharacterOfPosition(Node.getStart()).line + 1} is a modification -> Modified=true`,
								);
							}

							Usage.Modified = true;

							if (Usage.Inline) {
								if (this.Option.Debug) {
									console.log(
										`[Collect] >> Setting Inline=false for ${Usage.Declaration.name?.getText()} due to modification.`,
									);
								}

								Usage.Inline = false;
							}
						}
					}
				}
			}

			forEachChild(Node, Visit);
		};

		Visit(Source);

		const Graph = new Map<SymbolInterface, Set<SymbolInterface>>();

		for (const [_Symbol, Usage] of this.Usage) {
			if (isFunctionDeclaration(Usage.Declaration)) {
				Graph.set(_Symbol, Usage.Call);
			}
		}

		const Cycle = this.Cycle(Graph);

		for (const _Cycle of Cycle) {
			for (const _Symbol of _Cycle) {
				const Usage = this.Usage.get(_Symbol);

				if (Usage && Usage.Inline) {
					if (this.Option.Debug) {
						console.log(
							`[Collect] > Function ${_Symbol.name} is part of a call cycle -> Inline=false`,
						);
					}

					Usage.Inline = false;
				}
			}
		}

		if (this.Option.Debug) {
			console.log(
				"[Collect] Collection phase complete. Final Usage Map:",
			);

			for (const [symbol, usage] of this.Usage.entries()) {
				console.log(
					` - ${symbol.name}: Inline=${usage.Inline}, Refs=${usage.Reference.length}, Modified=${usage.Modified}, Size=${usage.Size}`,
				);
			}
		}
	}
}
