import Output from "@Function/Output.js";
import type Option from "@Interface/Output/Option.js";
import { expect } from "chai";
import prettier, { type RequiredOptions } from "prettier";

const Debug = false;

const File = await (await import("fast-glob")).default(
	"./Target/Test/Input/**/*.{js,ts}",
);

const Normalize = async (Input: string): Promise<string> => {
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

const Transform = async (Input: string, Option?: Option) =>
	await Normalize(
		await Output(Input, {
			Debug,

			Const: false,

			Function: false,

			Comment: false,

			...Option,
		}),
	);

const Equal = async (
	Input: string,
	Should: string,
	Option?: Option,
	Log = false,
) => {
	const _Output = await Transform(Input, Option);

	if (Log) {
		console.log("---------- OUTPUT ----------");

		console.log(_Output);
	}

	return expect(_Output).to.equal(await Normalize(Should));
};

describe("TypeScript Variable Inliner", async () =>
	// NEW ONES
	describe("Variable Inliner Transformer", () =>
		it("Inlines A Simple Variable Usage", async () => {
			const Should = await Transform(
				`let a = 1;
				
				let b = a + 2;
				
				console.log(b);`,
			);

			expect(Should).not.to.contain("let a = 1");
		}) &&
		it("Does Not Inline An Exported Variable", async () => {
			const Should = await Transform(
				`export const a = 1;
				
				let b = a + 2;
				
				console.log(b);`,
			);

			expect(Should).to.contain("export const a = 1");

			expect(Should).to.contain("a + 2");
		}) &&
		it("Does Not Keep A Comment", async () => {
			const Should = await Transform(
				`// This comment disables inlining
				let a = 1;
				
				let b = a + 2;
				
				console.log(b);`,
				{
					Comment: false,
				},
			);

			expect(Should).not.to.contain("This comment disables inlining");
		}) &&
		it("Inlines A Simple Function Call", async () => {
			const Should = await Transform(
				`function foo() {
				
					return 42;
				
					}

				let Should = foo();
				
				console.log(Should);`,
			);

			expect(Should).not.to.contain("function foo");

			expect(Should).to.contain("(() =>");

			expect(Should).to.contain("return 42");
		}) &&
		it("Does Not Inline A Function With Type Parameters", async () => {
			const Should = await Transform(
				`function foo<T>(x: T): T {
				
					return x;
				
					}

				let Should = foo(42);
				
				console.log(Should);`,
			);

			expect(Should).to.contain("function foo<T>");

			expect(Should).to.contain("foo(42)");
		}) &&
		it("Does Not Inline A Variable If Its Initializer Exceeds The Size Threshold", async () => {
			const Should = await Transform(
				`let a = 1 + 2;
				
				
				// This expression will likely have a size > 1.
				// 	
				// 			let b = a + 3;
				// 
				// console.log(b);`,
				{ Max: 1 },
			);

			expect(Should).to.contain("let a = 1 + 2");

			expect(Should).to.contain("a + 3");
		}) &&
		it("Does Not Inline Await Expressions When Async Option Is Enabled", async () => {
			const Should = await Transform(
				`async function foo() {
				
					return await Promise.resolve(42);
				
					}
		
					let Should = foo();
				
					console.log(Should);`,
				{ Async: true },
			);

			expect(Should).to.contain("async function foo");

			expect(Should).to.contain("foo()");
		}) &&
		it("Inlines Nested Expressions Correctly", async () => {
			const Should = await Transform(
				`let a = 2;
				
				let b = a + 3;
				
				let c = b * 4;
				
				console.log(c);`,
			);

			expect(Should).to.match(/console\.log\(?\(?2 \+ 3\)?\) \* 4/);

			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");
		})) &&
	describe("Extensive Variable Inliner Tests", () =>
		it("Should Inline Multi Pass Variables Across Multiple Passes", async () => {
			const Should = await Transform(
				`let a = 1;
				
				let b = a + 2;
				
				let c = b * 3;
				
				console.log(c);`,
			);

			// Expect that both 'a' and 'b' are inlined so that only the final expression remains.
			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");

			// The final expression for 'c' should be inlined (e.g. ((1 + 2) * 3)).
			expect(Should).to.match(/\(1\s*\+\s*2\).*3/);
		}) &&
		it("Should Handle Variables In Nested Block Scopes", async () => {
			const Should = await Transform(
				`let a = 10;
				
				
				{
				
					let b = a + 5;
					
					

					{
					
						let c = b * 2;
						
						

						console.log(c);
						
						
					}

				}`,
			);

			// If inlining is safe across blocks, there should be no declarations for a, b, or c.
			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");

			expect(Should).not.to.contain("let c =");

			// Ensure that the final console.log contains some computed arithmetic.
			expect(Should).to.match(/console\.log\(.+\)/);
		}) &&
		it("Should Not Inline A Variable That Is Redefined In The Same Scope", async () => {
			const Should = await Transform(
				`let a = 1;
				
				a = 2;
				
				console.log(a);`,
			);

			// Since 'a' is redefined, it must not be inlined.
			expect(Should).to.contain("let a = 1");

			expect(Should).to.contain("a = 2");

			expect(Should).to.contain("console.log(a)");
		}) &&
		it("Should Not Inline Variables When Shadowed In Nested Scopes", async () => {
			const Should = await Transform(
				`let a = 1;
				
				{
				
					let a = 2;
					
					

					console.log(a);
				
					}

				console.log(a);`,
			);

			// There are two distinct 'a' variables; inlining should not merge or remove them.
			expect(Should).to.match(/let a = 1/);

			expect(Should).to.match(/let a = 2/);
		}) &&
		it("Should Inline A Variable Inside A Nested Function When Safe", async () => {
			const Should = await Transform(
				`function outer() {
				
					let a = 5;
					
					

					function inner() {
					
						return a + 1;
						
						
					}

					return inner();
				
					}

				console.log(outer());`,
			);

			// If 'a' is only used in 'inner', it can be inlined.
			expect(Should).not.to.contain("let a =");

			// Check that the return expression in 'inner' contains the literal arithmetic.
			expect(Should).to.match(/return\s+5\s*\+\s*1/);
		}) &&
		it("Should Not Inline Variables That Are Used In Multiple Locations", async () => {
			const Should = await Transform(
				`let a = 1;
				
				let b = a + 2;
				
				let c = a + 3;
				
				console.log(b, c);`,
			);

			// 'a' is used more than once and should remain as a declared variable.
			expect(Should).to.contain("let a = 1");

			expect(Should).to.contain("a + 2");

			expect(Should).to.contain("a + 3");
		}) &&
		it("Should Perform Multi Pass Inlining With Interdependent Variables", async () => {
			const Should = await Transform(
				`let x = 1;
				
				let y = x + 2;
				
				let z = y + x;
				
				console.log(z);`,
			);

			// Expect that x is inlined into y and both are inlined into z.
			expect(Should).not.to.contain("let x =");

			expect(Should).not.to.contain("let y =");

			// The final inlined expression should reflect the arithmetic of x and y.
			expect(Should).to.match(
				/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\+\s*1\s*\)/,
			);
		}) &&
		it("Should Inline Variables Through Multiple Levels Of Nested Functions", async () => {
			const Should = await Transform(
				`function level1() {
				
					let a = 10;
					
					

					function level2() {
					
						let b = a + 5;
						
						

						function level3() {
						
							let c = b * 2;
							
							

							return c;
							
							

						}

						return level3();
						
						
					}

					return level2();
				
					}

				console.log(level1());`,
			);

			// If inlining is safe, there should be no separate declarations for a, b, or c.
			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");

			expect(Should).not.to.contain("let c =");

			expect(Should).to.match(/console\.log\(.+\)/);
		}) &&
		it("Should Preserve Variables Or Functions Marked By Comments From Inlining", async () => {
			const Should = await Transform(
				`// Do not inline this variable.
				let a = 5;
				
				let b = a + 3;
				
				function foo() {
				
					/* Important: preserve 'a' */
					return a + 1;
				
					}

				console.log(b, foo());`,
			);

			// The presence of comments should prevent inlining of 'a'.
			expect(Should).to.contain("let a = 5");

			expect(Should).to.contain("function foo");
		}) &&
		it("Should Not Inline A Function That Is Redefined", async () => {
			const Should = await Transform(
				`function foo() { return 1; }

				foo = function() { return 2; }

				console.log(foo());`,
			);

			// Since foo is redefined, its original declaration must be preserved.
			expect(Should).to.contain("function foo");

			expect(Should).to.contain("foo = function");

			expect(Should).to.contain("console.log(foo())");
		}) &&
		it("Should Not Inline A Variable That Is Reassigned Within A Nested Block", async () => {
			const Should = await Transform(
				`let a = 1;
				
				{
				
					let b = a + 1;
					
					

					console.log(b);
					
					

					b = 3;
					
					

					console.log(b);
				
					}`,
			);

			// Because 'b' is reassigned, it should not be inlined.
			expect(Should).to.contain("let b =");

			// Depending on safety checks, 'a' might be inlined if used only once, but could also be preserved.
			expect(Should).to.contain("let a =");
		}) &&
		it("Should Handle Variables With Similar Names In Different Scopes", async () => {
			const Should = await Transform(
				`let a = 100;
				
				function f() {
				
					let a = 200;
					
					

					return a + 10;
				
					}

				console.log(a, f());`,
			);

			// Both outer and inner 'a' should remain distinct.
			expect(Should).to.match(/let a = 100/);

			expect(Should).to.match(/let a = 200/);
		}) &&
		it("Should Correctly Inline Across Multiple Passes With Nested Redefinitions And Cross Scope Usage", async () => {
			const Should = await Transform(
				`let x = 1;
				
				let y = x + 1;
				
				function f() {
				
					let x = 10;
					
					

					let z = y + x;
					
					

					return z;
				
					}

				console.log(f(), y);`,
			);

			// The outer 'y' should be inlined if safe, but inner 'x' in function f() must remain.
			expect(Should).not.to.contain("let y =");

			expect(Should).to.contain("let x = 10");

			// The printed output should reference the inlined expression for y where appropriate.
			expect(Should).to.match(/console\.log\(.+,\s*y\s*\)/);
		}) &&
		it("Should Not Inline A Variable If It Is Captured In A Closure And Later Modified", async () => {
			const Should = await Transform(
				`let a = 1;
				
				function f() {
				
					return a;
				
					}

				a = 2;
				
				console.log(f(), a);`,
			);

			// Since 'a' is captured by function f and later reassigned, it should not be inlined.
			expect(Should).to.contain("let a = 1");

			expect(Should).to.contain("a = 2");

			// expect(Should).to.contain("function f()");
		})) &&
	describe("Additional Extensive Variable Inliner Tests", () =>
		it("Should Inline Variables In Inner Functions With Parameters", async () => {
			const Should = await Transform(
				`function outer(a) {
				
				function inner(b) {
				
				return a + b;
				
				
				
			}
		
			return inner(5);
			

			 
			}
		
			console.log(outer(10));`,
			);

			// 'a' and 'b' should both be inlined as expressions.
			expect(Should).not.to.contain("function outer");

			expect(Should).not.to.contain("function inner");

			expect(Should).to.match(/10 \+ 5/);
		}) &&
		it("Should Not Inline Variables When They Are Used In Conditionals", async () => {
			const Should = await Transform(
				`let a = 10;
				
				if (a > 5) {
				
				console.log(a);			
		
			}`,
			);

			// Inlining should not remove 'a' due to its conditional nature.
			expect(Should).to.contain("let a = 10");

			expect(Should).to.contain("console.log(a)");
		}) &&
		it("Should Inline A Function Used Only Once In A Single Expression", async () => {
			const Should = await Transform(
				`function foo() {
				
				return 5;			
		
			}
		
			let Should = foo() * 2;
			

				console.log(Should);`,
			);

			// 'foo' should be inlined as an expression directly in 'Should' assignment.
			expect(Should).not.to.contain("function foo");

			expect(Should).to.match(/let Should = 5 \* 2/);
		}) &&
		it("Should Handle Multiple Variables Defined At Once And Used Individually", async () => {
			const Should = await Transform(
				`let x = 10, y = 20, z = 30;
				
				let a = x + y;
				
				
				
				let b = y + z;
				
				
				
				console.log(a, b);`,
			);

			// Ensure that 'x', 'y', and 'z' are inlined into 'a' and 'b'.
			expect(Should).not.to.contain("let x =");

			expect(Should).not.to.contain("let y =");

			expect(Should).not.to.contain("let z =");

			expect(Should).to.match(/let a = 10 \+ 20/);

			expect(Should).to.match(/let b = 20 \+ 30/);
		}) &&
		it("Should Handle Destructuring Correctly When Inlining", async () => {
			const Should = await Transform(
				`const obj = { a: 1, b: 2 };
				
				
				
				let { a, b } = obj;
				
				console.log(a, b);`,
			);

			// Destructured values 'a' and 'b' should be inlined directly from 'obj'.
			expect(Should).not.to.contain("const obj =");

			expect(Should).to.match(/let a = 1/);

			expect(Should).to.match(/let b = 2/);
		}) &&
		it("Should Not Inline Object Properties Used More Than Once", async () => {
			const Should = await Transform(
				`const obj = { a: 1, b: 2 };
				
				
				
					let x = obj.a + 1;
					
					
					let y = obj.b + 2;
					
					
					console.log(x, y);`,
			);

			// 'obj' should remain intact since its properties are used more than once.
			expect(Should).to.contain("const obj =");

			expect(Should).to.contain("obj.a + 1");

			expect(Should).to.contain("obj.b + 2");
		}) &&
		it("Should Inline Variables Used In Non Assignment Computations", async () => {
			const Should = await Transform(
				`let a = 5;
				
				let b = a * 3 + 2;
				
				
				
				console.log(b);`,
			);

			// 'a' should be inlined since it is only used in the expression to compute 'b'.
			expect(Should).not.to.contain("let a = 5");

			expect(Should).to.match(/let b = 5 \* 3 \+ 2/);
		}) &&
		it("Should Handle Variables Within Template Literals", async () => {
			const Should = await Transform(
				`let name = "John";
				
				console.log(\`Hello, \${name}!\`);`,
			);

			// Variables nested within template literals need to be inlined.
			expect(Should).not.to.contain('let name = "John"');

			expect(Should).to.match(/console\.log\("Hello, John!"/);
		}) &&
		it("Should Correctly Handle Reassigned Variables Inside Loops", async () => {
			const Should = await Transform(
				`let i = 0;
				
				for (i = 1; i < 3; i++) {}
		
				console.log(i);`,
			);

			// Since 'i' is reassigned inside the loop, inlining should not happen.
			expect(Should).to.contain("let i = 0");

			expect(Should).to.contain("console.log(i)");
		}) &&
		it("Should Preserve Variable Values That Are Used In Delayed Execution Contexts (e.g. Set Timeout)", async () => {
			const Should = await Transform(
				`let x = 5;
				
				setTimeout(() => {
				
				console.log(x);
				
				
				
					}, 1000);`,
			);

			// 'x' in a setTimeout should be preserved due to delayed execution.
			expect(Should).to.contain("let x = 5");

			expect(Should).to.contain("setTimeout");
		}) &&
		it("Should Warn And Stop Infinite Inlining When Dependent Variables Have Circular Dependencies", async () => {
			const Should = await Transform(
				`let x = y + 1;
				
				let y = x * 2;
				
				
				
				console.log(x, y);`,
			);

			// Expect a warning for potential infinite inlining if circular dependencies in variables are detected.
			expect(Should).to.contain(
				"Potential infinite loop detected in AST transformations!",
			);
		}) &&
		it("Should Correctly Inline Variables When Their Values Are Directly Involved In Complex Computations", async () => {
			const Should = await Transform(
				`let a = 3;
				
				let b = 4;
				
				
				
				let Should = (a + b) * a;
				
				
				
				console.log(Should);`,
			);

			// Both 'a' and 'b' should be inlined into 'Should'.
			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");

			expect(Should).to.match(/let Should = \(3 \+ 4\) \* 3/);
		}) &&
		it("Should Handle Variables Used In Multiple Callbacks Correctly", async () => {
			const Should = await Transform(
				`let a = 1;
				
				setTimeout(() => console.log(a), 100);
				
				
				
				setInterval(() => console.log(a), 1000);`,
			);

			// Inlining should not remove 'a' because it is used in multiple asynchronous callbacks.
			expect(Should).to.contain("let a = 1");

			expect(Should).to.contain("setTimeout");

			expect(Should).to.contain("setInterval");
		})) &&
	describe("Advanced Multi-Pass and Nested Scope Inlining Tests", async () => {
		it("Should Inline A Chain Of Variables Across Multiple Passes", async () => {
			const Should = await Transform(
				`let a = 1;
				
				
				let b = a;
				
				
				let c = b;
				
				
				let d = c + 2;
				
				
				console.log(d);`,
			);

			expect(Should).not.to.contain("let a =");

			expect(Should).not.to.contain("let b =");

			expect(Should).not.to.contain("let c =");

			// The final expression for d should compute as (1 + 2) or an equivalent arithmetic expression.
			expect(Should).to.match(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\)/);
		}) &&
			it("Should Inline Variables In Deeply Nested Function Scopes", async () => {
				const Should = await Transform(
					`let a = 3;
				
					function outer() {
				
				  let b = a + 1;
				  function inner() {
				  
					let c = b + 2;
				
					function innermost() {
					
					  return c * 3;
					  
					  
					}

					return innermost();
				
					}

				  return inner();
				  }

				console.log(outer());`,
				);

				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				expect(Should).not.to.contain("let c =");

				expect(Should).to.match(/console\.log\(.+\)/);
			}) &&
			it("Should Preserve Variables That Are Redefined In Nested Scopes", async () => {
				const Should = await Transform(
					`let a = 5;
				
					function f() {
				
				  let a = 10;
				  return a;
				  }

				a = 15;
				
				
				console.log(a, f());`,
				);

				// The outer 'a' is redefined and then reassigned, so it should be preserved.
				expect(Should).to.contain("let a = 5");

				expect(Should).to.contain("a = 15");

				// The inner 'a' within f() must remain separate.
				expect(Should).to.contain("let a = 10");
			}) &&
			it("Should Inline Variables Used Inside Conditional (ternary) Expressions", async () => {
				const Should = await Transform(
					`let a = 2;
				
					let b = a > 1 ? a + 3 : a - 3;
				
				
				console.log(b);`,
				);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(
					/console\.log\(\s*\(?2\s*>\s*1\s*\?\s*2\s*\+\s*3\s*:\s*2\s*-\s*3\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline Loop Variables That Are Reassigned", async () => {
				const Should = await Transform(
					`let i = 0;
				
					for (; i < 3; i++) {
				
				  console.log(i);
				  }`,
				);

				// 'i' is used as a loop counter (and is modified), so it should remain intact.
				expect(Should).to.contain("let i = 0");

				expect(Should).to.contain("i < 3");
			}) &&
			it("Should Inline Variables In Single Use Arrow Functions", async () => {
				const Should = await Transform(
					`let a = 10;
				
					const fn = () => a * 2;
				
				
				console.log(fn());`,
				);

				expect(Should).not.to.contain("let a =");

				// Check that the arrow function returns an expression containing literal arithmetic.
				expect(Should).to.match(/return\s+10\s*\*\s*2/);
			}) &&
			it("Should Handle Multi Pass Inlining In Complex Arithmetic Expressions", async () => {
				const Should = await Transform(
					`let x = 2;
				
					let y = x + 3;
				
				
				let z = y * (x + 1);
				
				
				console.log(z);`,
				);

				expect(Should).not.to.contain("let x =");

				expect(Should).not.to.contain("let y =");

				// The final expression should inline x and y into z's computation.
				expect(Should).to.match(
					/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*\(?2\s*\+\s*1\)?\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline Variables That Are Captured And Later Modified In Closures", async () => {
				const Should = await Transform(
					`let counter = 0;
				
					function increment() {
				
				  counter++;
				  return counter;
				  }

				console.log(increment(), counter);`,
				);

				// 'counter' is modified inside the closure and later; it should be preserved.
				expect(Should).to.contain("let counter = 0");

				expect(Should).to.contain("counter++");
			}) &&
			it("Should Inline Variables Used In Nested Object Property Assignments", async () => {
				const Should = await Transform(
					`let base = 5;
				
					const obj = {
				
				  value: base + 10,
				  calc() {
				  
					return base * 2;
				
					}

				};
				
				
				console.log(obj.value, obj.calc());`,
				);

				expect(Should).not.to.contain("let base =");

				expect(Should).to.match(/value:\s*\(?5\s*\+\s*10\)?/);

				expect(Should).to.match(/return\s+5\s*\*\s*2/);
			}) &&
			it("Should Inline Variables Across Multiple Syntactic Constructs In One Pass", async () => {
				const Should = await Transform(
					`let a = 1;
				
					let b = a + 2;
				
				
				function foo() {
				
				  let c = b * 3;
				  return c - a;
				  }

				console.log(foo(), b);`,
				);

				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				// The output should contain inlined expressions for 'a' and 'b' where they are used.
				expect(Should).to.match(
					/console\.log\(\s*foo\(\),\s*\(?1\s*\+\s*2\)?\s*\)/,
				);
			}) &&
			it("Should Handle Conditional Redefinitions Across If/else Blocks", async () => {
				const Should = await Transform(
					`let a = 4;
				
					if (a > 2) {
				
				  let b = a + 1;
				  console.log(b);
				  } else {
				 
				  let b = a - 1;
				
				
				  console.log(b);
				  }

				console.log(a);`,
				);

				// 'a' is inlinable if safe, but each branch has its own 'b' that must remain.
				expect(Should).not.to.contain("let a = 4");

				expect(Should).to.contain("let b =");

				expect(Should).to.match(/console\.log\(\s*(4|a)\s*\)/);
			}) &&
			it("Should Correctly Inline Variables Within Nested Ternary Operators", async () => {
				const Should = await Transform(
					`let a = 5;
				
					let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
				
				
				console.log(b);`,
				);

				expect(Should).not.to.contain("let a =");

				// The inlined version should reflect the nested ternary structure with literal '5'.
				expect(Should).to.match(
					/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/,
				);
			}) &&
			it("Should Inline Variables Inside Immediately Invoked Function Expressions ( IIFE)", async () => {
				const Should = await Transform(
					`let a = 3;
				
					(function() {
				
				  console.log(a + 4);
				  })();`,
				);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/console\.log\(\s*3\s*\+\s*4\s*\)/);
			}) &&
			it("Should Inline Variables Declared In For Loop Initializers When Not Reassigned", async () => {
				const Should = await Transform(
					`for (let i = 0, j = i + 2; i < 3; i++) {
					
				  console.log(j);
				  }`,
				);

				// 'i' is used in the loop header and mutated; however, if 'j' is inlinable (used only once),
				// then it should be replaced with the inlined value from 'i' if safe.
				expect(Should).to.contain("let i = 0");

				expect(Should).not.to.contain("let j =");

				expect(Should).to.match(
					/console\.log\(\s*\(?0\s*\+\s*2\)?\s*\)/,
				);
			}) &&
			it("Should Inline Variables Inside Function Expressions That Are Immediately Invoked", async () => {
				const Should = await Transform(
					`let a = 7;
				
					const Should = (function() {
				
				  return a * 3;
				  })();
				
				
				console.log(Should);`,
				);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/return\s+7\s*\*\s*3/);

				expect(Should).to.match(/console\.log\(\s*Should\s*\)/);
			});
	}) &&
	describe("Even More Advanced Inlining Tests - Additional Scenarios", async () => {
		it("Should Inline A Variable In A Switch Case When Used Only In One Case", async () => {
			const Should = await Transform(`let a = 10;
			
switch (value) {

			  case 1:
				console.log(a + 1);
				
				
				break;
				
				
			  case 2:
				console.log("no usage");
				
				
				break;
				
				
			}

		  `);

			// 'a' is referenced only in one branch (one usage), so it should be inlined.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*\(?10\s*\+\s*1\)?\s*\)/);
		}) &&
			it("Should Not Inline A Variable Declared Before Try/catch If Used In Both Try And Catch", async () => {
				const Should = await Transform(`let a = 5;
			
try {

			  console.log(a + 2);
			  
			  
			} catch (e) {
			 
			  console.error(a);
			  
			  
			}

		  `);

				// 'a' is used in both try and catch blocks, so its reference count is high.
				expect(Should).to.contain("let a = 5");
			}) &&
			it("Should Inline A Variable Declared Before Try/catch If Used Only In Try", async () => {
				const Should = await Transform(`let a = 5;
			
try {

			  console.log(a + 2);
			  
			  
			} catch (e) {
			 
			  console.error(e);
			  
			  
			}

		  `);

				// 'a' is used only in the try block so it should be inlined.
				expect(Should).not.to.contain("let a = 5");

				expect(Should).to.match(
					/console\.log\(\s*\(?5\s*\+\s*2\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline A Variable In A Generator Function If Its Initializer Involves Yield", async () => {
				const Should = await Transform(`function* gen() {
					
			  let a = yield 3;
			  
			  
			  return a + 1;
			  
			  
			}

			const g = gen();
			
console.log(g.next().value);`);

				// The presence of a yield expression in the initializer prevents inlining.
				expect(Should).to.contain("let a =");
			}) &&
			it("Should Inline A Variable Used In Computed Property Names", async () => {
				const Should = await Transform(`let a = 4;
			
const obj = {

			  [a + 2]: "computed"
			};
			
console.log(obj);`);

				// 'a' should be inlined so that the computed property shows an arithmetic expression.
				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/\[\s*\(?4\s*\+\s*2\)?\s*\]/);
			}) &&
			it("Should Inline A Variable Used Inside A Template Literal", async () => {
				const Should = await Transform(`let a = "hello";
			
const str = \`Message: \${a} world\`;
			
console.log(str);`);

				// 'a' should be inlined to yield the literal "hello" in the template.
				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/`Message:\s*hello\s*world`/);
			}) &&
			it("Should Inline Variables In Nested Arrow Functions", async () => {
				const Should = await Transform(`let a = 2;
			
const outer = () => {

			  const inner = () => a + 3;
			  
			  
			  return inner();
			  
			  
			};
			
console.log(outer());`);

				// 'a' should be inlined in the nested arrow function.
				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/return\s+2\s*\+\s*3/);
			}) &&
			it("Should Inline A Variable Used Only In An If Statement Condition", async () => {
				const Should = await Transform(`let a = 8;
			
if (a > 5) {

			  console.log("big");
			  
			  
			}

		  `);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/if\s*\(\s*8\s*>\s*5\s*\)/);
			}) &&
			it("Should Inline A Chain Of Assignments In Multi Pass Inlining", async () => {
				const Should = await Transform(`let a = 1;
			
let b = a;
			
let c = b;
			
let d = c + 4;
			
console.log(d);`);

				// Expect a, b, and c to be inlined so that d becomes (1 + 4)
				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				expect(Should).not.to.contain("let c =");

				expect(Should).to.match(
					/console\.log\(\s*\(?1\s*\+\s*4\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline Destructured Variables", async () => {
				const Should =
					await Transform(`const { a, b } = { a: 10, b: 20 };
			
const sum = a + b;
			
console.log(sum);`);

				// Destructured variables should be preserved.
				expect(Should).to.contain("{ a, b }");

				expect(Should).to.match(/a\s*\+\s*b/);
			}) &&
			it("Should Inline A Constant Variable In A Computed Arithmetic Expression", async () => {
				const Should = await Transform(`const a = 5;
			
const b = (a * 2) + (a - 3);
			
console.log(b);`);

				// With Option.Const false by default, 'a' can be inlined.
				expect(Should).not.to.contain("const a =");

				expect(Should).to.match(
					/console\.log\(\s*\(?\(5\s*\*\s*2\)\s*\+\s*\(5\s*-\s*3\)\)?\s*\)/,
				);
			}) &&
			it("Should Mix Inlined And Preserved Variables Based On Usage Frequency", async () => {
				const Should = await Transform(`let a = 1;
			
let b = a + 2;
			
let c = 3;
			
b = b + c;
			
console.log(b);`);

				// 'a' is only used in the initialization of b and can be inlined;

				// 'b' and 'c' are used in reassignment or multiple places and should be preserved.
				expect(Should).not.to.contain("let a =");

				expect(Should).to.contain("let b =");

				expect(Should).to.contain("let c =");
			}) &&
			it("Should Inline Function Expressions Assigned To Variables When Safe", async () => {
				const Should =
					await Transform(`const foo = function() { return 42; };
			
const Should = foo();
			
console.log(Should);`);

				// With Option.Function disabled by default, function expressions may be inlined.
				expect(Should).not.to.contain("const foo");

				// The call site should reflect an inlined arrow function or equivalent.
				expect(Should).to.match(/console\.log\(\s*.*42.*\)/);
			}) &&
			it("Should Inline Variables In Nested Switch Case Structures", async () => {
				const Should = await Transform(`let a = 2;
			
switch(a) {

			  case 2:
				let b = a + 5;
				
				
				switch(b) {
				
				  case 7:
					console.log("inner:", b);
				
					break;
				
					default:
					console.log("default");
				
					}

				break;
				
				
			  default:
				console.log("outer default");
				
				
			}

		  `);

				// Expect that 'a' is inlined; 'b' should be inlined if its usage is single.
				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");
			}) &&
			it("Should Inline A Variable With A Multi Line Initializer Expression", async () => {
				const Should = await Transform(`let a = (
			  1 +
			  2
			);
			
let b = a * 3;
			
console.log(b);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(
					/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*3\)?\s*\)/,
				);
			}) &&
			it("Should Correctly Inline Variables In Nested Binary Expressions", async () => {
				const Should = await Transform(`let a = 1;
			
let b = (a + 2) * (a - 3);
			
console.log(b);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(
					/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*\(1\s*-\s*3\)\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline A Variable Used Before Its Declaration", async () => {
				const Should = await Transform(`console.log(a);
			
let a = 10;`);

				// Because 'a' is referenced before its declaration, inlining should not occur.
				expect(Should).to.contain("let a = 10");

				expect(Should).to.match(/console\.log\(\s*a\s*\)/);
			}) &&
			it("Should Not Inline Variables With Circular Dependencies", async () => {
				const Should = await Transform(`let a = b + 1;
			
let b = a + 1;
			
console.log(a, b);`);

				// Circular dependencies should prevent inlining.
				expect(Should).to.contain("let a =");

				expect(Should).to.contain("let b =");
			});
	}) &&
	describe("Additional Edge Case Inlining Tests - Round 3", async () =>
		// Assumes the existence of a helper function `await Transform(source: string, optionOverrides?: Partial<Option>): string>`		// that creates a TS Program, applies the inliner transformation, and returns the printed output.

		it("Should Inline A Variable Used In A Default Parameter Expression", async () => {
			const Should = await Transform(`let a = 5;
		
			function f(x = a + 3) { return x; }

	console.log(f());`);

			// Expect 'a' to be inlined in the default parameter, turning (a + 3) into (5 + 3)
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/function f\([^)]*=\s*\(?5\s*\+\s*3\)?\)/);
		}) &&
		it("Should Inline A Variable Used In An Optional Chaining Expression", async () => {
			const Should = await Transform(`let a = { b: 10 };
		
			console.log(a?.b);`);

			// 'a' should be inlined so that the optional chain uses the literal object
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/\(\s*\{ b:\s*10\s*\}\s*\)\?\./);
		}) &&
		it("Should Inline A Variable Used In A Nullish Coalescing Expression", async () => {
			const Should = await Transform(`let a = null;
		
			let b = a ?? 7;
		
				console.log(b);`);

			// 'a' should be inlined so that (null ?? 7) is computed at the call site,
			// but note that if the safety checks prevent inlining due to the nature of null,
			// then 'a' might remain. This test assumes safe inlining if used only once.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/let b =\s*\(?null\s*\?\?\s*7\)?/);
		}) &&
		it("Should Inline A Variable Used Within An Array Method Callback", async () => {
			const Should = await Transform(`let a = 3;
		
			const arr = [1, 2, 3].map(x => x + a);
		
				console.log(arr);`);

			// 'a' is used only inside the arrow callback, so it should be inlined.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/x\s*\+\s*3/);
		}) &&
		it("Should Inline A Variable Used In A Computed Property Key", async () => {
			const Should = await Transform(`let a = "key";
		
			const obj = { [a + "Name"]: "value" };
		
				console.log(obj);`);

			// Expect that the computed key becomes (("key" + "Name")) without a separate variable declaration.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/\[\s*\(?("key")\s*\+\s*"Name"\)?\s*\]/);
		}) &&
		it("Should Inline A Variable Inside A Try Finally Block", async () => {
			const Should = await Transform(`let a = 4;
		
			try {
			
	  console.log(a + 2);
	  
	} finally {
	 
	  console.log("Done");
	  
	}
  `);

			// 'a' should be inlined in the try block.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*\(?4\s*\+\s*2\)?\s*\)/);
		}) &&
		it("Should Preserve A Variable Declared With Var When Used In Multiple Statements", async () => {
			const Should = await Transform(`var a = 10;
		
			let b = a + 1;
		
				console.log(b);`);

			// Depending on implementation, var variables may not be safe to inline if they're hoisted or reassigned.
			// This test expects that the inliner preserves 'a' because of potential side effects.
			expect(Should).to.contain("var a = 10");

			expect(Should).to.match(/a\s*\+\s*1/);
		}) &&
		it("Should Inline A Variable In A Complex Binary Expression With Mixed Operators", async () => {
			const Should = await Transform(`let a = 2;
		
			let b = a * 3 + a;
		
				console.log(b);`);

			// 'a' should be inlined in both occurrences, yielding an arithmetic expression with proper parenthesis.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(
				/console\.log\(\s*\(?\(2\s*\*\s*3\)\s*\+\s*2\)?\s*\)/,
			);
		}) &&
		it("Should Inline A Variable Used In A Class Method", async () => {
			const Should = await Transform(`let a = 5;
		
			class MyClass {
			
	  method() {
	  
		return a + 2;
		
	  }

	}

	console.log(new MyClass().method());`);

			// 'a' should be inlined in the class method.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/return\s+5\s*\+\s*2/);
		}) &&
		it("Should Inline A Variable Used As A Default Parameter In An Arrow Function", async () => {
			const Should = await Transform(`let a = 3;
		
			const f = (x = a + 2) => x;
		
				console.log(f());`);

			// Expect 'a' to be inlined in the default parameter expression.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/\(x\s*=\s*\(?3\s*\+\s*2\)?\)/);
		}) &&
		it("Should Inline A Variable Used In A For Of Loop", async () => {
			const Should = await Transform(`let a = 5;
		
			for (const item of [1, 2, 3]) {
			
	  console.log(item + a);
	  
	}
  `);

			// 'a' should be inlined inside the loop body.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*item\s*\+\s*5\s*\)/);
		}) &&
		it("Should Inline A Variable Used In A For In Loop", async () => {
			const Should = await Transform(`let a = "test";
		
			for (const key in { key: a }) {
			
	  console.log(key, a);
	  
	}
  `);

			// 'a' should be inlined if used only once per occurrence.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*key,\s*"test"\s*\)/);
		}) &&
		it("Should Inline A Variable Used Inside An Object Spread Expression", async () => {
			const Should = await Transform(`let a = 10;
		
			const obj = { ...{ value: a + 5 } };
		
				console.log(obj);`);

			// 'a' should be inlined in the computed property inside the object literal.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/value:\s*\(?10\s*\+\s*5\)?/);
		}) &&
		it("Should Inline A Variable Inside An Immediately Invoked Arrow Function", async () => {
			const Should = await Transform(`let a = 2;
		
			(() => console.log(a * 3))();
	 
  `);

			// 'a' should be inlined in the arrow function body.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*2\s*\*\s*3\s*\)/);
		}) &&
		it("Should Inline A Variable Used In A Logical AND Expression", async () => {
			const Should = await Transform(`let a = true;
		
			let b = a && 5;
		
				console.log(b);`);

			// 'a' should be inlined in the logical expression.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/let b =\s*\(?true\s*&&\s*5\)?/);
		}) &&
		it("Should Inline A Variable Used In A Logical OR Expression", async () => {
			const Should = await Transform(`let a = false;
		
			let b = a || 7;
		
				console.log(b);`);

			// 'a' should be inlined in the logical expression.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/let b =\s*\(?false\s*\|\|\s*7\)?/);
		}) &&
		it("Should Inline A Variable Used In Nested Ternary Operators With Multiple Conditions", async () => {
			const Should = await Transform(`let a = 5;
		
			let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
		
				console.log(b);`);

			// 'a' should be inlined in all parts of the nested ternary.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(
				/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/,
			);
		})) &&
	describe("Even More Extra Inlining Tests - Round 4", async () => {
		// Assumes the existence of a helper function `await Transform(source: string, optionOverrides?: Partial<Option>): string>`		// that creates a TS Program, applies the inliner transformation, and returns the printed output.

		it("Should Inline A Variable Used In An Array Literal Element", async () => {
			const Should = await Transform(`let a = 5;
		
				const arr = [a, a + 2];
				
				console.log(arr);`);

			// 'a' should be inlined in both occurrences.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/\[ ?5, ?\(5 \+ 2\) ?\]/);
		}) &&
			it("Should Inline A Variable Used As An Argument In A Function Call", async () => {
				const Should = await Transform(`let a = 3;
				
					function foo(x: number) { return x * 2; }
		
				console.log(foo(a));`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/foo\(\s*3\s*\)/);
			}) &&
			it("Should Inline A Variable Used Inside A Class Static Method", async () => {
				const Should = await Transform(`let a = 7;
				
					class MyClass {
				
					static getValue() {
					
					return a + 1;
					}
		
					}
		
					console.log(MyClass.getValue());`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/return\s+7\s*\+\s*1/);
			}) &&
			it("Should Inline A Variable Used In A Template Literal With Embedded Expression", async () => {
				const Should = await Transform(`let a = "world";
				
					const greeting = \`Hello, \${a}!\`;
				
					console.log(greeting);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/`Hello,\s*world!`/);
			}) &&
			it("Should Inline A Variable Used In A Chained Binary Expression Across Multiple Passes", async () => {
				const Should = await Transform(`let a = 2;
				
					let b = a + 3;
				
					let c = b * 4;
				
				let d = c - a;
				
				console.log(d);`);

				// Both 'a' and 'b' and 'c' should be inlined into 'd'
				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				expect(Should).not.to.contain("let c =");

				// Final expression should be a combination of inlined values.
				expect(Should).to.match(
					/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*4\s*-\s*2\)?\s*\)/,
				);
			}) &&
			it("Should Inline A Variable Used In An Arrow Function That Is Immediately Invoked", async () => {
				const Should = await Transform(`let a = 10;
				
					(() => console.log(a - 4))();`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/console\.log\(\s*10\s*-\s*4\s*\)/);
			}) &&
			it("Should Inline A Variable Used In A Nested Conditional (ternary) Expression", async () => {
				const Should = await Transform(`let a = 5;
				
					let Should = a > 3 ? (a < 8 ? a * 2 : a * 3) : a - 1;
				
					console.log(Should);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(
					/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*8\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/,
				);
			}) &&
			it("Should Inline A Variable Used In A For Of Loop Body When Safe", async () => {
				const Should = await Transform(`let a = 4;
				
					const arr = [1, 2, 3];
				
					for (const item of arr) {
				
					console.log(item + a);
					
		
				}`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/console\.log\(\s*item\s*\+\s*4\s*\)/);
			}) &&
			it("Should Inline A Variable In A Complex Nested Function With Multiple Scopes", async () => {
				const Should = await Transform(`let a = 2;
				
					function outer() {
				
					let b = a + 3;
					function inner() {
					
					let c = b * 4;
					return c - a;
					}
		
					return inner();
					
		
				}
		
				console.log(outer());`);

				// 'a' and 'b' should be inlined if safe; inner function may only show inlined arithmetic.
				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				expect(Should).to.match(
					/return\s+\(?\(2\s*\+\s*3\)\s*\*\s*4\s*-\s*2\)?/,
				);
			}) &&
			it("Should Inline A Chain Of Variables When One Variable's Value Is Used Only Once", async () => {
				const Should = await Transform(`let a = 1;
				
					let b = a;
				
					let c = b;
				
				console.log(c + 10);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).not.to.contain("let b =");

				// The final expression should resolve to (1 + 10)
				expect(Should).to.match(
					/console\.log\(\s*\(?1\s*\+\s*10\)?\s*\)/,
				);
			}) &&
			it("Should Not Inline A Variable If It Is Used In A Side Effectful Function Call", async () => {
				const Should = await Transform(`let a = Math.random();
				
					function log(x: number) { console.log(x); }
		
				log(a);`);

				// Due to potential side effects from Math.random(), inlining may be considered unsafe.
				expect(Should).to.contain("let a =");

				expect(Should).to.match(/log\(\s*a\s*\)/);
			}) &&
			it("Should Not Inline A Variable If It Is Declared With Var And Might Be Hoisted", async () => {
				const Should = await Transform(`var a = 20;
				
					function foo() { return a; }
		
				console.log(foo());`);

				// 'var' declarations may be preserved due to hoisting concerns.
				expect(Should).to.contain("var a = 20");
			}) &&
			it("Should Inline A Variable Used In A Logical OR Expression With Correct Parenthesis", async () => {
				const Should = await Transform(`let a = 0;
				
					let b = a || 5;
				
					console.log(b);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/let b =\s*\(?0\s*\|\|\s*5\)?/);
			}) &&
			it("Should Inline A Variable Used In A Logical AND Expression With Correct Parenthesis", async () => {
				const Should = await Transform(`let a = true;
				
					let b = a && 10;
				
					console.log(b);`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/let b =\s*\(?true\s*&&\s*10\)?/);
			}) &&
			it("Should Inline A Variable Used In A Compound Assignment Expression", async () => {
				const Should = await Transform(`let a = 3;
				
					let b = a;
				
					b += 7;
				
				console.log(b);`);

				// 'a' might be inlined if it's only used in the initialization of b.
				expect(Should).not.to.contain("let a =");

				// 'b' is modified so it should be preserved.
				expect(Should).to.contain("let b =");

				expect(Should).to.match(/b \+= 7/);
			}) &&
			it("Should Inline A Variable Used In A Nested Object Literal With Method Shorthand", async () => {
				const Should = await Transform(`let a = 8;
				
					const obj = {
				
					value: a + 2,
					method() {
					
					return a * 2;
					}
		
					};
				
					console.log(obj.value, obj.method());`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/value:\s*\(?8\s*\+\s*2\)?/);

				expect(Should).to.match(/return\s+8\s*\*\s*2/);
			}) &&
			it("Should Inline A Variable Used In An Immediately Invoked Function Expression Inside A Class Constructor", async () => {
				const Should = await Transform(`let a = 9;
				
					class MyClass {
				
					constructor() {
					
					(() => console.log(a - 4))();
					 
					 
					}
		
					}
		
					new MyClass();`);

				expect(Should).not.to.contain("let a =");

				expect(Should).to.match(/console\.log\(\s*9\s*-\s*4\s*\)/);
			});
	}) &&
	describe("Highly Advanced Inlining Tests - Round 5", async () =>
		it("Should Handle Inlining In An Async Arrow Function With Nested Await", async () => {
			const Should = await Transform(
				`let delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
		
				async function run() {
		
			let a = await delay(100);
			
			
			return a;
			
			
		}
		
		run().then(console.log);`,
				{ Async: true },
			);

			// 'a' is assigned an awaited value; inlining should be prevented.
			expect(Should).to.contain("let a =");
		}) &&
		it("Should Inline A Generic Function's Variable When Type Parameters Do Not Affect The Initializer", async () => {
			const Should =
				await Transform(`function identity<T>(x: T): T { return x; }
		
					let a = identity(42);
		
					console.log(a);`);

			// Even though identity is generic, the call identity(42) can be simplified to 42 if safe.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*42\s*\)/);
		}) &&
		it("Should Not Inline A Variable When Its Initializer Has A Type Cast", async () => {
			const Should = await Transform(`let a = (5 as number) + 2;
		
				let b = a * 3;
		
		console.log(b);`);

			// Type casts may block inlining to preserve type information.
			expect(Should).to.contain("let a =");

			expect(Should).to.match(/a \* 3/);
		}) &&
		it("Should Inline Variables Defined With Const In Nested Functions If They Are Not Reassigned", async () => {
			const Should = await Transform(`const a = 10;
		
				function outer() {
		
			function inner() {
			
				return a + 5;
				
			}

			return inner();
			
		}
		
		console.log(outer());`);

			expect(Should).not.to.contain("const a =");

			expect(Should).to.match(/return\s+10\s*\+\s*5/);
		}) &&
		it("Should Not Inline A Variable If It Is Used With A Non Null Assertion Operator", async () => {
			const Should = await Transform(`let a = { value: 3 };
		
				let b = a!.value + 2;
		
		console.log(b);`);

			// The non-null assertion (a!) should preserve the original variable.
			expect(Should).to.contain("let a =");

			expect(Should).to.match(/a!\.value/);
		}) &&
		it("Should Not Inline A Variable Declared In A For Loop Header When It Is Mutated", async () => {
			const Should = await Transform(`for (let i = 0; i < 5; i++) {
			
			console.log(i * 2);
			
			
		}`);

			// 'i' is modified by the loop; inlining must not occur.
			expect(Should).to.contain("let i = 0");
		}) &&
		it("Should Inline A Variable In A Complex Expression Mixing Ternaries, Logical Operators, And Arithmetic", async () => {
			const Should = await Transform(`let a = 3;
		
				let b = a > 2 ? (a < 5 ? a + 1 : a - 1) : (a && 0);
		
		let c = b * 2;
		
		console.log(c);`);

			// 'a' should be replaced with 3 throughout b's definition.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(
				/console\.log\(\s*\(?\(3\s*>\s*2\s*\?.*\)\s*\*\s*2\)?\s*\)/,
			);
		}) &&
		it("Should Preserve Destructured Variables And Not Attempt To Inline Them", async () => {
			const Should = await Transform(`let data = { a: 1, b: 2, c: 3 };
		
				let { a, b } = data;
		
		let sum = a + b;
		
		console.log(sum);`);

			// Destructuring should remain intact.
			expect(Should).to.contain("let { a, b } = data");

			expect(Should).to.match(/a \+ b/);
		}) &&
		it("Should Inline A Variable Defined Using Computed Property Access If Safe", async () => {
			const Should = await Transform(`let obj = { x: 5 };
		
				let a = obj.x;
		
		let b = a * 2;
		
		console.log(b);`);

			// 'a' should be eliminated in favor of directly using 'obj.x' in b.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/obj\.x\s*\*\s*2/);
		}) &&
		it("Should Inline A Variable That Is Used In A Chained Method Call", async () => {
			const Should = await Transform(`let prefix = "Mr. ";
		
				let name = "Smith";
		
		let fullName = [prefix, name].join("");
		
		console.log(fullName);`);

			// Both 'prefix' and 'name' should be inlined if they are single-use.
			expect(Should).not.to.contain("let prefix =");

			expect(Should).not.to.contain("let name =");

			expect(Should).to.match(/\[\s*"Mr\.\s*"\s*,\s*"Smith"\s*\]/);
		}) &&
		it("Should Inline A Variable Used Within A Class Static Block", async () => {
			const Should = await Transform(`let a = 42;
		
				class MyClass {
		
			static {
			
			console.log(a + 1);
			
			
			}
		
			}`);

			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/console\.log\(\s*42\s*\+\s*1\s*\)/);
		}) &&
		it("Should Inline A Variable In A Complex Nested Arrow Function With Multiple Closures", async () => {
			const Should = await Transform(`let a = 5;
		
				const f = () => {
		
			const g = () => {
			
			const h = () => a + 2;
			
			
			return h();
			
			
			};
			
			
			return g();
			
			
		};
		
		console.log(f());`);

			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/return\s+5\s*\+\s*2/);
		}) &&
		it("Should Inline A Variable Used In A Nested IIFE That Returns A Function", async () => {
			const Should = await Transform(`let a = 3;
		
				const f = (function() {
		
			return function() { return a * 3; }
		
			})();
		
		console.log(f());`);

			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/return\s+3\s*\*\s*3/);
		}) &&
		it("Should Inline A Variable Used In A Tagged Template Literal If Safe", async () => {
			const Should =
				await Transform(`let tag = (strings: TemplateStringsArray, ...values: any[]) => strings[0] + values[0];
		
					let a = 100;
		
		const message = tag\`Value is: \${a}\`;
		
		console.log(message);`);

			// 'a' should be inlined so that the template literal contains the literal value.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.match(/`Value is:\s*100`/);
		}) &&
		it("Should Not Inline A Variable If It Is Used In A Compound Assignment", async () => {
			const Should = await Transform(`let a = 3;
		
				let b = a;
		
		b += 7;
		
		console.log(b);`);

			// 'a' is used only in initializing b and can be inlined, but b itself is modified.
			expect(Should).not.to.contain("let a =");

			expect(Should).to.contain("let b =");

			expect(Should).to.match(/b \+= 7/);
		})) &&
	// OLD ONES
	describe("Variable Inlining", async () =>
		it("Should Inline Simple Constant Declarations", async () =>
			await Equal(
				`const x = 5;
				
				console.log(x);`,

				"console.log(5);",
			)) &&
		it("Should Inline Let Declarations", async () =>
			await Equal(
				`let x = 5;
				
				console.log(x);`,

				"console.log(5);",
			)) &&
		it("Should Inline Var Declarations", async () =>
			await Equal(
				`var x = 5;
				
				console.log(x);`,

				"console.log(5);",
			)) &&
		it("Should Not Inline Variables Used Multiple Times", async () =>
			await Equal(
				`const x = 5;
				
				console.log(x);
				
				console.log(x);`,

				`const x = 5;
				
				console.log(x);
				
				console.log(x);`,
			)) &&
		it("Should Handle Unused Variables", async () =>
			await Equal(
				`const x = 5;
				
				const y = 10;
				
				console.log(x);`,

				`const y = 10;
				
				console.log(5);`,
			))) &&
	describe("Expression Inlining", async () =>
		it("Should Inline Arithmetic Expressions", async () =>
			await Equal(
				`const x = 5 * 2;
				
				console.log(x);`,

				"console.log(5 * 2);",
			)) &&
		it("Should Inline String Concatenations", async () =>
			await Equal(
				`const x = "Hello" + " World";
				
				console.log(x);`,

				`console.log("Hello" + " World");`,
			)) &&
		it("Should Inline Object Literals", async () =>
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
			)) &&
		it("Should Inline Array Literals", async () =>
			await Equal(
				`const x = [ 1, 2, 3 ];
				
				console.log(x);`,

				"console.log([ 1, 2, 3 ]);",
			)) &&
		it("Should Maintain Operator Precedence", async () =>
			await Equal(
				`const x = 5;
				
				const y = x * 2;
				
				console.log(y);`,

				"console.log(5 * 2);",
			))) &&
	describe("Function Inlining", async () =>
		it("Should Inline Simple Function Declarations", async () =>
			await Equal(
				`function greet() {
				
					return "Hello";
				
					}

				console.log(greet());`,

				`console.log((() => {
				
					return "Hello";
				
					})());`,
			)) &&
		it("Should Inline Functions With Parameters", async () =>
			await Equal(
				`function greet(name: string) {
				
					return "Hello " + name;
				
					}

				console.log(greet("World"));`,

				`console.log(((name: string) => {
				
					return "Hello " + name;
				
					})("World"));`,
			)) &&
		it("Should Not Inline Functions Used Multiple Times", async () =>
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
			))) &&
	describe("Multiple Reference Scenarios", async () =>
		it("Should Handle Mixed Single And Multiple References", async () =>
			await Equal(
				`const x = 5;
				
				const y = x + 1;
				
				const z = y;
				
				console.log(x);
				
				console.log(z);`,

				`const x = 5;
				
				console.log(x);
				
				console.log(x + 1);`,
			)) &&
		it("Should Handle Chain Of Single Use Variables", async () =>
			await Equal(
				`const a = 1;
				
				const b = a + 1;
				
				const c = b + 1;
				
				const d = c + 1;
				
				console.log(d);`,

				"console.log(1 + 1 + 1 + 1);",
			))) &&
	describe("Complex Cases", async () =>
		it("Should Handle Nested Expressions", async () =>
			await Equal(
				`const x = 5;
				
				const y = x * 2;
				
				const z = y + 3;
				
				console.log(z);`,

				"console.log((5 * 2) + 3);",
			)) &&
		it("Should Handle Multiple Declarations In One Statement", async () =>
			await Equal(
				`const x = 1, y = 2;
				
				console.log(x);`,

				`const y = 2;
				
				console.log(1);`,
			)) &&
		it("Should Preserve Type Annotations", async () =>
			await Equal(
				`const x: number = 5;
				
				console.log(x);`,

				"console.log(5);",
			)) &&
		it("Should Handle Even More Complex Cases", async () =>
			await Equal(
				`const x = 5;
				
				
				const y = x * 2;
				
				const z = y + 3;
				
				const a = z * 4;
				
				const b = a + y;
				
				console.log(b);`,

				`const y = 5 * 2;
				
				
				console.log(((y + 3) * 4) + y);`,
			))) &&
	describe("Function and Object Scenarios", async () =>
		it("Should Handle Function Calls In Expressions", async () => {
			await Equal(
				`const x = Math.random();
				
				const y = x * 2;
				
				console.log(y);`,

				"console.log(((Math.random() * 2)));",
			);
		}) &&
		it("Should Handle Object Properties", async () => {
			await Equal(
				`const obj = { value: 5 };
				
				const x = obj.value;
				
				console.log(x);`,

				"console.log({ value: 5 }.value);",
			);
		})) &&
	describe("Edge Cases", async () =>
		it("Should Handle Empty Declarations", async () =>
			await Equal(
				`let x;
				
				x = 5;
				
				console.log(x);`,

				`let x;
				
				x = 5;
				
				console.log(x);`,
			)) &&
		it("Should Respect Comments When Option Enabled", async () => {
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

				"console.log(5);",

				{
					Comment: false,
				},
			);
		}) &&
		it("Should Handle Complex Nested Expressions With Mixed Usage", async () =>
			await Equal(
				`const a = 1;
				
				const b = a + 2;
				
				const c = b + 3;
				
				const d = c + a;
				
				const e = d + b;
				
				console.log(e);`,

				`const a = 1;
				
				const b = a + 2;
				
				console.log(b + 3 + a + b);`,
			))) &&
	describe("Safety Checks", async () =>
		it("Should Inline Function Calls", async () =>
			await Equal(
				`const x = Math.random();
				
				console.log(x);`,

				"console.log(Math.random());",
			)) &&
		it("Should Inline Async/await Expressions", async () =>
			await Equal(
				`const x = await Promise.resolve(5);
				
				console.log(x);`,

				"console.log(await Promise.resolve(5));",
			)) &&
		it("Should Inline New Expressions", async () =>
			await Equal(
				`const x = new Date();
				
				console.log(x);`,

				"console.log(new Date());",
			))) &&
	describe("Scope Handling", async () =>
		it("Should Respect Block Scope", async () =>
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
			)) &&
		it("Should Handle Variables In Loops Correctly", async () =>
			await Equal(
				`for (let i = 0; i < 3; i++) {
				
					const x = i * 2;
					
					

					console.log(x);
				
					}`,

				`for (let i = 0; i < 3; i++) {
				
					console.log(i * 2);
				
					}`,
			))) &&
	describe("TypeScript-specific Features", async () =>
		it("Should Handle Interface Declarations", async () => {
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
		}) &&
		it("Should Handle Enum Usage", async () => {
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
		}) &&
		it("Should Handle Generic Functions", async () => {
			await Equal(
				`function identity<T>(x: T): T {
				
					return x;
				
					}

				const Should = identity(5);
				
				console.log(Should);`,

				`function identity<T>(x: T): T {
				
					return x;
				
					}

				console.log(identity(5));`,
			);
		})) &&
	describe("Error Cases", async () =>
		it("Should Handle Undefined Variables Gracefully", async () => {
			await Equal(
				"console.log(undefinedVar);",

				"console.log(undefinedVar);",
			);
		}) &&
		it("Should Handle Syntax Errors Gracefully", () =>
			Output("const x = ;").catch((error) =>
				expect(error).instanceOf(Error),
			)) &&
		it("Should Handle Incomplete Code Gracefully", async () =>
			Output("const x =").catch((error) =>
				expect(error).instanceOf(Error),
			))) &&
	describe("Advanced Cases", () =>
		it("Should Inline Variables With Template Literals", async () =>
			await Equal(
				`const greeting = \`Hello, World\`;
				
				console.log(greeting);`,

				"console.log(`Hello, World`);",
			)) &&
		it("Should Inline Variables In Conditional (ternary) Expressions", async () =>
			await Equal(
				`const x = true ? 1 : 2;
				
				console.log(x);`,

				"console.log((true ? 1 : 2));",
			)) &&
		it("Should Inline Variables With Logical Operators", async () =>
			await Equal(
				`const x = true && false;
				
				console.log(x);`,

				"console.log((true && false));",
			)) &&
		it("Should Not Inline Variables That Are Reassigned", async () =>
			await Equal(
				`let x = 5;
				
				x = 10;
				
				console.log(x);`,

				`let x = 5;
				
				x = 10;
				
				console.log(x);`,
			)) &&
		it("Should Handle Computed Property Names", async () =>
			await Equal(
				`const key = "value";
				
				const obj = { [key]: 123 };
				
				console.log(obj);`,

				`console.log({ ["value"]: 123 });`,
			)) &&
		it("Should Inline Variables With Type Assertions", async () =>
			await Equal(
				`const x = 5 as number;
				
				console.log(x);`,

				"console.log(5 as number);",
			))) &&
	describe("Destructuring and Spread", () =>
		it("Should Leave Destructured Object Variables Untouched", async () =>
			await Equal(
				`const { a, b } = { a: 1, b: 2 };
				
				console.log(a);`,

				`const { a, b } = { a: 1, b: 2 };
				
				console.log(a);`,
			)) &&
		it("Should Leave Array Destructuring Unchanged", async () =>
			await Equal(
				`const [x, y] = [10, 20];
				
				console.log(y);`,

				`const [x, y] = [10, 20];
				
				console.log(y);`,
			)) &&
		it("Should Handle Rest Elements In Destructuring", async () =>
			await Equal(
				`const [head, ...tail] = [1, 2, 3, 4];
				
				console.log(tail);`,

				`const [head, ...tail] = [1, 2, 3, 4];
				
				console.log(tail);`,
			)) &&
		it("Should Inline Variables In Spread Expressions In Arrays", async () =>
			await Equal(
				`const nums = [1, 2];
				
				const moreNums = [...nums, 3];
				
				console.log(moreNums);`,

				"console.log([...[1, 2], 3]);",
			))) &&
	describe("Arrow Functions and IIFE", () =>
		it("Should Inline Arrow Functions Assigned To Variables", async () =>
			await Equal(
				`const add = (a: number, b: number) => a + b;
				
				console.log(add(1, 2));`,

				"console.log(((a: number, b: number) => a + b)(1, 2));",
			)) &&
		it("Should Inline Immediately Invoked Arrow Functions", async () =>
			await Equal(
				`const Should = ((x: number) => x * 2)(5);
				
				console.log(Should);`,

				"console.log(((x: number) => x * 2)(5));",
			))) &&
	describe("Loop and Scope Advanced", () =>
		it("Should Inline Variables Inside While Loops", async () =>
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
			)) &&
		it("Should Inline Variables When Shadowed In Nested Functions", async () =>
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
				
					(() => {
					 
						console.log(20);
						
						
					})();
				
					})();
				
					console.log(10);`,
			))) &&
	describe("Miscellaneous", () =>
		it("Should Inline Variables In Chained Function Calls", async () =>
			await Equal(
				`const x = Math.abs(-5);
				
				console.log(String(x).padStart(3, "0"));`,

				`console.log(String(Math.abs(-5)).padStart(3, "0"));`,
			)) &&
		it("Should Inline Variables With Complex Nested Ternary Operators", async () =>
			await Equal(
				`const x = true ? (false ? 1 : 2) : 3;
				
				console.log(x);`,

				"console.log((true ? (false ? 1 : 2) : 3));",
			)) &&
		it("Should Inline Variables In Try Catch Blocks", async () =>
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
			)) &&
		it("Should Inline Variables In Template Literal Expressions With Embedded Variables", async () =>
			await Equal(
				`const adj = "awesome";
				
				const sentence = \`This is \${adj}!\`;
				
				console.log(sentence);`,

				`console.log(\`This is \${"awesome"}!\`);`,
			))) &&
	describe("Error Cases Extended", () =>
		it("Should Pass Through Runtime Errors For Undefined Variables", async () => {
			await Equal(
				"console.log(nonExistentVar);",

				"console.log(nonExistentVar);",
			);
		}) &&
		it("Should Report Syntax Errors For Incomplete Expressions:", () =>
			Output("const y = (1 +").catch((error) =>
				expect(error).to.be.instanceOf(Error),
			))) &&
	describe("File Checking", async () =>
		File.forEach((File) =>
			it(`Should Inline Properly: ${File}`, async () =>
				await Equal(
					await (await import("node:fs/promises")).readFile(File, {
						encoding: "utf-8",
					}),
					await (await import("node:fs/promises")).readFile(
						File.replace("Target/Test/Input", "Target/Test/Output"),
						{
							encoding: "utf-8",
						},
					),
				)),
		)));
