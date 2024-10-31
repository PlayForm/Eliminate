// test-utils.ts
import { expect } from "chai";
import ts from "typescript";

import {
	InlinerOptions,
	TransformationResult,
	VariableInliner,
} from "./inliner";

interface TestCase {
	name: string;
	input: string;
	expected: string;
	options?: InlinerOptions;
}

class TestRunner {
	private compiler: ts.CompilerHost;
	private fileMap: Map<string, string> = new Map();

	constructor() {
		this.compiler = this.createCompilerHost();
	}

	private createCompilerHost(): ts.CompilerHost {
		return {
			getSourceFile: (fileName: string, languageVersion) => {
				const sourceText = this.fileMap.get(fileName);
				return sourceText
					? ts.createSourceFile(fileName, sourceText, languageVersion)
					: undefined;
			},
			getDefaultLibFileName: () => "lib.d.ts",
			writeFile: () => {},
			getCurrentDirectory: () => "",
			getCanonicalFileName: (fileName) => fileName,
			useCaseSensitiveFileNames: () => true,
			getNewLine: () => "\n",
			fileExists: (fileName) => this.fileMap.has(fileName),
			readFile: (fileName) => this.fileMap.get(fileName),
		};
	}

	async runTest(testCase: TestCase): Promise<void> {
		const fileName = `test-${testCase.name}.ts`;
		this.fileMap.set(fileName, testCase.input);

		const program = ts.createProgram(
			[fileName],
			{
				target: ts.ScriptTarget.ES2020,
				module: ts.ModuleKind.CommonJS,
			},
			this.compiler,
		);

		const inliner = new VariableInliner(testCase.options);
		const sourceFile = program.getSourceFile(fileName);
		if (!sourceFile) {
			throw new Error(
				`Failed to create source file for test ${testCase.name}`,
			);
		}

		const result = inliner.transform(sourceFile, program);

		// Normalize whitespace for comparison
		const normalizedResult = result.code.replace(/\s+/g, " ").trim();
		const normalizedExpected = testCase.expected
			.replace(/\s+/g, " ")
			.trim();

		expect(normalizedResult).to.equal(normalizedExpected);
	}
}

// validation.ts
class TypeScriptValidator {
	validate(node: ts.Node, typeChecker: ts.TypeChecker): ValidationResult {
		const errors: ValidationError[] = [];

		const visit = (node: ts.Node) => {
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
					if (ts.isVariableDeclaration(declaration)) {
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

	private findEnclosingScope(node: ts.Node): ts.Node {
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

	private isAccessibleFrom(
		currentScope: ts.Node,
		targetScope: ts.Node,
	): boolean {
		let scope = currentScope;
		while (scope) {
			if (scope === targetScope) return true;
			scope = scope.parent;
		}
		return false;
	}
}

class ValidationResult {
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

interface ValidationError {
	node: ts.Node;
	message: string;
	category: "type" | "scope" | "syntax";
}

// Advanced TypeScript features support
class TypeScriptFeatureHandler {
	private typeChecker: ts.TypeChecker;

	constructor(typeChecker: ts.TypeChecker) {
		this.typeChecker = typeChecker;
	}

	handleDecorators(node: ts.Node): ts.Node {
		if (!ts.canHaveDecorators(node)) return node;

		const decorators = ts.getDecorators(node);
		if (!decorators) return node;

		// Analyze decorator impact
		for (const decorator of decorators) {
			const symbol = this.typeChecker.getSymbolAtLocation(
				decorator.expression,
			);
			if (!symbol) continue;

			// Check if decorator affects inlining
			if (this.isInliningAffectingDecorator(symbol)) {
				return node; // Skip inlining for decorated nodes
			}
		}

		return node;
	}

	private isInliningAffectingDecorator(symbol: ts.Symbol): boolean {
		// Check for known decorators that affect variable behavior
		const name = symbol.getName();
		return ["observable", "computed", "action"].includes(name);
	}

	handleNamespaces(node: ts.Node): ts.Node {
		if (ts.isModuleDeclaration(node)) {
			// Handle namespace-specific transformations
			const transformer = (context: ts.TransformationContext) => {
				const visit = (node: ts.Node): ts.Node => {
					if (ts.isVariableStatement(node)) {
						// Special handling for namespace variables
						return this.transformNamespaceVariable(node);
					}
					return ts.visitEachChild(node, visit, context);
				};
				return visit;
			};

			return ts.transform(node, [transformer]).transformed[0];
		}
		return node;
	}

	private transformNamespaceVariable(node: ts.VariableStatement): ts.Node {
		// Special handling for namespace variables
		const declarations = node.declarationList.declarations.map((decl) => {
			if (ts.isIdentifier(decl.name)) {
				const symbol = this.typeChecker.getSymbolAtLocation(decl.name);
				if (symbol && this.isExported(symbol)) {
					// Don't inline exported namespace variables
					return decl;
				}
			}
			return decl;
		});

		return ts.factory.updateVariableStatement(
			node,
			node.modifiers,
			ts.factory.createVariableDeclarationList(
				declarations,
				node.declarationList.flags,
			),
		);
	}

	private isExported(symbol: ts.Symbol): boolean {
		return !!(symbol.flags & ts.SymbolFlags.Exported);
	}
}

// Test cases
const testCases: TestCase[] = [
	{
		name: "basic-inlining",
		input: `
      const x = 5;
      const y = x + 3;
      console.log(y);
    `,
		expected: `
      console.log(5 + 3);
    `,
	},
	{
		name: "destructuring",
		input: `
      const obj = { a: 1, b: 2 };
      const { a, b } = obj;
      console.log(a + b);
    `,
		expected: `
      const obj = { a: 1, b: 2 };
      console.log(obj.a + obj.b);
    `,
		options: { inlineDestructuring: true },
	},
	{
		name: "decorator-preservation",
		input: `
      class Example {
        @observable
        x = 5;
        
        @computed
        get doubled() {
          return this.x * 2;
        }
      }
    `,
		expected: `
      class Example {
        @observable
        x = 5;
        
        @computed
        get doubled() {
          return this.x * 2;
        }
      }
    `,
	},
	{
		name: "namespace-handling",
		input: `
      namespace MyNamespace {
        export const x = 5;
        const y = x + 3;
        export const z = y * 2;
      }
    `,
		expected: `
      namespace MyNamespace {
        export const x = 5;
        export const z = (x + 3) * 2;
      }
    `,
	},
];

// Run tests
async function runAllTests() {
	const runner = new TestRunner();

	for (const testCase of testCases) {
		try {
			await runner.runTest(testCase);
			console.log(`✓ Test passed: ${testCase.name}`);
		} catch (error) {
			console.error(`✗ Test failed: ${testCase.name}`);
			console.error(error);
		}
	}
}

export {
	TestRunner,
	TypeScriptValidator,
	ValidationResult,
	TypeScriptFeatureHandler,
	testCases,
	runAllTests,
};
