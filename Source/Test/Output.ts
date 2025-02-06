import Output from "@Function/Output.js";
import type Option from "@Interface/Output/Option.js";
import { expect } from "chai";
import prettier, { type RequiredOptions } from "prettier";

export const Debug = 0;

export const Normalize = async (Input: string): Promise<string> => {
	try {
		return await prettier.format(Input.replace(/\s+/g, " "), {
			parser: "typescript",
			...((await import("../../prettier.config.mjs"))
				.default as Partial<RequiredOptions>),
		});
	} catch (_Error) {
		console.log("Prettier: ");
		console.log(_Error);
	}

	return Input;
};

export const Equal = async (Input: string, Should: string, Option?: Option) =>
	expect(
		await Normalize(
			await Output(Input, {
				Debug: false,

				Const: false,

				Function: false,

				Comment: false,

				...Option,
			}),
		),
	).to.equal(await Normalize(Should));

describe("TypeScript Variable Inliner:", async () => {
	describe("Variable Inlining:", async () => {
		it("Should Inline Simple Constant Declarations:", async () => {
			await Equal(
				`const x = 5;

				console.log(x);`,

				`console.log(5);`,
			);
		});

		it("Should Inline Let Declarations:", async () => {
			await Equal(
				`let x = 5;

				console.log(x);`,

				`console.log(5);`,
			);
		});

		it("Should Inline Var Declarations:", async () => {
			await Equal(
				`var x = 5;

				console.log(x);`,

				`console.log(5);`,
			);
		});

		it("Should Not Inline Variables Used Multiple Times:", async () => {
			await Equal(
				`const x = 5;

				console.log(x);

				console.log(x);`,

				`const x = 5;

				console.log(x);

				console.log(x);`,
			);
		});

		it("Should Handle Unused Variables:", async () => {
			await Equal(
				`const x = 5;

				const y = 10;

				console.log(x);`,

				`const y = 10;

				console.log(5);`,
			);
		});
	});

	describe("Expression Inlining:", async () => {
		it("Should Inline Arithmetic Expressions:", async () => {
			await Equal(
				`const x = 5 * 2;

				console.log(x);`,

				`console.log((5 * 2));`,
			);
		});

		it("Should Inline String Concatenations:", async () => {
			await Equal(
				`const x = "Hello" + " World";

				console.log(x);`,

				`console.log(("Hello" + " World"));`,
			);
		});

		it("Should Inline Object Literals:", async () => {
			await Equal(
				`const x = {
					a: 1,

					b: 2
				};

				console.log(x);`,

				`console.log({
					a: 1,

					b: 2
				});`,
			);
		});

		it("Should Inline Array Literals:", async () => {
			await Equal(
				`const x = [
					1,

					2,

					3
				];

				console.log(x);`,

				`console.log([
					1,

					2,

					3
				]);`,
			);
		});

		it("Should Maintain Operator Precedence:", async () => {
			await Equal(
				`const x = 5;

				const y = x * 2;

				console.log(y);`,

				`console.log(((5 * 2)));`,
			);
		});
	});

	describe("Function Inlining:", async () => {
		it("Should Inline Simple Function Declarations:", async () => {
			await Equal(
				`function greet() {
					return "Hello";
				}

				console.log(greet());`,

				`console.log((() => {
					return "Hello";
				})());`,
			);
		});

		it("Should Inline Functions With Parameters:", async () => {
			await Equal(
				`function greet(name: string) {
					return "Hello " + name;
				}

				console.log(greet("World"));`,

				`console.log(((name: string) => {
					return "Hello " + name;
				})("World"));`,
			);
		});

		it("Should Not Inline Functions Used Multiple Times:", async () => {
			await Equal(
				`function greet(name: string) {
					return "Hello " + name;
				}

				console.log(greet("World"));

		 		console.log(greet("TypeScript"));`,

				`function greet(name: string) {
					return "Hello " + name;
				}

		 		console.log(greet("World"));

		 		console.log(greet("TypeScript"));`,
			);
		});
	});

	describe("Multiple Reference Scenarios:", async () => {
		it("Should Handle Mixed Single And Multiple References:", async () => {
			await Equal(
				`const x = 5;

				const y = x + 1;

				const z = y;

				console.log(x);

				console.log(z);`,

				`const x = 5;

				console.log(x);

				console.log((x + 1));`,
			);
		});

		it("Should Handle Chain Of Single Use Variables:", async () => {
			await Equal(
				`const a = 1;

				const b = a + 1;

				const c = b + 1;

				const d = c + 1;

				console.log(d);`,

				`console.log(((((((1 + 1)) + 1)) + 1)));`,
			);
		});
	});

	describe("Complex Cases:", async () => {
		it("Should Handle Nested Expressions:", async () => {
			await Equal(
				`const x = 5;

				const y = x * 2;

				const z = y + 3;

				console.log(z);`,

				`console.log(((((5 * 2)) + 3)));`,
			);
		});

		it("Should Handle Multiple Declarations In One Statement:", async () => {
			await Equal(
				`const x = 1, y = 2;

				console.log(x);`,

				`const y = 2;

				console.log(1);`,
			);
		});

		it("Should Preserve Type Annotations:", async () => {
			await Equal(
				`const x: number = 5;

				console.log(x);`,

				`console.log(5);`,
			);
		});

		it("Should Handle Even More Complex Cases:", async () => {
			await Equal(
				`const x = 5;

				const y = x * 2;

				const z = y + 3;

				const a = z * 4;

				const b = a + y;

				console.log(b);`,

				`const y = (5 * 2); console.log((((((y + 3) * 4)) + y)));`,
			);
		});
	});

	describe("Function and Object Scenarios:", async () => {
		it("Should Handle Function Calls In Expressions:", async () => {
			await Equal(
				`const x = Math.random();

				const y = x * 2;

				console.log(y);`,

				`console.log(((Math.random() * 2)));`,
			);
		});

		it("Should Handle Object Properties:", async () => {
			await Equal(
				`const obj = { value: 5 };

				const x = obj.value;

				console.log(x);`,

				`console.log({ value: 5 }.value);`,
			);
		});
	});

	describe("Edge Cases:", async () => {
		it("Should Handle Empty Declarations:", async () => {
			await Equal(
				`let x;

				x = 5;

				console.log(x);`,

				`let x;

				x = 5;

				console.log(x);`,
			);
		});

		it("Should Respect Comments When Option Enabled:", async () => {
			await Equal(
				`// Keep this comment

				const x = 5;

				console.log(x);`,

				`// Keep this comment

				console.log(5);`,

				{
					Comment: true,
				},
			);

			await Equal(
				`// Do not keep this comment

				const x = 5;

				console.log(x);`,

				`console.log(5);`,

				{
					Comment: false,
				},
			);
		});

		it("Should Handle Complex Nested Expressions With Mixed Usage:", async () => {
			await Equal(
				`const a = 1;

				const b = a + 2;

				const c = b + 3;

				const d = c + a;

				const e = d + b;

				console.log(e);`,

				`const a = 1;

				const b = a + 2;

				console.log((((((b + 3) + a)) + b)));`,
			);
		});
	});

	describe("Safety Checks:", async () => {
		it("Should Inline Function Calls:", async () => {
			await Equal(
				`const x = Math.random();

				console.log(x);`,

				`console.log(Math.random());`,
			);
		});

		it("Should Inline Async/await Expressions:", async () => {
			await Equal(
				`const x = await Promise.resolve(5);

				console.log(x);`,

				`console.log(await Promise.resolve(5));`,
			);
		});

		it("Should Inline New Expressions:", async () => {
			await Equal(
				`const x = new Date();

				console.log(x);`,

				`console.log(new Date());`,
			);
		});
	});

	describe("Scope Handling:", async () => {
		it("Should Respect Block Scope:", async () => {
			await Equal(
				`const x = 1;

				{
					const x = 2;
					console.log(x);
				}

				console.log(x);`,

				`{
					console.log(2);
				}

				console.log(1);`,
			);
		});

		it("Should Handle Variables In Loops Correctly:", async () => {
			await Equal(
				`for (let i = 0; i < 3; i++) {
					const x = i * 2;

					console.log(x);
				}`,

				`for (let i = 0; i < 3; i++) {
					console.log((i * 2));
				}`,
			);
		});
	});

	// NOT CHECKED
	describe("TypeScript-specific Features:", async () => {
		it("Should Handle Interface Declarations:", async () => {
			await Equal(
				`interface Person {
					name: string;
				}

				const person: Person = {
					name: "John"
				};

				console.log(person);`,

				`interface Person {
					name: string;
				}

				console.log({
					name: "John"
				});`,
			);
		});

		it("Should Handle Enum Usage:", async () => {
			await Equal(
				`enum Direction {
					Up,
					Down
				}

				const _Direction = Direction.Up;

				console.log(_Direction);`,

				`enum Direction {
					Up,
					Down
				}

				console.log(Direction.Up);`,
			);
		});

		it("Should Handle Generic Functions:", async () => {
			await Equal(
				`function identity<T>(x: T): T {
					return x;
				}

				const result = identity(5);

				console.log(result);`,

				`function identity<T>(x: T): T {
					return x;
				}

				console.log(identity(5));`,
			);
		});
	});

	describe("Error Cases:", async () => {
		it("Should Handle Undefined Variables Gracefully:", async () => {
			await Equal(
				`console.log(undefinedVar);`,
				`console.log(undefinedVar);`,
			);
		});

		it("Should Handle Syntax Errors Gracefully", () =>
			Output(`const x = ;`).catch((error) =>
				expect(error).instanceOf(Error),
			));

		it("Should Handle Incomplete Code Gracefully:", async () =>
			Output(`const x =`).catch((error) =>
				expect(error).instanceOf(Error),
			));
	});

	describe("Advanced Cases", () => {
		it("Should Inline Variables With Template Literals:", async () => {
			await Equal(
				`const greeting = \`Hello, World\`;

				console.log(greeting);`,

				`console.log(\`Hello, World\`);`,
			);
		});

		it("Should Inline Variables In Conditional (ternary) Expressions:", async () => {
			await Equal(
				`const x = true ? 1 : 2;

				console.log(x);`,

				`console.log((true ? 1 : 2));`,
			);
		});

		it("Should Inline Variables With Logical Operators:", async () => {
			await Equal(
				`const x = true && false;

				console.log(x);`,

				`console.log((true && false));`,
			);
		});

		it("Should Not Inline Variables That Are Reassigned:", async () => {
			await Equal(
				`let x = 5;

				x = 10;

				console.log(x);`,

				`let x = 5;

				x = 10;

				console.log(x);`,
			);
		});

		it("Should Handle Computed Property Names:", async () => {
			await Equal(
				`const key = "value";

				const obj = { [key]: 123 };

				console.log(obj);`,

				`console.log({ ["value"]: 123 });`,
			);
		});

		it("Should Inline Variables With Type Assertions:", async () => {
			await Equal(
				`const x = 5 as number;

				console.log(x);`,

				`console.log(5 as number);`,
			);
		});
	});

	describe("Destructuring and Spread", () => {
		it("Should Leave Destructured Object Variables Untouched:", async () => {
			await Equal(
				`const { a, b } = { a: 1, b: 2 };

				console.log(a);`,

				`const { a, b } = { a: 1, b: 2 };

				console.log(a);`,
			);
		});

		it("Should Leave Array Destructuring Unchanged:", async () => {
			await Equal(
				`const [x, y] = [10, 20];

				console.log(y);`,

				`const [x, y] = [10, 20];

				console.log(y);`,
			);
		});

		it("Should Handle Rest Elements In Destructuring:", async () => {
			await Equal(
				`const [head, ...tail] = [1, 2, 3, 4];

				console.log(tail);`,

				`const [head, ...tail] = [1, 2, 3, 4];

				console.log(tail);`,
			);
		});

		it("Should Inline Variables In Spread Expressions In Arrays:", async () => {
			await Equal(
				`const nums = [1, 2];

				const moreNums = [...nums, 3];

				console.log(moreNums);`,

				`console.log([...[1, 2], 3]);`,
			);
		});
	});

	describe("Arrow Functions and IIFE", () => {
		it("Should Inline Arrow Functions Assigned To Variables:", async () => {
			await Equal(
				`const add = (a: number, b: number) => a + b;

				console.log(add(1, 2));`,

				`console.log(((a: number, b: number) => a + b)(1, 2));`,
			);
		});

		it("Should Inline Immediately Invoked Arrow Functions:", async () => {
			await Equal(
				`const result = ((x: number) => x * 2)(5);

				console.log(result);`,

				`console.log(((x: number) => x * 2)(5));`,
			);
		});
	});

	describe("Loop and Scope Advanced", () => {
		it("Should Inline Variables Inside While Loops:", async () => {
			await Equal(
				`let i = 0;

				while (i < 3) {
					const x = i + 1;

					console.log(x);

					i++;
				}`,

				`let i = 0;

				while (i < 3) {
					console.log((i + 1));

					i++;
				}`,
			);
		});

		it("Should Inline Variables When Shadowed In Nested Functions:", async () => {
			await Equal(
				`const x = 10;

				function outer() {
					const x = 20;

					function inner() {
						console.log(x);
					}

					inner();
				}

				outer();

				console.log(x);`,

				`(() => {
					const x = 20;

					function inner() {
						console.log(x);
					}

					inner();
				})();

				console.log(10);`,
			);
		});
	});

	describe("Miscellaneous", () => {
		it("Should Inline Variables In Chained Function Calls:", async () => {
			await Equal(
				`const x = Math.abs(-5);

				console.log(String(x).padStart(3, "0"));`,

				`console.log(String(Math.abs(-5)).padStart(3, "0"));`,
			);
		});

		it("Should Inline Variables With Complex Nested Ternary Operators:", async () => {
			await Equal(
				`const x = true ? (false ? 1 : 2) : 3;

				console.log(x);`,

				`console.log((true ? (false ? 1 : 2) : 3));`,
			);
		});

		it("Should Inline Variables In Try Catch Blocks:", async () => {
			await Equal(
				`try {
					const x = "error";

					throw new Error(x);
				} catch (e) {
					console.log(e.message);
				}`,

				`try {
					throw new Error("error");
				} catch (e) {
					console.log(e.message);
				}`,
			);
		});

		it("Should Inline Variables In Template Literal Expressions With Embedded Variables:", async () => {
			await Equal(
				`const adj = "awesome";

				const sentence = \`This is \${adj}!\`;

				console.log(sentence);`,

				`console.log(\`This is \${"awesome"}!\`);`,
			);
		});
	});

	describe("Error Cases Extended", () => {
		it("Should Pass Through Runtime Errors For Undefined Variables:", async () => {
			await Equal(
				`console.log(nonExistentVar);`,

				`console.log(nonExistentVar);`,
			);
		});

		it("Should Report Syntax Errors For Incomplete Expressions:", () =>
			Output(`const y = (1 +`).catch((error) =>
				expect(error).to.be.instanceOf(Error),
			));
	});
});

const File = await (
	await import("fast-glob")
).default("./Target/Test/Input/**/*.{js,ts}");

describe("File Checking:", async () =>
	File.forEach((File) =>
		it(`Should Inline Properly: ${File}`, async () => {
			await Equal(
				await (
					await import("fs/promises")
				).readFile(File, {
					encoding: "utf-8",
				}),
				await (
					await import("fs/promises")
				).readFile(
					File.replace("Target/Test/Input", "Target/Test/Output"),
					{
						encoding: "utf-8",
					},
				),
			);
		}),
	));
