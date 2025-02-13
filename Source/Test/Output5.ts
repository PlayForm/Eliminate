describe("Advanced Multi-Pass and Nested Scope Inlining Tests", () => {
	// Assumes the existence of a helper function `transformCode(source: string, optionOverrides?: Partial<Option>): string`
	// that creates a TS Program, applies the inliner transformation, and returns the printed output.

	it("should inline a chain of variables across multiple passes", () => {
		const source = `
		let a = 1;
		let b = a;
		let c = b;
		let d = c + 2;
		console.log(d);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).not.toContain("let b =");
		expect(result).not.toContain("let c =");
		// The final expression for d should compute as (1 + 2) or an equivalent arithmetic expression.
		expect(result).toMatch(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\)/);
	});

	it("should inline variables in deeply nested function scopes", () => {
		const source = `
		let a = 3;
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
		console.log(outer());
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).not.toContain("let b =");
		expect(result).not.toContain("let c =");
		expect(result).toMatch(/console\.log\(.+\)/);
	});

	it("should preserve variables that are redefined in nested scopes", () => {
		const source = `
		let a = 5;
		function f() {
		  let a = 10;
		  return a;
		}
		a = 15;
		console.log(a, f());
	  `;
		const result = transformCode(source);
		// The outer 'a' is redefined and then reassigned, so it should be preserved.
		expect(result).toContain("let a = 5");
		expect(result).toContain("a = 15");
		// The inner 'a' within f() must remain separate.
		expect(result).toContain("let a = 10");
	});

	it("should inline variables used inside conditional (ternary) expressions", () => {
		const source = `
		let a = 2;
		let b = a > 1 ? a + 3 : a - 3;
		console.log(b);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).toMatch(
			/console\.log\(\s*\(?2\s*>\s*1\s*\?\s*2\s*\+\s*3\s*:\s*2\s*-\s*3\)?\s*\)/,
		);
	});

	it("should not inline loop variables that are reassigned", () => {
		const source = `
		let i = 0;
		for (; i < 3; i++) {
		  console.log(i);
		}
	  `;
		const result = transformCode(source);
		// 'i' is used as a loop counter (and is modified), so it should remain intact.
		expect(result).toContain("let i = 0");
		expect(result).toContain("i < 3");
	});

	it("should inline variables in single-use arrow functions", () => {
		const source = `
		let a = 10;
		const fn = () => a * 2;
		console.log(fn());
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		// Check that the arrow function returns an expression containing literal arithmetic.
		expect(result).toMatch(/return\s+10\s*\*\s*2/);
	});

	it("should handle multi-pass inlining in complex arithmetic expressions", () => {
		const source = `
		let x = 2;
		let y = x + 3;
		let z = y * (x + 1);
		console.log(z);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let x =");
		expect(result).not.toContain("let y =");
		// The final expression should inline x and y into z's computation.
		expect(result).toMatch(
			/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*\(?2\s*\+\s*1\)?\)?\s*\)/,
		);
	});

	it("should not inline variables that are captured and later modified in closures", () => {
		const source = `
		let counter = 0;
		function increment() {
		  counter++;
		  return counter;
		}
		console.log(increment(), counter);
	  `;
		const result = transformCode(source);
		// 'counter' is modified inside the closure and later; it should be preserved.
		expect(result).toContain("let counter = 0");
		expect(result).toContain("counter++");
	});

	it("should inline variables used in nested object property assignments", () => {
		const source = `
		let base = 5;
		const obj = {
		  value: base + 10,
		  calc() {
			return base * 2;
		  }
		};
		console.log(obj.value, obj.calc());
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let base =");
		expect(result).toMatch(/value:\s*\(?5\s*\+\s*10\)?/);
		expect(result).toMatch(/return\s+5\s*\*\s*2/);
	});

	it("should inline variables across multiple syntactic constructs in one pass", () => {
		const source = `
		let a = 1;
		let b = a + 2;
		function foo() {
		  let c = b * 3;
		  return c - a;
		}
		console.log(foo(), b);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).not.toContain("let b =");
		// The output should contain inlined expressions for 'a' and 'b' where they are used.
		expect(result).toMatch(
			/console\.log\(\s*foo\(\),\s*\(?1\s*\+\s*2\)?\s*\)/,
		);
	});

	it("should handle conditional redefinitions across if/else blocks", () => {
		const source = `
		let a = 4;
		if (a > 2) {
		  let b = a + 1;
		  console.log(b);
		} else {
		  let b = a - 1;
		  console.log(b);
		}
		console.log(a);
	  `;
		const result = transformCode(source);
		// 'a' is inlinable if safe, but each branch has its own 'b' that must remain.
		expect(result).not.toContain("let a = 4");
		expect(result).toContain("let b =");
		expect(result).toMatch(/console\.log\(\s*(4|a)\s*\)/);
	});

	it("should correctly inline variables within nested ternary operators", () => {
		const source = `
		let a = 5;
		let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
		console.log(b);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		// The inlined version should reflect the nested ternary structure with literal '5'.
		expect(result).toMatch(
			/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/,
		);
	});

	it("should inline variables inside immediately invoked function expressions (IIFE)", () => {
		const source = `
		let a = 3;
		(function() {
		  console.log(a + 4);
		})();
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).toMatch(/console\.log\(\s*3\s*\+\s*4\s*\)/);
	});

	it("should inline variables declared in for-loop initializers when not reassigned", () => {
		const source = `
		for (let i = 0, j = i + 2; i < 3; i++) {
		  console.log(j);
		}
	  `;
		const result = transformCode(source);
		// 'i' is used in the loop header and mutated; however, if 'j' is inlinable (used only once),
		// then it should be replaced with the inlined value from 'i' if safe.
		expect(result).toContain("let i = 0");
		expect(result).not.toContain("let j =");
		expect(result).toMatch(/console\.log\(\s*\(?0\s*\+\s*2\)?\s*\)/);
	});

	it("should inline variables inside function expressions that are immediately invoked", () => {
		const source = `
		let a = 7;
		const result = (function() {
		  return a * 3;
		})();
		console.log(result);
	  `;
		const result = transformCode(source);
		expect(result).not.toContain("let a =");
		expect(result).toMatch(/return\s+7\s*\*\s*3/);
		expect(result).toMatch(/console\.log\(\s*result\s*\)/);
	});
});
