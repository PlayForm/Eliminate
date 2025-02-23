import l from"../Function/Output.js";import{expect as n}from"chai";import u from"prettier";const d=!1,h=await(await import("fast-glob")).default("./Target/Test/Input/**/*.{js,ts}"),i=async o=>{try{return await u.format(o.replace(/\s+/g," "),{parser:"typescript",...(await import("../../prettier.config.mjs")).default})}catch(a){console.log("Prettier: "),console.log(a)}return o},t=async(o,a)=>await i(await l(o,{Debug:d,Const:!1,Function:!1,Comment:!1,...a})),e=async(o,a,c,r=!1)=>{const s=await t(o,c);return r&&(console.log("---------- OUTPUT ----------"),console.log(s)),n(s).to.equal(await i(a))};describe("TypeScript Variable Inliner",async()=>describe("Variable Inliner Transformer",()=>it("Inlines A Simple Variable Usage",async()=>{const o=await t(`let a = 1;
				

				let b = a + 2;
				

				console.log(b);`);n(o).not.to.contain("let a = 1")})&&it("Does Not Inline An Exported Variable",async()=>{const o=await t(`export const a = 1;
				

				let b = a + 2;
				

				console.log(b);`);n(o).to.contain("export const a = 1"),n(o).to.contain("a + 2")})&&it("Does Not Keep A Comment",async()=>{const o=await t(`// This comment disables inlining
				let a = 1;
				

				let b = a + 2;
				

				console.log(b);`,{Comment:!1});n(o).not.to.contain("This comment disables inlining")})&&it("Inlines A Simple Function Call",async()=>{const o=await t(`function foo() {
					return 42;
					
				}

				let Should = foo();
				

				console.log(Should);`);n(o).not.to.contain("function foo"),n(o).to.contain("(() =>"),n(o).to.contain("return 42")})&&it("Does Not Inline A Function With Type Parameters",async()=>{const o=await t(`function foo<T>(x: T): T {
					return x;
					
				}

				let Should = foo(42);
				

				console.log(Should);`);n(o).to.contain("function foo<T>"),n(o).to.contain("foo(42)")})&&it("Does Not Inline A Variable If Its Initializer Exceeds The Size Threshold",async()=>{const o=await t(`let a = 1 + 2;
				
	
				// This expression will likely have a size > 1.
	
				let b = a + 3;
				

				console.log(b);`,{Max:1});n(o).to.contain("let a = 1 + 2"),n(o).to.contain("a + 3")})&&it("Does Not Inline Await Expressions When Async Option Is Enabled",async()=>{const o=await t(`async function foo() {
					return await Promise.resolve(42);
					
				}
	
				let Should = foo();
				

				console.log(Should);`,{Async:!0});n(o).to.contain("async function foo"),n(o).to.contain("foo()")})&&it("Inlines Nested Expressions Correctly",async()=>{const o=await t(`let a = 2;
				

				let b = a + 3;
				

				let c = b * 4;
				

				console.log(c);`);n(o).to.match(/console\.log\(?\(?2 \+ 3\)?\) \* 4/),n(o).not.to.contain("let a ="),n(o).not.to.contain("let b =")}))&&describe("Extensive Variable Inliner Tests",()=>it("Should Inline Multi Pass Variables Across Multiple Passes",async()=>{const o=await t(`let a = 1;
				

				let b = a + 2;
				

				let c = b * 3;
				

				console.log(c);`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).to.match(/\(1\s*\+\s*2\).*3/)})&&it("Should Handle Variables In Nested Block Scopes",async()=>{const o=await t(`let a = 10;
				
				{
					let b = a + 5;
					

					{
						let c = b * 2;
						

						console.log(c);
						
					}
				}`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).not.to.contain("let c ="),n(o).to.match(/console\.log\(.+\)/)})&&it("Should Not Inline A Variable That Is Redefined In The Same Scope",async()=>{const o=await t(`let a = 1;
				

				a = 2;
				

				console.log(a);`);n(o).to.contain("let a = 1"),n(o).to.contain("a = 2"),n(o).to.contain("console.log(a)")})&&it("Should Not Inline Variables When Shadowed In Nested Scopes",async()=>{const o=await t(`let a = 1;
				

				{
					let a = 2;
					

					console.log(a);
					
				}

				console.log(a);`);n(o).to.match(/let a = 1/),n(o).to.match(/let a = 2/)})&&it("Should Inline A Variable Inside A Nested Function When Safe",async()=>{const o=await t(`function outer() {
					let a = 5;
					

					function inner() {
						return a + 1;
						
					}

					return inner();
					
				}

				console.log(outer());`);n(o).not.to.contain("let a ="),n(o).to.match(/return\s+5\s*\+\s*1/)})&&it("Should Not Inline Variables That Are Used In Multiple Locations",async()=>{const o=await t(`let a = 1;
				

				let b = a + 2;
				

				let c = a + 3;
				

				console.log(b, c);`);n(o).to.contain("let a = 1"),n(o).to.contain("a + 2"),n(o).to.contain("a + 3")})&&it("Should Perform Multi Pass Inlining With Interdependent Variables",async()=>{const o=await t(`let x = 1;
				

				let y = x + 2;
				

				let z = y + x;
				

				console.log(z);`);n(o).not.to.contain("let x ="),n(o).not.to.contain("let y ="),n(o).to.match(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\+\s*1\s*\)/)})&&it("Should Inline Variables Through Multiple Levels Of Nested Functions",async()=>{const o=await t(`function level1() {
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

				console.log(level1());`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).not.to.contain("let c ="),n(o).to.match(/console\.log\(.+\)/)})&&it("Should Preserve Variables Or Functions Marked By Comments From Inlining",async()=>{const o=await t(`// Do not inline this variable.
				let a = 5;
				

				let b = a + 3;
				

				function foo() {
					/* Important: preserve 'a' */
					return a + 1;
					
				}

				console.log(b, foo());`);n(o).to.contain("let a = 5"),n(o).to.contain("function foo")})&&it("Should Not Inline A Function That Is Redefined",async()=>{const o=await t(`function foo() { return 1; }

				foo = function() { return 2; }

				console.log(foo());`);n(o).to.contain("function foo"),n(o).to.contain("foo = function"),n(o).to.contain("console.log(foo())")})&&it("Should Not Inline A Variable That Is Reassigned Within A Nested Block",async()=>{const o=await t(`let a = 1;
				

				{
					let b = a + 1;
					

					console.log(b);
					

					b = 3;
					

					console.log(b);
					
				}`);n(o).to.contain("let b ="),n(o).to.contain("let a =")})&&it("Should Handle Variables With Similar Names In Different Scopes",async()=>{const o=await t(`let a = 100;
				

				function f() {
					let a = 200;
					

					return a + 10;
					
				}

				console.log(a, f());`);n(o).to.match(/let a = 100/),n(o).to.match(/let a = 200/)})&&it("Should Correctly Inline Across Multiple Passes With Nested Redefinitions And Cross Scope Usage",async()=>{const o=await t(`let x = 1;
				

				let y = x + 1;
				

				function f() {
					let x = 10;
					

					let z = y + x;
					

					return z;
					
				}

				console.log(f(), y);`);n(o).not.to.contain("let y ="),n(o).to.contain("let x = 10"),n(o).to.match(/console\.log\(.+,\s*y\s*\)/)})&&it("Should Not Inline A Variable If It Is Captured In A Closure And Later Modified",async()=>{const o=await t(`let a = 1;
				

				function f() {
					return a;
					
				}

				a = 2;
				

				console.log(f(), a);`);n(o).to.contain("let a = 1"),n(o).to.contain("a = 2")}))&&describe("Additional Extensive Variable Inliner Tests",()=>it("Should Inline Variables In Inner Functions With Parameters",async()=>{const o=await t(`function outer(a) {
		
				function inner(b) {
		
				return a + b;
				
				
			}
		
			return inner(5);

			
			 
			}
		
			console.log(outer(10));`);n(o).not.to.contain("function outer"),n(o).not.to.contain("function inner"),n(o).to.match(/10 \+ 5/)})&&it("Should Not Inline Variables When They Are Used In Conditionals",async()=>{const o=await t(`let a = 10;
				

				if (a > 5) {
		
				console.log(a);			
		
			}`);n(o).to.contain("let a = 10"),n(o).to.contain("console.log(a)")})&&it("Should Inline A Function Used Only Once In A Single Expression",async()=>{const o=await t(`function foo() {
		
				return 5;			
		
			}
		
			let Should = foo() * 2;

			
				console.log(Should);`);n(o).not.to.contain("function foo"),n(o).to.match(/let Should = 5 \* 2/)})&&it("Should Handle Multiple Variables Defined At Once And Used Individually",async()=>{const o=await t(`let x = 10, y = 20, z = 30;
				

				let a = x + y;
				
				
				let b = y + z;
				
				
				console.log(a, b);`);n(o).not.to.contain("let x ="),n(o).not.to.contain("let y ="),n(o).not.to.contain("let z ="),n(o).to.match(/let a = 10 \+ 20/),n(o).to.match(/let b = 20 \+ 30/)})&&it("Should Handle Destructuring Correctly When Inlining",async()=>{const o=await t(`const obj = { a: 1, b: 2 };
				
				
				let { a, b } = obj;
				

				console.log(a, b);`);n(o).not.to.contain("const obj ="),n(o).to.match(/let a = 1/),n(o).to.match(/let b = 2/)})&&it("Should Not Inline Object Properties Used More Than Once",async()=>{const o=await t(`const obj = { a: 1, b: 2 };
				
				
					let x = obj.a + 1;
					
					
					let y = obj.b + 2;
					
					
					console.log(x, y);`);n(o).to.contain("const obj ="),n(o).to.contain("obj.a + 1"),n(o).to.contain("obj.b + 2")})&&it("Should Inline Variables Used In Non Assignment Computations",async()=>{const o=await t(`let a = 5;
				

				let b = a * 3 + 2;
				
				
				console.log(b);`);n(o).not.to.contain("let a = 5"),n(o).to.match(/let b = 5 \* 3 \+ 2/)})&&it("Should Handle Variables Within Template Literals",async()=>{const o=await t('let name = "John";\n				\n\n				console.log(`Hello, ${name}!`);');n(o).not.to.contain('let name = "John"'),n(o).to.match(/console\.log\("Hello, John!"/)})&&it("Should Correctly Handle Reassigned Variables Inside Loops",async()=>{const o=await t(`let i = 0;
				

				for (i = 1; i < 3; i++) {}
		
			console.log(i);`);n(o).to.contain("let i = 0"),n(o).to.contain("console.log(i)")})&&it("Should Preserve Variable Values That Are Used In Delayed Execution Contexts (e.g. Set Timeout)",async()=>{const o=await t(`let x = 5;
				

				setTimeout(() => {
		
				console.log(x);
				
				
					}, 1000);`);n(o).to.contain("let x = 5"),n(o).to.contain("setTimeout")})&&it("Should Warn And Stop Infinite Inlining When Dependent Variables Have Circular Dependencies",async()=>{const o=await t(`let x = y + 1;
				

				let y = x * 2;
				
				
				console.log(x, y);`);n(o).to.contain("Potential infinite loop detected in AST transformations!")})&&it("Should Correctly Inline Variables When Their Values Are Directly Involved In Complex Computations",async()=>{const o=await t(`let a = 3;
				

				let b = 4;
				
				
				let Should = (a + b) * a;
				
				
				console.log(Should);`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).to.match(/let Should = \(3 \+ 4\) \* 3/)})&&it("Should Handle Variables Used In Multiple Callbacks Correctly",async()=>{const o=await t(`let a = 1;
				

				setTimeout(() => console.log(a), 100);
				
				
				setInterval(() => console.log(a), 1000);`);n(o).to.contain("let a = 1"),n(o).to.contain("setTimeout"),n(o).to.contain("setInterval")}))&&describe("Advanced Multi-Pass and Nested Scope Inlining Tests",async()=>{it("should inline a chain of variables across multiple passes",async()=>{const o=await t(`let a = 1;
				
				let b = a;
				
				let c = b;
				
				let d = c + 2;
				
				console.log(d);`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).not.to.contain("let c ="),n(o).to.match(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\)/)})&&it("should inline variables in deeply nested function scopes",async()=>{const o=await t(`let a = 3;
					
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
				console.log(outer());`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).not.to.contain("let c ="),n(o).to.match(/console\.log\(.+\)/)})&&it("should preserve variables that are redefined in nested scopes",async()=>{const o=await t(`let a = 5;
					
				function f() {
				  let a = 10;
				  
				  return a;
				  
				}
				a = 15;
				
				console.log(a, f());`);n(o).to.contain("let a = 5"),n(o).to.contain("a = 15"),n(o).to.contain("let a = 10")})&&it("should inline variables used inside conditional (ternary) expressions",async()=>{const o=await t(`let a = 2;
					
				let b = a > 1 ? a + 3 : a - 3;
				
				console.log(b);`);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*\(?2\s*>\s*1\s*\?\s*2\s*\+\s*3\s*:\s*2\s*-\s*3\)?\s*\)/)})&&it("should not inline loop variables that are reassigned",async()=>{const o=await t(`let i = 0;
					
				for (; i < 3; i++) {
				  console.log(i);
				  
				}`);n(o).to.contain("let i = 0"),n(o).to.contain("i < 3")})&&it("should inline variables in single-use arrow functions",async()=>{const o=await t(`let a = 10;
					
				const fn = () => a * 2;
				
				console.log(fn());`);n(o).not.to.contain("let a ="),n(o).to.match(/return\s+10\s*\*\s*2/)})&&it("should handle multi-pass inlining in complex arithmetic expressions",async()=>{const o=await t(`let x = 2;
					
				let y = x + 3;
				
				let z = y * (x + 1);
				
				console.log(z);`);n(o).not.to.contain("let x ="),n(o).not.to.contain("let y ="),n(o).to.match(/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*\(?2\s*\+\s*1\)?\)?\s*\)/)})&&it("should not inline variables that are captured and later modified in closures",async()=>{const o=await t(`let counter = 0;
					
				function increment() {
				  counter++;
				  
				  return counter;
				  
				}
				console.log(increment(), counter);`);n(o).to.contain("let counter = 0"),n(o).to.contain("counter++")})&&it("should inline variables used in nested object property assignments",async()=>{const o=await t(`let base = 5;
					
				const obj = {
				  value: base + 10,
				  calc() {
					return base * 2;
					
				  }
				};
				
				console.log(obj.value, obj.calc());`);n(o).not.to.contain("let base ="),n(o).to.match(/value:\s*\(?5\s*\+\s*10\)?/),n(o).to.match(/return\s+5\s*\*\s*2/)})&&it("should inline variables across multiple syntactic constructs in one pass",async()=>{const o=await t(`let a = 1;
					
				let b = a + 2;
				
				function foo() {
				  let c = b * 3;
				  
				  return c - a;
				  
				}
				console.log(foo(), b);`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).to.match(/console\.log\(\s*foo\(\),\s*\(?1\s*\+\s*2\)?\s*\)/)})&&it("should handle conditional redefinitions across if/else blocks",async()=>{const o=await t(`let a = 4;
					
				if (a > 2) {
				  let b = a + 1;
				  
				  console.log(b);
				  
				} else {
				  let b = a - 1;
				
				  console.log(b);
				  
				}
				console.log(a);`);n(o).not.to.contain("let a = 4"),n(o).to.contain("let b ="),n(o).to.match(/console\.log\(\s*(4|a)\s*\)/)})&&it("should correctly inline variables within nested ternary operators",async()=>{const o=await t(`let a = 5;
					
				let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
				
				console.log(b);`);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/)})&&it("should inline variables inside immediately invoked function expressions (IIFE)",async()=>{const o=await t(`let a = 3;
					
				(function() {
				  console.log(a + 4);
				  
				})();`);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*3\s*\+\s*4\s*\)/)})&&it("should inline variables declared in for-loop initializers when not reassigned",async()=>{const o=await t(`for (let i = 0, j = i + 2; i < 3; i++) {
				  console.log(j);
				  
				}`);n(o).to.contain("let i = 0"),n(o).not.to.contain("let j ="),n(o).to.match(/console\.log\(\s*\(?0\s*\+\s*2\)?\s*\)/)})&&it("should inline variables inside function expressions that are immediately invoked",async()=>{const o=await t(`let a = 7;
					
				const Should = (function() {
				  return a * 3;
				  
				})();
				
				console.log(Should);`);n(o).not.to.contain("let a ="),n(o).to.match(/return\s+7\s*\*\s*3/),n(o).to.match(/console\.log\(\s*Should\s*\)/)})})&&describe("Even More Advanced Inlining Tests - Additional Scenarios",async()=>{it("should inline a variable in a switch-case when used only in one case",async()=>{const o=await t(`
			let a = 10;

			switch (value) {
			  case 1:
				console.log(a + 1);
				
				break;
				
			  case 2:
				console.log("no usage");
				
				break;
				
			}
		  `);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*\(?10\s*\+\s*1\)?\s*\)/)})&&it("should not inline a variable declared before try/catch if used in both try and catch",async()=>{const o=await t(`
			let a = 5;

			try {
			  console.log(a + 2);
			  
			} catch (e) {
			  console.error(a);
			  
			}
		  `);n(o).to.contain("let a = 5")})&&it("should inline a variable declared before try/catch if used only in try",async()=>{const o=await t(`
			let a = 5;

			try {
			  console.log(a + 2);
			  
			} catch (e) {
			  console.error(e);
			  
			}
		  `);n(o).not.to.contain("let a = 5"),n(o).to.match(/console\.log\(\s*\(?5\s*\+\s*2\)?\s*\)/)})&&it("should not inline a variable in a generator function if its initializer involves yield",async()=>{const o=await t(`
			function* gen() {
			  let a = yield 3;
			  
			  return a + 1;
			  
			}
			const g = gen();

			console.log(g.next().value);`);n(o).to.contain("let a =")})&&it("should inline a variable used in computed property names",async()=>{const o=await t(`
			let a = 4;

			const obj = {
			  [a + 2]: "computed"
			};

			console.log(obj);`);n(o).not.to.contain("let a ="),n(o).to.match(/\[\s*\(?4\s*\+\s*2\)?\s*\]/)})&&it("should inline a variable used inside a template literal",async()=>{const o=await t(`
			let a = "hello";

			const str = \`Message: \${a} world\`;

			console.log(str);`);n(o).not.to.contain("let a ="),n(o).to.match(/`Message:\s*hello\s*world`/)})&&it("should inline variables in nested arrow functions",async()=>{const o=await t(`
			let a = 2;

			const outer = () => {
			  const inner = () => a + 3;
			  
			  return inner();
			  
			};

			console.log(outer());`);n(o).not.to.contain("let a ="),n(o).to.match(/return\s+2\s*\+\s*3/)})&&it("should inline a variable used only in an if statement condition",async()=>{const o=await t(`
			let a = 8;

			if (a > 5) {
			  console.log("big");
			  
			}
		  `);n(o).not.to.contain("let a ="),n(o).to.match(/if\s*\(\s*8\s*>\s*5\s*\)/)})&&it("should inline a chain of assignments in multi-pass inlining",async()=>{const o=await t(`
			let a = 1;

			let b = a;

			let c = b;

			let d = c + 4;

			console.log(d);`);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b ="),n(o).not.to.contain("let c ="),n(o).to.match(/console\.log\(\s*\(?1\s*\+\s*4\)?\s*\)/)})&&it("should not inline destructured variables",async()=>{const o=await t(`
			const { a, b } = { a: 10, b: 20 };

			const sum = a + b;

			console.log(sum);`);n(o).to.contain("{ a, b }"),n(o).to.match(/a\s*\+\s*b/)})&&it("should inline a constant variable in a computed arithmetic expression",async()=>{const o=await t(`
			const a = 5;

			const b = (a * 2) + (a - 3);

			console.log(b);`);n(o).not.to.contain("const a ="),n(o).to.match(/console\.log\(\s*\(?\(5\s*\*\s*2\)\s*\+\s*\(5\s*-\s*3\)\)?\s*\)/)})&&it("should mix inlined and preserved variables based on usage frequency",async()=>{const o=await t(`
			let a = 1;

			let b = a + 2;

			let c = 3;

			b = b + c;

			console.log(b);`);n(o).not.to.contain("let a ="),n(o).to.contain("let b ="),n(o).to.contain("let c =")})&&it("should inline function expressions assigned to variables when safe",async()=>{const o=await t(`
			const foo = function() { return 42; };

			const result = foo();

			console.log(result);`);n(o).not.to.contain("const foo"),n(o).to.match(/console\.log\(\s*.*42.*\)/)})&&it("should inline variables in nested switch-case structures",async()=>{const o=await t(`
			let a = 2;

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
		  `);n(o).not.to.contain("let a ="),n(o).not.to.contain("let b =")})&&it("should inline a variable with a multi-line initializer expression",async()=>{const o=await t(`
			let a = (
			  1 +
			  2
			);

			let b = a * 3;

			console.log(b);`);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*3\)?\s*\)/)})&&it("should correctly inline variables in nested binary expressions",async()=>{const o=await t(`
			let a = 1;

			let b = (a + 2) * (a - 3);

			console.log(b);`);n(o).not.to.contain("let a ="),n(o).to.match(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*\(1\s*-\s*3\)\)?\s*\)/)})&&it("should not inline a variable used before its declaration",async()=>{const o=await t(`
			console.log(a);

			let a = 10;`);n(o).to.contain("let a = 10"),n(o).to.match(/console\.log\(\s*a\s*\)/)})&&it("should not inline variables with circular dependencies",async()=>{const o=await t(`
			let a = b + 1;

			let b = a + 1;

			console.log(a, b);`);n(o).to.contain("let a ="),n(o).to.contain("let b =")})})&&describe("Variable Inlining",async()=>it("Should Inline Simple Constant Declarations",async()=>await e(`const x = 5;
				

				console.log(x);`,"console.log(5);"))&&it("Should Inline Let Declarations",async()=>await e(`let x = 5;
				

				console.log(x);`,"console.log(5);"))&&it("Should Inline Var Declarations",async()=>await e(`var x = 5;
				

				console.log(x);`,"console.log(5);"))&&it("Should Not Inline Variables Used Multiple Times",async()=>await e(`const x = 5;
				

				console.log(x);
				

				console.log(x);`,`const x = 5;
				

				console.log(x);
				

				console.log(x);`))&&it("Should Handle Unused Variables",async()=>await e(`const x = 5;
				

				const y = 10;
				

				console.log(x);`,`const y = 10;
				

				console.log(5);`)))&&describe("Expression Inlining",async()=>it("Should Inline Arithmetic Expressions",async()=>await e(`const x = 5 * 2;
				

				console.log(x);`,"console.log(5 * 2);"))&&it("Should Inline String Concatenations",async()=>await e(`const x = "Hello" + " World";
				

				console.log(x);`,'console.log("Hello" + " World");'))&&it("Should Inline Object Literals",async()=>await e(`const x = {
					a: 1,

					b: 2
				};
				

				console.log(x);`,`console.log({
					a: 1,

					b: 2
				});`))&&it("Should Inline Array Literals",async()=>await e(`const x = [ 1, 2, 3 ];
				

				console.log(x);`,"console.log([ 1, 2, 3 ]);"))&&it("Should Maintain Operator Precedence",async()=>await e(`const x = 5;
				

				const y = x * 2;
				

				console.log(y);`,"console.log(5 * 2);")))&&describe("Function Inlining",async()=>it("Should Inline Simple Function Declarations",async()=>await e(`function greet() {
					return "Hello";
					
				}

				console.log(greet());`,`console.log((() => {
					return "Hello";
					
				})());`))&&it("Should Inline Functions With Parameters",async()=>await e(`function greet(name: string) {
					return "Hello " + name;
					
				}

				console.log(greet("World"));`,`console.log(((name: string) => {
					return "Hello " + name;
					
				})("World"));`))&&it("Should Not Inline Functions Used Multiple Times",async()=>await e(`function greet(name: string) {
					return "Hello " + name;
					
				}

				console.log(greet("World"));
				

				console.log(greet("TypeScript"));`,`function greet(name: string) {
					return "Hello " + name;
					
				}

				console.log(greet("World"));
				

				console.log(greet("TypeScript"));`)))&&describe("Multiple Reference Scenarios",async()=>it("Should Handle Mixed Single And Multiple References",async()=>await e(`const x = 5;
				

				const y = x + 1;
				

				const z = y;
				

				console.log(x);
				

				console.log(z);`,`const x = 5;
				

				console.log(x);
				

				console.log(x + 1);`))&&it("Should Handle Chain Of Single Use Variables",async()=>await e(`const a = 1;
				

				const b = a + 1;
				

				const c = b + 1;
				

				const d = c + 1;
				

				console.log(d);`,"console.log(1 + 1 + 1 + 1);")))&&describe("Complex Cases",async()=>it("Should Handle Nested Expressions",async()=>await e(`const x = 5;
				

				const y = x * 2;
				

				const z = y + 3;
				

				console.log(z);`,"console.log((5 * 2) + 3);"))&&it("Should Handle Multiple Declarations In One Statement",async()=>await e(`const x = 1, y = 2;
				

				console.log(x);`,`const y = 2;
				

				console.log(1);`))&&it("Should Preserve Type Annotations",async()=>await e(`const x: number = 5;
				

				console.log(x);`,"console.log(5);"))&&it("Should Handle Even More Complex Cases",async()=>await e(`const x = 5;
				
	
				const y = x * 2;
				

				const z = y + 3;
				

				const a = z * 4;
				

				const b = a + y;
				

				console.log(b);`,`const y = 5 * 2;
				
	
				console.log(((y + 3) * 4) + y);`)))&&describe("Function and Object Scenarios",async()=>it("Should Handle Function Calls In Expressions",async()=>{await e(`const x = Math.random();
				

				const y = x * 2;
				

				console.log(y);`,"console.log(((Math.random() * 2)));")})&&it("Should Handle Object Properties",async()=>{await e(`const obj = { value: 5 };
				

				const x = obj.value;
				

				console.log(x);`,"console.log({ value: 5 }.value);")}))&&describe("Edge Cases",async()=>it("Should Handle Empty Declarations",async()=>await e(`let x;
				

				x = 5;
				

				console.log(x);`,`let x;
				

				x = 5;
				

				console.log(x);`))&&it("Should Respect Comments When Option Enabled",async()=>{await e(`// Keep this comment

				const x = 5;
				

				console.log(x);`,`// Keep this comment

				console.log(5);`,{Comment:!0}),await e(`// Do not keep this comment

				const x = 5;
				

				console.log(x);`,"console.log(5);",{Comment:!1})})&&it("Should Handle Complex Nested Expressions With Mixed Usage",async()=>await e(`const a = 1;
				

				const b = a + 2;
				

				const c = b + 3;
				

				const d = c + a;
				

				const e = d + b;
				

				console.log(e);`,`const a = 1;
				

				const b = a + 2;
				

				console.log(b + 3 + a + b);`)))&&describe("Safety Checks",async()=>it("Should Inline Function Calls",async()=>await e(`const x = Math.random();
				

				console.log(x);`,"console.log(Math.random());"))&&it("Should Inline Async/await Expressions",async()=>await e(`const x = await Promise.resolve(5);
				

				console.log(x);`,"console.log(await Promise.resolve(5));"))&&it("Should Inline New Expressions",async()=>await e(`const x = new Date();
				

				console.log(x);`,"console.log(new Date());")))&&describe("Scope Handling",async()=>it("Should Respect Block Scope",async()=>await e(`const x = 1;
				

				{
					const x = 2;
					
					console.log(x);
					
				}

				console.log(x);`,`{
					console.log(2);
					
				}

				console.log(1);`))&&it("Should Handle Variables In Loops Correctly",async()=>await e(`for (let i = 0; i < 3; i++) {
					const x = i * 2;
					

					console.log(x);
					
				}`,`for (let i = 0; i < 3; i++) {
					console.log(i * 2);
					
				}`)))&&describe("TypeScript-specific Features",async()=>it("Should Handle Interface Declarations",async()=>{await e(`interface Person {
					name: string;
					
				}

				const person: Person = {
					name: "John"
				};
				

				console.log(person);`,`interface Person {
					name: string;
					
				}

				console.log({
					name: "John"
				});`)})&&it("Should Handle Enum Usage",async()=>{await e(`enum Direction {
					Up,
					Down
				}

				const _Direction = Direction.Up;
				

				console.log(_Direction);`,`enum Direction {
					Up,
					Down
				}

				console.log(Direction.Up);`)})&&it("Should Handle Generic Functions",async()=>{await e(`function identity<T>(x: T): T {
					return x;
					
				}

				const Should = identity(5);
				

				console.log(Should);`,`function identity<T>(x: T): T {
					return x;
					
				}

				console.log(identity(5));`)}))&&describe("Error Cases",async()=>it("Should Handle Undefined Variables Gracefully",async()=>{await e("console.log(undefinedVar);","console.log(undefinedVar);")})&&it("Should Handle Syntax Errors Gracefully",()=>l("const x = ;").catch(o=>n(o).instanceOf(Error)))&&it("Should Handle Incomplete Code Gracefully",async()=>l("const x =").catch(o=>n(o).instanceOf(Error))))&&describe("Advanced Cases",()=>it("Should Inline Variables With Template Literals",async()=>await e(`const greeting = \`Hello, World\`;
				

				console.log(greeting);`,"console.log(`Hello, World`);"))&&it("Should Inline Variables In Conditional (ternary) Expressions",async()=>await e(`const x = true ? 1 : 2;
				

				console.log(x);`,"console.log((true ? 1 : 2));"))&&it("Should Inline Variables With Logical Operators",async()=>await e(`const x = true && false;
				

				console.log(x);`,"console.log((true && false));"))&&it("Should Not Inline Variables That Are Reassigned",async()=>await e(`let x = 5;
				

				x = 10;
				

				console.log(x);`,`let x = 5;
				

				x = 10;
				

				console.log(x);`))&&it("Should Handle Computed Property Names",async()=>await e(`const key = "value";
				

				const obj = { [key]: 123 };
				

				console.log(obj);`,'console.log({ ["value"]: 123 });'))&&it("Should Inline Variables With Type Assertions",async()=>await e(`const x = 5 as number;
				

				console.log(x);`,"console.log(5 as number);")))&&describe("Destructuring and Spread",()=>it("Should Leave Destructured Object Variables Untouched",async()=>await e(`const { a, b } = { a: 1, b: 2 };
				

				console.log(a);`,`const { a, b } = { a: 1, b: 2 };
				

				console.log(a);`))&&it("Should Leave Array Destructuring Unchanged",async()=>await e(`const [x, y] = [10, 20];
				

				console.log(y);`,`const [x, y] = [10, 20];
				

				console.log(y);`))&&it("Should Handle Rest Elements In Destructuring",async()=>await e(`const [head, ...tail] = [1, 2, 3, 4];
				

				console.log(tail);`,`const [head, ...tail] = [1, 2, 3, 4];
				

				console.log(tail);`))&&it("Should Inline Variables In Spread Expressions In Arrays",async()=>await e(`const nums = [1, 2];
				

				const moreNums = [...nums, 3];
				

				console.log(moreNums);`,"console.log([...[1, 2], 3]);")))&&describe("Arrow Functions and IIFE",()=>it("Should Inline Arrow Functions Assigned To Variables",async()=>await e(`const add = (a: number, b: number) => a + b;
				

				console.log(add(1, 2));`,"console.log(((a: number, b: number) => a + b)(1, 2));"))&&it("Should Inline Immediately Invoked Arrow Functions",async()=>await e(`const Should = ((x: number) => x * 2)(5);
				

				console.log(Should);`,"console.log(((x: number) => x * 2)(5));")))&&describe("Loop and Scope Advanced",()=>it("Should Inline Variables Inside While Loops",async()=>await e(`let i = 0;
				

				while (i < 3) {
					const x = i + 1;
					

					console.log(x);
					

					i++;
					
				}`,`let i = 0;
				

				while (i < 3) {
					console.log((i + 1));
					

					i++;
					
				}`))&&it("Should Inline Variables When Shadowed In Nested Functions",async()=>await e(`const x = 10;
				

				function outer() {
					const x = 20;
					

					function inner() {
						console.log(x);
						
					}

					inner();
					
				}

				outer();
				

				console.log(x);`,`(() => {
					(() => {
						console.log(20);
						
					})();
					
				})();
				

				console.log(10);`)))&&describe("Miscellaneous",()=>it("Should Inline Variables In Chained Function Calls",async()=>await e(`const x = Math.abs(-5);
				

				console.log(String(x).padStart(3, "0"));`,'console.log(String(Math.abs(-5)).padStart(3, "0"));'))&&it("Should Inline Variables With Complex Nested Ternary Operators",async()=>await e(`const x = true ? (false ? 1 : 2) : 3;
				

				console.log(x);`,"console.log((true ? (false ? 1 : 2) : 3));"))&&it("Should Inline Variables In Try Catch Blocks",async()=>await e(`try {
					const x = "error";
					

					throw new Error(x);
					
				} catch (e) {
					console.log(e.message);
					
				}`,`try {
					throw new Error("error");
					
				} catch (e) {
					console.log(e.message);
					
				}`))&&it("Should Inline Variables In Template Literal Expressions With Embedded Variables",async()=>await e(`const adj = "awesome";
				

				const sentence = \`This is \${adj}!\`;
				

				console.log(sentence);`,'console.log(`This is ${"awesome"}!`);')))&&describe("Error Cases Extended",()=>it("Should Pass Through Runtime Errors For Undefined Variables",async()=>{await e("console.log(nonExistentVar);","console.log(nonExistentVar);")})&&it("Should Report Syntax Errors For Incomplete Expressions:",()=>l("const y = (1 +").catch(o=>n(o).to.be.instanceOf(Error))))&&describe("File Checking",async()=>h.forEach(o=>it(`6363 Should Inline Properly: ${o}`,async()=>await e(await(await import("fs/promises")).readFile(o,{encoding:"utf-8"}),await(await import("fs/promises")).readFile(o.replace("Target/Test/Input","Target/Test/Output"),{encoding:"utf-8"}))))));
