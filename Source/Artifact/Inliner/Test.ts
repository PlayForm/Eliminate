import { expect } from "chai";
import ts, {
	ModuleKind,
	ScriptTarget,
	type CompilerHost,
	type Node,
	type Symbol,
	type TransformationContext,
	type TypeChecker,
	type VariableStatement,
} from "typescript";

import { VariableInliner, type InlinerOptions } from "../Inliner.js";

interface TestCase {
	name: string;

	input: string;

	expected: string;

	options?: InlinerOptions;
}

class TestRunner {
	private compiler: CompilerHost;

	private fileMap: Map<string, string> = new Map();

	constructor() {
		this.compiler = this.createCompilerHost();
	}

	private createCompilerHost(): CompilerHost {
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
				target: ScriptTarget.ES2020,
				module: ModuleKind.CommonJS,
			},
			this.compiler,
		);

		const sourceFile = program.getSourceFile(fileName);

		if (!sourceFile) {
			throw new Error(
				`Failed to create source file for test ${testCase.name}`,
			);
		}

		// Normalize whitespace for comparison
		expect(
			new VariableInliner(testCase.options)
				.transform(sourceFile, program)
				.code.replace(/\s+/g, " ")
				.trim(),
		).to.equal(testCase.expected.replace(/\s+/g, " ").trim());
	}
}

// Advanced TypeScript features support
class TypeScriptFeatureHandler {
	private typeChecker: TypeChecker;

	constructor(typeChecker: TypeChecker) {
		this.typeChecker = typeChecker;
	}

	handleDecorators(node: Node): Node {
		if (!ts.canHaveDecorators(node)) {
			return node;
		}

		const decorators = ts.getDecorators(node);

		if (!decorators) {
			return node;
		}

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

	private isInliningAffectingDecorator(symbol: Symbol): boolean {
		// Check for known decorators that affect variable behavior
		return ["observable", "computed", "action"].includes(symbol.getName());
	}

	handleNamespaces(node: Node): Node {
		if (ts.isModuleDeclaration(node)) {
			// Handle namespace-specific transformations
			return ts.transform(node, [
				(context: TransformationContext) => {
					const visit = (node: Node): Node => {
						if (ts.isVariableStatement(node)) {
							// Special handling for namespace variables
							return this.transformNamespaceVariable(node);
						}

						return ts.visitEachChild(node, visit, context);
					};

					return visit;
				},
			]).transformed[0] as Node;
		}

		return node;
	}

	private transformNamespaceVariable(node: VariableStatement): Node {
		// Special handling for namespace variables
		return ts.factory.updateVariableStatement(
			node,
			node.modifiers,
			ts.factory.createVariableDeclarationList(
				node.declarationList.declarations.map((decl) => {
					if (ts.isIdentifier(decl.name)) {
						const symbol = this.typeChecker.getSymbolAtLocation(
							decl.name,
						);

						if (symbol && this.isExported(symbol)) {
							// Don't inline exported namespace variables
							return decl;
						}
					}

					return decl;
				}),
				node.declarationList.flags,
			),
		);
	}

	private isExported(symbol: Symbol): boolean {
		return !!(symbol.flags & ts.SymbolFlags.ExportValue);
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

export { TestRunner, TypeScriptFeatureHandler, testCases, runAllTests };

export { TypeScriptValidator, ValidationResult } from "./Test/Validation.js";
