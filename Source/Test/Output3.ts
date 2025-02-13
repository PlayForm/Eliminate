describe("Extensive Variable Inliner Tests", () => {
	it("Should Inline Multi Pass Variables Across Multiple Passes", () => {
		const source = `let a = 1;
			
			let b = a + 2;
			
			let c = b * 3;
			
			console.log(c);`;

		const result = transformCode(source);

		// Expect that both 'a' and 'b' are inlined so that only the final expression remains.
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		// The final expression for 'c' should be inlined (e.g. ((1 + 2) * 3)).
		expect(result).toMatch(/\(1\s*\+\s*2\).*3/);
	});

	it("Should Handle Variables In Nested Block Scopes", () => {
		const source = `let a = 10;
			{
				let b = a + 5;

				{
					let c = b * 2;

					console.log(c);
				}
			}`;

		const result = transformCode(source);

		// If inlining is safe across blocks, there should be no declarations for a, b, or c.
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		expect(result).not.toContain("let c =");

		// Ensure that the final console.log contains some computed arithmetic.
		expect(result).toMatch(/console\.log\(.+\)/);
	});

	it("Should Not Inline A Variable That Is Redefined In The Same Scope", () => {
		const source = `let a = 1;
			
			a = 2;
			
			console.log(a);`;

		const result = transformCode(source);

		// Since 'a' is redefined, it must not be inlined.
		expect(result).toContain("let a = 1");

		expect(result).toContain("a = 2");

		expect(result).toContain("console.log(a)");
	});

	it("Should Not Inline Variables When Shadowed In Nested Scopes", () => {
		const source = `let a = 1;
			
			{
				let a = 2;

				console.log(a);
			}

			console.log(a);`;

		const result = transformCode(source);

		// There are two distinct 'a' variables; inlining should not merge or remove them.
		expect(result).toMatch(/let a = 1/);

		expect(result).toMatch(/let a = 2/);
	});

	it("Should Inline A Variable Inside A Nested Function When Safe", () => {
		const source = `function outer() {
				let a = 5;

				function inner() {
					return a + 1;
				}

				return inner();
			}

			console.log(outer());`;

		const result = transformCode(source);

		// If 'a' is only used in 'inner', it can be inlined.
		expect(result).not.toContain("let a =");

		// Check that the return expression in 'inner' contains the literal arithmetic.
		expect(result).toMatch(/return\s+5\s*\+\s*1/);
	});

	it("Should Not Inline Variables That Are Used In Multiple Locations", () => {
		const source = `let a = 1;
			
			let b = a + 2;
			
			let c = a + 3;
			
			console.log(b, c);`;

		const result = transformCode(source);

		// 'a' is used more than once and should remain as a declared variable.
		expect(result).toContain("let a = 1");

		expect(result).toContain("a + 2");

		expect(result).toContain("a + 3");
	});

	it("Should Perform Multi Pass Inlining With Interdependent Variables", () => {
		const source = `let x = 1;
			
			let y = x + 2;
			
			let z = y + x;
			
			console.log(z);`;

		const result = transformCode(source);

		// Expect that x is inlined into y and both are inlined into z.
		expect(result).not.toContain("let x =");

		expect(result).not.toContain("let y =");

		// The final inlined expression should reflect the arithmetic of x and y.
		expect(result).toMatch(
			/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\+\s*1\s*\)/,
		);
	});

	it("Should Inline Variables Through Multiple Levels Of Nested Functions", () => {
		const source = `function level1() {
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

			console.log(level1());`;

		const result = transformCode(source);

		// If inlining is safe, there should be no separate declarations for a, b, or c.
		expect(result).not.toContain("let a =");

		expect(result).not.toContain("let b =");

		expect(result).not.toContain("let c =");

		expect(result).toMatch(/console\.log\(.+\)/);
	});

	it("Should Preserve Variables Or Functions Marked By Comments From Inlining", () => {
		const source = `// Do not inline this variable.
			let a = 5;
			
			let b = a + 3;
			
			function foo() {
				/* Important: preserve 'a' */
				return a + 1;
			}

			console.log(b, foo());`;

		const result = transformCode(source);

		// The presence of comments should prevent inlining of 'a'.
		expect(result).toContain("let a = 5");

		expect(result).toContain("function foo");
	});

	it("Should Not Inline A Function That Is Redefined", () => {
		const source = `function foo() { return 1; }
			
			foo = function() { return 2; }
			
			console.log(foo());`;

		const result = transformCode(source);

		// Since foo is redefined, its original declaration must be preserved.
		expect(result).toContain("function foo");

		expect(result).toContain("foo = function");

		expect(result).toContain("console.log(foo())");
	});

	it("Should Not Inline A Variable That Is Reassigned Within A Nested Block", () => {
		const source = `let a = 1;
			
			{
				let b = a + 1;

				console.log(b);

				b = 3;

				console.log(b);
			}`;

		const result = transformCode(source);

		// Because 'b' is reassigned, it should not be inlined.
		expect(result).toContain("let b =");

		// Depending on safety checks, 'a' might be inlined if used only once, but could also be preserved.
		expect(result).toContain("let a =");
	});

	it("Should Handle Variables With Similar Names In Different Scopes", () => {
		const source = `let a = 100;
			
			function f() {
				let a = 200;

				return a + 10;
			}

			console.log(a, f());`;

		const result = transformCode(source);

		// Both outer and inner 'a' should remain distinct.
		expect(result).toMatch(/let a = 100/);

		expect(result).toMatch(/let a = 200/);
	});

	it("Should Correctly Inline Across Multiple Passes With Nested Redefinitions And Cross Scope Usage", () => {
		const source = `let x = 1;
			
			let y = x + 1;
			
			function f() {
				let x = 10;

				let z = y + x;

				return z;
			}

			console.log(f(), y);`;

		const result = transformCode(source);

		// The outer 'y' should be inlined if safe, but inner 'x' in function f() must remain.
		expect(result).not.toContain("let y =");

		expect(result).toContain("let x = 10");

		// The printed output should reference the inlined expression for y where appropriate.
		expect(result).toMatch(/console\.log\(.+,\s*y\s*\)/);
	});

	it("Should Not Inline A Variable If It Is Captured In A Closure And Later Modified", () => {
		const source = `let a = 1;
			
			function f() {
				return a;
			}

			a = 2;
			
			console.log(f(), a);`;

		const result = transformCode(source);

		// Since 'a' is captured by function f and later reassigned, it should not be inlined.
		expect(result).toContain("let a = 1");

		expect(result).toContain("a = 2");

		expect(result).toContain("function f()");
	});
});
