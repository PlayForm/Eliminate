describe("Even More Extra Inlining Tests - Round 4", () => {
	// Assumes the existence of a helper function `transformCode(source: string, optionOverrides?: Partial<Option>): string>`
	// that creates a TS Program, applies the inliner transformation, and returns the printed output.

	it("Should Inline A Variable Used In An Array Literal Element", () => {
		const source = `let a = 5;

		const arr = [a, a + 2];

		console.log(arr);`;

		const result = transformCode(source);

		// 'a' should be inlined in both occurrences.
		expect(result).not.toContain("let a =");

		expect(result).toMatch(/\[ ?5, ?\(5 \+ 2\) ?\]/);
	});

	it("Should Inline A Variable Used As An Argument In A Function Call", () => {
		const source = `let a = 3;

		function foo(x: number) { return x * 2; }

		console.log(foo(a));`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/foo\(\s*3\s*\)/);
	});

	it("Should Inline A Variable Used Inside A Class Static Method", () => {
		const source = `let a = 7;

		class MyClass {
			static getValue() {
			return a + 1;

			}

		}

		console.log(MyClass.getValue());`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/return\s+7\s*\+\s*1/);
	});

	it("Should Inline A Variable Used In A Template Literal With Embedded Expression", () => {
		const source = `let a = "world";

		const greeting = \`Hello, \${a}!\`;

		console.log(greeting);`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/`Hello,\s*world!`/);
	});

	it("Should Inline A Variable Used In A Chained Binary Expression Across Multiple Passes", () => {
		const source = `let a = 2;

		let b = a + 3;

		let c = b * 4;

		let d = c - a;

		console.log(d);`;

		const result = transformCode(source);

		// Both 'a' and 'b' and 'c' should be inlined into 'd'
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		expect(result).not.toContain("let c =");

		// Final expression should be a combination of inlined values.
		expect(result).toMatch(
			/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*4\s*-\s*2\)?\s*\)/,
		);
	});

	it("Should Inline A Variable Used In An Arrow Function That Is Immediately Invoked", () => {
		const source = `let a = 10;

		(() => console.log(a - 4))();`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/console\.log\(\s*10\s*-\s*4\s*\)/);
	});

	it("Should Inline A Variable Used In A Nested Conditional (ternary) Expression", () => {
		const source = `let a = 5;

		let result = a > 3 ? (a < 8 ? a * 2 : a * 3) : a - 1;

		console.log(result);`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(
			/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*8\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/,
		);
	});

	it("Should Inline A Variable Used In A For Of Loop Body When Safe", () => {
		const source = `let a = 4;

		const arr = [1, 2, 3];

		for (const item of arr) {
			console.log(item + a);

		}`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/console\.log\(\s*item\s*\+\s*4\s*\)/);
	});

	it("Should Inline A Variable In A Complex Nested Function With Multiple Scopes", () => {
		const source = `let a = 2;

		function outer() {
			let b = a + 3;

			function inner() {
			let c = b * 4;

			return c - a;

			}

			return inner();

		}

		console.log(outer());`;

		const result = transformCode(source);

		// 'a' and 'b' should be inlined if safe; inner function may only show inlined arithmetic.
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		expect(result).toMatch(
			/return\s+\(?\(2\s*\+\s*3\)\s*\*\s*4\s*-\s*2\)?/,
		);
	});

	it("Should Inline A Chain Of Variables When One Variable's Value Is Used Only Once", () => {
		const source = `let a = 1;

		let b = a;

		let c = b;

		console.log(c + 10);`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		// The final expression should resolve to (1 + 10)
		expect(result).toMatch(/console\.log\(\s*\(?1\s*\+\s*10\)?\s*\)/);
	});

	it("Should Not Inline A Variable If It Is Used In A Side Effectful Function Call", () => {
		const source = `let a = Math.random();

		function log(x: number) { console.log(x); }

		log(a);`;

		const result = transformCode(source);

		// Due to potential side effects from Math.random(), inlining may be considered unsafe.
		expect(result).toContain("let a =");

		expect(result).toMatch(/log\(\s*a\s*\)/);
	});

	it("Should Not Inline A Variable If It Is Declared With Var And Might Be Hoisted", () => {
		const source = `var a = 20;

		function foo() { return a; }

		console.log(foo());`;

		const result = transformCode(source);

		// 'var' declarations may be preserved due to hoisting concerns.
		expect(result).toContain("var a = 20");
	});

	it("Should Inline A Variable Used In A Logical OR Expression With Correct Parenthesis", () => {
		const source = `let a = 0;

		let b = a || 5;

		console.log(b);`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/let b =\s*\(?0\s*\|\|\s*5\)?/);
	});

	it("Should Inline A Variable Used In A Logical AND Expression With Correct Parenthesis", () => {
		const source = `let a = true;

		let b = a && 10;

		console.log(b);`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/let b =\s*\(?true\s*&&\s*10\)?/);
	});

	it("Should Inline A Variable Used In A Compound Assignment Expression", () => {
		const source = `let a = 3;

		let b = a;

		b += 7;

		console.log(b);`;

		const result = transformCode(source);

		// 'a' might be inlined if it's only used in the initialization of b.
		expect(result).not.toContain("let a =");

		// 'b' is modified so it should be preserved.
		expect(result).toContain("let b =");

		expect(result).toMatch(/b \+= 7/);
	});

	it("Should Inline A Variable Used In A Nested Object Literal With Method Shorthand", () => {
		const source = `let a = 8;

		const obj = {
			value: a + 2,
			method() {
			return a * 2;

			}

		};

		console.log(obj.value, obj.method());`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/value:\s*\(?8\s*\+\s*2\)?/);

		expect(result).toMatch(/return\s+8\s*\*\s*2/);
	});

	it("Should Inline A Variable Used In An Immediately Invoked Function Expression Inside A Class Constructor", () => {
		const source = `let a = 9;

		class MyClass {
			constructor() {
			(() => console.log(a - 4))();
			 
			}

		}

		new MyClass();`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/console\.log\(\s*9\s*-\s*4\s*\)/);
	});
});
