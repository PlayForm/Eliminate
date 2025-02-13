describe("Advanced Multi-Pass and Nested Scope Inlining Tests",()=>{it("should inline a chain of variables across multiple passes",()=>{const e=transformCode(`
		let a = 1;
		let b = a;
		let c = b;
		let d = c + 2;
		console.log(d);
	  `);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\)/)}),it("should inline variables in deeply nested function scopes",()=>{const e=transformCode(`
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
	  `);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(.+\)/)}),it("should preserve variables that are redefined in nested scopes",()=>{const e=transformCode(`
		let a = 5;
		function f() {
		  let a = 10;
		  return a;
		}
		a = 15;
		console.log(a, f());
	  `);expect(e).toContain("let a = 5"),expect(e).toContain("a = 15"),expect(e).toContain("let a = 10")}),it("should inline variables used inside conditional (ternary) expressions",()=>{const e=transformCode(`
		let a = 2;
		let b = a > 1 ? a + 3 : a - 3;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?2\s*>\s*1\s*\?\s*2\s*\+\s*3\s*:\s*2\s*-\s*3\)?\s*\)/)}),it("should not inline loop variables that are reassigned",()=>{const e=transformCode(`
		let i = 0;
		for (; i < 3; i++) {
		  console.log(i);
		}
	  `);expect(e).toContain("let i = 0"),expect(e).toContain("i < 3")}),it("should inline variables in single-use arrow functions",()=>{const e=transformCode(`
		let a = 10;
		const fn = () => a * 2;
		console.log(fn());
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+10\s*\*\s*2/)}),it("should handle multi-pass inlining in complex arithmetic expressions",()=>{const e=transformCode(`
		let x = 2;
		let y = x + 3;
		let z = y * (x + 1);
		console.log(z);
	  `);expect(e).not.toContain("let x ="),expect(e).not.toContain("let y ="),expect(e).toMatch(/console\.log\(\s*\(?\(?2\s*\+\s*3\)?\s*\*\s*\(?2\s*\+\s*1\)?\)?\s*\)/)}),it("should not inline variables that are captured and later modified in closures",()=>{const e=transformCode(`
		let counter = 0;
		function increment() {
		  counter++;
		  return counter;
		}
		console.log(increment(), counter);
	  `);expect(e).toContain("let counter = 0"),expect(e).toContain("counter++")}),it("should inline variables used in nested object property assignments",()=>{const e=transformCode(`
		let base = 5;
		const obj = {
		  value: base + 10,
		  calc() {
			return base * 2;
		  }
		};
		console.log(obj.value, obj.calc());
	  `);expect(e).not.toContain("let base ="),expect(e).toMatch(/value:\s*\(?5\s*\+\s*10\)?/),expect(e).toMatch(/return\s+5\s*\*\s*2/)}),it("should inline variables across multiple syntactic constructs in one pass",()=>{const e=transformCode(`
		let a = 1;
		let b = a + 2;
		function foo() {
		  let c = b * 3;
		  return c - a;
		}
		console.log(foo(), b);
	  `);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).toMatch(/console\.log\(\s*foo\(\),\s*\(?1\s*\+\s*2\)?\s*\)/)}),it("should handle conditional redefinitions across if/else blocks",()=>{const e=transformCode(`
		let a = 4;
		if (a > 2) {
		  let b = a + 1;
		  console.log(b);
		} else {
		  let b = a - 1;
		  console.log(b);
		}
		console.log(a);
	  `);expect(e).not.toContain("let a = 4"),expect(e).toContain("let b ="),expect(e).toMatch(/console\.log\(\s*(4|a)\s*\)/)}),it("should correctly inline variables within nested ternary operators",()=>{const e=transformCode(`
		let a = 5;
		let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/)}),it("should inline variables inside immediately invoked function expressions (IIFE)",()=>{const e=transformCode(`
		let a = 3;
		(function() {
		  console.log(a + 4);
		})();
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*3\s*\+\s*4\s*\)/)}),it("should inline variables declared in for-loop initializers when not reassigned",()=>{const e=transformCode(`
		for (let i = 0, j = i + 2; i < 3; i++) {
		  console.log(j);
		}
	  `);expect(e).toContain("let i = 0"),expect(e).not.toContain("let j ="),expect(e).toMatch(/console\.log\(\s*\(?0\s*\+\s*2\)?\s*\)/)}),it("should inline variables inside function expressions that are immediately invoked",()=>{const e=transformCode(`
		let a = 7;
		const result = (function() {
		  return a * 3;
		})();
		console.log(result);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+7\s*\*\s*3/),expect(e).toMatch(/console\.log\(\s*result\s*\)/)})});
