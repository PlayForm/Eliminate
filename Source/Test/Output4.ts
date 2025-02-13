describe("Additional Extensive Variable Inliner Tests", () => {
	it("Should Inline Variables In Inner Functions With Parameters", () => {
		const source = `function outer(a) {

			function inner(b) {

			return a + b;
			

		}

		return inner(5);
		
		 
		}

		console.log(outer(10));`;

		const result = transformCode(source);

		// 'a' and 'b' should both be inlined as expressions.
		expect(result).not.toContain("function outer");

		expect(result).not.toContain("function inner");

		expect(result).toMatch(/10 \+ 5/);
	});

	it("Should Not Inline Variables When They Are Used In Conditionals", () => {
		const source = `let a = 10;
		
			if (a > 5) {

			console.log(a);
			

		}`;

		const result = transformCode(source);

		// Inlining should not remove 'a' due to its conditional nature.
		expect(result).toContain("let a = 10");

		expect(result).toContain("console.log(a)");
	});

	it("Should Inline A Function Used Only Once In A Single Expression", () => {
		const source = `function foo() {

			return 5;
			

		}

		let result = foo() * 2;
		
			console.log(result);`;

		const result = transformCode(source);

		// 'foo' should be inlined as an expression directly in 'result' assignment.
		expect(result).not.toContain("function foo");

		expect(result).toMatch(/let result = 5 \* 2/);
	});

	it("Should Handle Multiple Variables Defined At Once And Used Individually", () => {
		const source = `let x = 10, y = 20, z = 30;
		
			let a = x + y;
			
			let b = y + z;
			
			console.log(a, b);`;

		const result = transformCode(source);

		// Ensure that 'x', 'y', and 'z' are inlined into 'a' and 'b'.
		expect(result).not.toContain("let x =");

		expect(result).not.toContain("let y =");

		expect(result).not.toContain("let z =");

		expect(result).toMatch(/let a = 10 \+ 20/);

		expect(result).toMatch(/let b = 20 \+ 30/);
	});

	it("Should Handle Destructuring Correctly When Inlining", () => {
		const source = `const obj = { a: 1, b: 2 };
			
			let { a, b } = obj;
		
			console.log(a, b);`;

		const result = transformCode(source);

		// Destructured values 'a' and 'b' should be inlined directly from 'obj'.
		expect(result).not.toContain("const obj =");

		expect(result).toMatch(/let a = 1/);

		expect(result).toMatch(/let b = 2/);
	});

	it("Should Not Inline Object Properties Used More Than Once", () => {
		const source = `const obj = { a: 1, b: 2 };
			
				let x = obj.a + 1;
				
				let y = obj.b + 2;
				
				console.log(x, y);`;

		const result = transformCode(source);

		// 'obj' should remain intact since its properties are used more than once.
		expect(result).toContain("const obj =");

		expect(result).toContain("obj.a + 1");

		expect(result).toContain("obj.b + 2");
	});

	it("Should Inline Variables Used In Non Assignment Computations", () => {
		const source = `let a = 5;
		
			let b = a * 3 + 2;
			
			console.log(b);`;

		const result = transformCode(source);

		// 'a' should be inlined since it is only used in the expression to compute 'b'.
		expect(result).not.toContain("let a = 5");

		expect(result).toMatch(/let b = 5 \* 3 \+ 2/);
	});

	it("Should Handle Variables Within Template Literals", () => {
		const source = `let name = "John";
		
			console.log(\`Hello, \${name}!\`);`;

		const result = transformCode(source);

		// Variables nested within template literals need to be inlined.
		expect(result).not.toContain('let name = "John"');

		expect(result).toMatch(/console\.log\("Hello, John!"/);
	});

	it("Should Correctly Handle Reassigned Variables Inside Loops", () => {
		const source = `let i = 0;
		
			for (i = 1; i < 3; i++) {}

		console.log(i);`;

		const result = transformCode(source);

		// Since 'i' is reassigned inside the loop, inlining should not happen.
		expect(result).toContain("let i = 0");

		expect(result).toContain("console.log(i)");
	});

	it("Should Preserve Variable Values That Are Used In Delayed Execution Contexts (e.g. Set Timeout)", () => {
		const source = `let x = 5;
		
			setTimeout(() => {

			console.log(x);
			
				}, 1000);`;

		const result = transformCode(source);

		// 'x' in a setTimeout should be preserved due to delayed execution.
		expect(result).toContain("let x = 5");

		expect(result).toContain("setTimeout");
	});

	it("Should Warn And Stop Infinite Inlining When Dependent Variables Have Circular Dependencies", () => {
		const source = `let x = y + 1;
		
			let y = x * 2;
			
			console.log(x, y);`;

		const result = transformCode(source);

		// Expect a warning for potential infinite inlining if circular dependencies in variables are detected.
		expect(result).toContain(
			"Potential infinite loop detected in AST transformations!",
		);
	});

	it("Should Correctly Inline Variables When Their Values Are Directly Involved In Complex Computations", () => {
		const source = `let a = 3;
		
			let b = 4;
			
			let result = (a + b) * a;
			
			console.log(result);`;

		const result = transformCode(source);

		// Both 'a' and 'b' should be inlined into 'result'.
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		expect(result).toMatch(/let result = \(3 \+ 4\) \* 3/);
	});

	it("Should Handle Variables Used In Multiple Callbacks Correctly", () => {
		const source = `let a = 1;
		
			setTimeout(() => console.log(a), 100);
			
			setInterval(() => console.log(a), 1000);`;

		const result = transformCode(source);

		// Inlining should not remove 'a' because it is used in multiple asynchronous callbacks.
		expect(result).toContain("let a = 1");

		expect(result).toContain("setTimeout");

		expect(result).toContain("setInterval");
	});
});
