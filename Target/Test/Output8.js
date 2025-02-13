describe("Even More Extra Inlining Tests - Round 4",()=>{it("Should Inline A Variable Used In An Array Literal Element",()=>{const e=transformCode(`let a = 5;

		const arr = [a, a + 2];

		console.log(arr);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/\[ ?5, ?\(5 \+ 2\) ?\]/)}),it("Should Inline A Variable Used As An Argument In A Function Call",()=>{const e=transformCode(`let a = 3;

		function foo(x: number) { return x * 2; }

		console.log(foo(a));`);expect(e).not.toContain("let a ="),expect(e).toMatch(/foo\(\s*3\s*\)/)}),it("Should Inline A Variable Used Inside A Class Static Method",()=>{const e=transformCode(`let a = 7;

		class MyClass {
			static getValue() {
			return a + 1;

			}

		}

		console.log(MyClass.getValue());`);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+7\s*\+\s*1/)}),it("Should Inline A Variable Used In A Template Literal With Embedded Expression",()=>{const e=transformCode(`let a = "world";

		const greeting = \`Hello, \${a}!\`;

		console.log(greeting);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/`Hello,\s*world!`/)}),it("Should Inline A Variable Used In A Chained Binary Expression Across Multiple Passes",()=>{const e=transformCode(`let a = 2;

		let b = a + 3;

		let c = b * 4;

		let d = c - a;

		console.log(d);`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*4\s*-\s*2\)?\s*\)/)}),it("Should Inline A Variable Used In An Arrow Function That Is Immediately Invoked",()=>{const e=transformCode(`let a = 10;

		(() => console.log(a - 4))();`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*10\s*-\s*4\s*\)/)}),it("Should Inline A Variable Used In A Nested Conditional (ternary) Expression",()=>{const e=transformCode(`let a = 5;

		let result = a > 3 ? (a < 8 ? a * 2 : a * 3) : a - 1;

		console.log(result);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*8\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/)}),it("Should Inline A Variable Used In A For Of Loop Body When Safe",()=>{const e=transformCode(`let a = 4;

		const arr = [1, 2, 3];

		for (const item of arr) {
			console.log(item + a);

		}`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*item\s*\+\s*4\s*\)/)}),it("Should Inline A Variable In A Complex Nested Function With Multiple Scopes",()=>{const e=transformCode(`let a = 2;

		function outer() {
			let b = a + 3;

			function inner() {
			let c = b * 4;

			return c - a;

			}

			return inner();

		}

		console.log(outer());`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).toMatch(/return\s+\(?\(2\s*\+\s*3\)\s*\*\s*4\s*-\s*2\)?/)}),it("Should Inline A Chain Of Variables When One Variable's Value Is Used Only Once",()=>{const e=transformCode(`let a = 1;

		let b = a;

		let c = b;

		console.log(c + 10);`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).toMatch(/console\.log\(\s*\(?1\s*\+\s*10\)?\s*\)/)}),it("Should Not Inline A Variable If It Is Used In A Side Effectful Function Call",()=>{const e=transformCode(`let a = Math.random();

		function log(x: number) { console.log(x); }

		log(a);`);expect(e).toContain("let a ="),expect(e).toMatch(/log\(\s*a\s*\)/)}),it("Should Not Inline A Variable If It Is Declared With Var And Might Be Hoisted",()=>{const e=transformCode(`var a = 20;

		function foo() { return a; }

		console.log(foo());`);expect(e).toContain("var a = 20")}),it("Should Inline A Variable Used In A Logical OR Expression With Correct Parenthesis",()=>{const e=transformCode(`let a = 0;

		let b = a || 5;

		console.log(b);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/let b =\s*\(?0\s*\|\|\s*5\)?/)}),it("Should Inline A Variable Used In A Logical AND Expression With Correct Parenthesis",()=>{const e=transformCode(`let a = true;

		let b = a && 10;

		console.log(b);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/let b =\s*\(?true\s*&&\s*10\)?/)}),it("Should Inline A Variable Used In A Compound Assignment Expression",()=>{const e=transformCode(`let a = 3;

		let b = a;

		b += 7;

		console.log(b);`);expect(e).not.toContain("let a ="),expect(e).toContain("let b ="),expect(e).toMatch(/b \+= 7/)}),it("Should Inline A Variable Used In A Nested Object Literal With Method Shorthand",()=>{const e=transformCode(`let a = 8;

		const obj = {
			value: a + 2,
			method() {
			return a * 2;

			}

		};

		console.log(obj.value, obj.method());`);expect(e).not.toContain("let a ="),expect(e).toMatch(/value:\s*\(?8\s*\+\s*2\)?/),expect(e).toMatch(/return\s+8\s*\*\s*2/)}),it("Should Inline A Variable Used In An Immediately Invoked Function Expression Inside A Class Constructor",()=>{const e=transformCode(`let a = 9;

		class MyClass {
			constructor() {
			(() => console.log(a - 4))();
			 
			}

		}

		new MyClass();`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*9\s*-\s*4\s*\)/)})});
