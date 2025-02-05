var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import * as ts from "typescript";
class Output_default {
  static {
    __name(this, "default");
  }
  Usage = /* @__PURE__ */ new Map();
  Type;
  Option;
  constructor(Option = {}) {
    this.Option = {
      Comment: true,
      Max: 100,
      Async: false,
      Const: false,
      Function: false,
      Debug: false,
      ...Option
    };
  }
  Transform(Program) {
    this.Type = Program.getTypeChecker();
    return (Context) => (Source) => {
      this.Collect(Source);
      return ts.visitNode(
        Source,
        (Source2) => this.Visit(Source2, 1, Context)
      );
    };
  }
  Collect(Source) {
    const Collect = /* @__PURE__ */ __name((Node) => {
      if (ts.isVariableDeclaration(Node) || ts.isFunctionDeclaration(Node)) {
        const _Symbol = this.Type?.getSymbolAtLocation(Node.name);
        if (_Symbol) {
          let Inline = true;
          let Size = 0;
          if (ts.isVariableDeclaration(Node)) {
            if (this.Option.Const && Node.parent?.parent?.flags & ts.NodeFlags.Const) {
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
            Size
          });
        }
      } else if (ts.isIdentifier(Node)) {
        const _Symbol = this.Type?.getSymbolAtLocation(Node);
        if (_Symbol && this.Usage.has(_Symbol)) {
          this.Usage.get(_Symbol).Reference.push(Node);
        }
      }
      ts.forEachChild(Node, Collect);
    }, "Collect");
    Collect(Source);
  }
  Size(Node) {
    let Size = 0;
    const Visit = /* @__PURE__ */ __name((Node2) => {
      Size++;
      ts.forEachChild(Node2, Visit);
    }, "Visit");
    Visit(Node);
    return Size;
  }
  Comment(Node) {
    if (!this.Option.Comment) {
      return false;
    }
    return (ts.getLeadingCommentRanges(
      Node.getSourceFile().text,
      Node.pos
    ) || []).length > 0;
  }
  Visit(Node, Depth = 0, Context) {
    if (this.Option.Debug) {
      for (const [_Symbol, Usage] of this.Usage) {
        console.log(`Variable: ${_Symbol.name} at Depth: ${Depth}`);
        console.log(`- Reference: ${Usage.Reference.length}`);
        console.log(`- Inline: ${Usage.Inline}`);
        console.log(`- Size: ${Usage.Size}`);
        console.log(`- Text: ${Usage.Declaration.getText()}`);
      }
    }
    if (ts.isFunctionDeclaration(Node)) {
      if (Node.typeParameters && Node.typeParameters.length > 0) {
        return Node;
      }
      const _Symbol = this.Type?.getSymbolAtLocation(Node.name);
      if (_Symbol) {
        const Usage = this.Usage.get(_Symbol);
        if (Usage && Usage.Inline && Usage.Reference.length === 2) {
          return void 0;
        }
      }
    }
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
        return void 0;
      }
      if (New.length !== Declaration.length) {
        return Context.factory.updateVariableStatement(
          Node,
          Node.modifiers,
          Context.factory.createVariableDeclarationList(
            New,
            Node.declarationList.flags
          )
        );
      }
    }
    if (ts.isExpressionStatement(Node)) {
      return ts.visitEachChild(
        Node,
        (Child) => this.Visit(Child, Depth + 1, Context),
        Context
      );
    }
    if (ts.isIdentifier(Node)) {
      const _Symbol = this.Type?.getSymbolAtLocation(Node);
      if (_Symbol && this.Usage.has(_Symbol)) {
        const Usage = this.Usage.get(_Symbol);
        if (Usage.Inline && Usage.Reference.length === 2) {
          if (ts.isVariableDeclaration(Usage.Declaration) && Usage.Declaration.initializer) {
            return this.Visit(
              ts.isBinaryExpression(
                Usage.Declaration.initializer
              ) || ts.isConditionalExpression(
                Usage.Declaration.initializer
              ) ? Context.factory.createParenthesizedExpression(
                Usage.Declaration.initializer
              ) : Usage.Declaration.initializer,
              Depth + 1,
              Context
            );
          }
        }
      }
    }
    if (ts.isCallExpression(Node)) {
      const Expression = Node.expression;
      if (ts.isIdentifier(Expression)) {
        const _Symbol = this.Type?.getSymbolAtLocation(Expression);
        if (_Symbol && this.Usage.has(_Symbol)) {
          const Usage = this.Usage.get(_Symbol);
          if (ts.isFunctionDeclaration(Usage.Declaration) && Usage.Declaration.typeParameters && Usage.Declaration.typeParameters.length > 0) {
            return Node;
          }
          if (Usage.Inline && Usage.Reference.length === 2 && ts.isFunctionDeclaration(Usage.Declaration)) {
            return Context.factory.updateCallExpression(
              Node,
              Context.factory.createParenthesizedExpression(
                Context.factory.createArrowFunction(
                  Usage.Declaration.modifiers,
                  Usage.Declaration.typeParameters,
                  Usage.Declaration.parameters,
                  Usage.Declaration.type,
                  void 0,
                  Usage.Declaration.body
                )
              ),
              Node.typeArguments,
              Node.arguments
            );
          }
        }
      }
    }
    if (ts.isBinaryExpression(Node)) {
      const Left = this.Visit(Node.left, Depth + 1, Context);
      const Right = this.Visit(Node.right, Depth + 1, Context);
      if (Left !== Node.left || Right !== Node.right) {
        return Context.factory.createParenthesizedExpression(
          Context.factory.createBinaryExpression(
            Left,
            Node.operatorToken,
            Right
          )
        );
      }
    }
    return ts.visitEachChild(
      Node,
      (Node2) => this.Visit(Node2, Depth + 1, Context),
      Context
    );
  }
  Inline(Node) {
    if (this.Size(Node) > (this.Option.Max || Infinity)) {
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
        Node.expression
      )?.getProperty(Node.name.text);
      if (_Symbol?.flags) {
        if (_Symbol?.flags & ts.SymbolFlags.Accessor) {
          return false;
        }
      }
    }
    let Valid = true;
    Node.forEachChild((Node2) => {
      if (!this.Inline(Node2)) {
        Valid = false;
      }
    });
    return Valid;
  }
}
export {
  Output_default as default
};
//# sourceMappingURL=Output.js.map
