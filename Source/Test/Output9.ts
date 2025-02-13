describe("Highly Advanced Inlining Tests - Round 5", () => {
	it("Should Handle Inlining In An Async Arrow Function With Nested Await", () => {
		const source = `let delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
		
		async function run() {
			let a = await delay(100);
			
			return a;
			
		}
			
		run().then(console.log);`;

		const result = transformCode(source, { Async: true });

		// 'a' is assigned an awaited value; inlining should be prevented.
		expect(result).toContain("let a =");
	});

	it("Should Inline A Generic Function's Variable When Type Parameters Do Not Affect The Initializer", () => {
		const source = `function identity<T>(x: T): T { return x; }
		
		let a = identity(42);
		
		console.log(a);`;

		const result = transformCode(source);

		// Even though identity is generic, the call identity(42) can be simplified to 42 if safe.
		expect(result).not.toContain("let a =");

		expect(result).toMatch(/console\.log\(\s*42\s*\)/);
	});

	it("Should Not Inline A Variable When Its Initializer Has A Type Cast", () => {
		const source = `let a = (5 as number) + 2;
		
		let b = a * 3;
		
		console.log(b);`;

		const result = transformCode(source);

		// Type casts may block inlining to preserve type information.
		expect(result).toContain("let a =");

		expect(result).toMatch(/a \* 3/);
	});

	it("Should Inline Variables Defined With Const In Nested Functions If They Are Not Reassigned", () => {
		const source = `const a = 10;
		
		function outer() {
			function inner() {
				return a + 5;
			}

			return inner();
		}
			
		console.log(outer());`;

		const result = transformCode(source);

		expect(result).not.toContain("const a =");

		expect(result).toMatch(/return\s+10\s*\+\s*5/);
	});

	it("Should Not Inline A Variable If It Is Used With A Non Null Assertion Operator", () => {
		const source = `let a = { value: 3 };
		
		let b = a!.value + 2;
		
		console.log(b);`;

		const result = transformCode(source);

		// The non-null assertion (a!) should preserve the original variable.
		expect(result).toContain("let a =");

		expect(result).toMatch(/a!\.value/);
	});

	it("Should Not Inline A Variable Declared In A For Loop Header When It Is Mutated", () => {
		const source = `for (let i = 0; i < 5; i++) {
			console.log(i * 2);
			
		}`;

		const result = transformCode(source);

		// 'i' is modified by the loop; inlining must not occur.
		expect(result).toContain("let i = 0");
	});

	it("Should Inline A Variable In A Complex Expression Mixing Ternaries, Logical Operators, And Arithmetic", () => {
		const source = `let a = 3;
		
		let b = a > 2 ? (a < 5 ? a + 1 : a - 1) : (a && 0);
		
		let c = b * 2;
		
		console.log(c);`;

		const result = transformCode(source);

		// 'a' should be replaced with 3 throughout b's definition.
		expect(result).not.toContain("let a =");

		expect(result).toMatch(
			/console\.log\(\s*\(?\(3\s*>\s*2\s*\?.*\)\s*\*\s*2\)?\s*\)/,
		);
	});

	it("Should Preserve Destructured Variables And Not Attempt To Inline Them", () => {
		const source = `let data = { a: 1, b: 2, c: 3 };
		
		let { a, b } = data;
		
		let sum = a + b;
		
		console.log(sum);`;

		const result = transformCode(source);

		// Destructuring should remain intact.
		expect(result).toContain("let { a, b } = data");

		expect(result).toMatch(/a \+ b/);
	});

	it("Should Inline A Variable Defined Using Computed Property Access If Safe", () => {
		const source = `let obj = { x: 5 };
		
		let a = obj.x;
		
		let b = a * 2;
		
		console.log(b);`;

		const result = transformCode(source);

		// 'a' should be eliminated in favor of directly using 'obj.x' in b.
		expect(result).not.toContain("let a =");

		expect(result).toMatch(/obj\.x\s*\*\s*2/);
	});

	it("Should Inline A Variable That Is Used In A Chained Method Call", () => {
		const source = `let prefix = "Mr. ";
		
		let name = "Smith";
		
		let fullName = [prefix, name].join("");
		
		console.log(fullName);`;

		const result = transformCode(source);

		// Both 'prefix' and 'name' should be inlined if they are single-use.
		expect(result).not.toContain("let prefix =");

		expect(result).not.toContain("let name =");

		expect(result).toMatch(/\[\s*"Mr\.\s*"\s*,\s*"Smith"\s*\]/);
	});

	it("Should Inline A Variable Used Within A Class Static Block", () => {
		const source = `let a = 42;
		
		class MyClass {
			static {
			console.log(a + 1);
			
			}
			
		}`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/console\.log\(\s*42\s*\+\s*1\s*\)/);
	});

	it("Should Inline A Variable In A Complex Nested Arrow Function With Multiple Closures", () => {
		const source = `let a = 5;
		
		const f = () => {
			const g = () => {
			const h = () => a + 2;
			
			return h();
			
			};
			
			return g();
			
		};
		
		console.log(f());`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/return\s+5\s*\+\s*2/);
	});

	it("Should Inline A Variable Used In A Nested IIFE That Returns A Function", () => {
		const source = `let a = 3;
		
		const f = (function() {
			return function() { return a * 3; }
			
		})();
		
		console.log(f());`;

		const result = transformCode(source);

		expect(result).not.toContain("let a =");

		expect(result).toMatch(/return\s+3\s*\*\s*3/);
	});

	it("Should Inline A Variable Used In A Tagged Template Literal If Safe", () => {
		const source = `let tag = (strings: TemplateStringsArray, ...values: any[]) => strings[0] + values[0];
		
		let a = 100;
		
		const message = tag\`Value is: \${a}\`;
		
		console.log(message);`;

		const result = transformCode(source);

		// 'a' should be inlined so that the template literal contains the literal value.
		expect(result).not.toContain("let a =");

		expect(result).toMatch(/`Value is:\s*100`/);
	});

	it("Should Not Inline A Variable If It Is Used In A Compound Assignment", () => {
		const source = `let a = 3;
		
		let b = a;
		
		b += 7;
		
		console.log(b);`;

		const result = transformCode(source);

		// 'a' is used only in initializing b and can be inlined, but b itself is modified.
		expect(result).not.toContain("let a =");

		expect(result).toContain("let b =");

		expect(result).toMatch(/b \+= 7/);
	});
});
