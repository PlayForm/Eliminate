import ts, { type Node, type TypeChecker } from "typescript";

export class TypeScriptValidator {
	validate(node: Node, typeChecker: TypeChecker): ValidationResult {
		const errors: ValidationError[] = [];

		const visit = (node: Node) => {
			// Validate type compatibility
			if (ts.isVariableDeclaration(node) && node.initializer) {
				const declType = typeChecker.getTypeAtLocation(node.name);

				const initType = typeChecker.getTypeAtLocation(
					node.initializer,
				);

				if (!typeChecker.isTypeAssignableTo(initType, declType)) {
					errors.push({
						node,
						message: "Type mismatch in variable declaration",
						category: "type",
					});
				}
			}

			// Validate reference integrity
			if (ts.isIdentifier(node)) {
				const symbol = typeChecker.getSymbolAtLocation(node);

				if (symbol && symbol.declarations) {
					const declaration = symbol.declarations[0];

					if (
						typeof declaration !== "undefined" &&
						ts.isVariableDeclaration(declaration)
					) {
						const scope = this.findEnclosingScope(node);

						const declScope = this.findEnclosingScope(declaration);

						if (!this.isAccessibleFrom(scope, declScope)) {
							errors.push({
								node,
								message:
									"Variable reference violates scope rules",
								category: "scope",
							});
						}
					}
				}
			}

			ts.forEachChild(node, visit);
		};

		visit(node);

		return new ValidationResult(errors);
	}

	private findEnclosingScope(node: Node): Node {
		let current = node;

		while (current) {
			if (
				ts.isSourceFile(current) ||
				ts.isBlock(current) ||
				ts.isFunctionLike(current)
			) {
				return current;
			}
			current = current.parent;
		}
		return node.getSourceFile();
	}

	private isAccessibleFrom(currentScope: Node, targetScope: Node): boolean {
		let scope = currentScope;

		while (scope) {
			if (scope === targetScope) return true;

			scope = scope.parent;
		}
		return false;
	}
}

export class ValidationResult {
	constructor(private errors: ValidationError[]) {}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}

	getErrors(): ValidationError[] {
		return [...this.errors];
	}

	toString(): string {
		return this.errors
			.map((error) => `${error.category.toUpperCase()}: ${error.message}`)
			.join("\n");
	}
}

export interface ValidationError {
	node: Node;

	message: string;

	category: "type" | "scope" | "syntax";
}
