describe("Additional Edge Case Inlining Tests - Round 3",()=>{it("should inline a variable used in a default parameter expression",()=>{const e=transformCode(`
		let a = 5;
		function f(x = a + 3) { return x; }
		console.log(f());
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/function f\([^)]*=\s*\(?5\s*\+\s*3\)?\)/)}),it("should inline a variable used in an optional chaining expression",()=>{const e=transformCode(`
		let a = { b: 10 };
		console.log(a?.b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/\(\s*\{ b:\s*10\s*\}\s*\)\?\./)}),it("should inline a variable used in a nullish coalescing expression",()=>{const e=transformCode(`
		let a = null;
		let b = a ?? 7;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/let b =\s*\(?null\s*\?\?\s*7\)?/)}),it("should inline a variable used within an array method callback",()=>{const e=transformCode(`
		let a = 3;
		const arr = [1, 2, 3].map(x => x + a);
		console.log(arr);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/x\s*\+\s*3/)}),it("should inline a variable used in a computed property key",()=>{const e=transformCode(`
		let a = "key";
		const obj = { [a + "Name"]: "value" };
		console.log(obj);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/\[\s*\(?("key")\s*\+\s*"Name"\)?\s*\]/)}),it("should inline a variable inside a try-finally block",()=>{const e=transformCode(`
		let a = 4;
		try {
		  console.log(a + 2);
		} finally {
		  console.log("Done");
		}
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?4\s*\+\s*2\)?\s*\)/)}),it("should preserve a variable declared with var when used in multiple statements",()=>{const e=transformCode(`
		var a = 10;
		let b = a + 1;
		console.log(b);
	  `);expect(e).toContain("var a = 10"),expect(e).toMatch(/a\s*\+\s*1/)}),it("should inline a variable in a complex binary expression with mixed operators",()=>{const e=transformCode(`
		let a = 2;
		let b = a * 3 + a;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?\(2\s*\*\s*3\)\s*\+\s*2\)?\s*\)/)}),it("should inline a variable used in a class method",()=>{const e=transformCode(`
		let a = 5;
		class MyClass {
		  method() {
			return a + 2;
		  }
		}
		console.log(new MyClass().method());
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+5\s*\+\s*2/)}),it("should inline a variable used as a default parameter in an arrow function",()=>{const e=transformCode(`
		let a = 3;
		const f = (x = a + 2) => x;
		console.log(f());
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/\(x\s*=\s*\(?3\s*\+\s*2\)?\)/)}),it("should inline a variable used in a for-of loop",()=>{const e=transformCode(`
		let a = 5;
		for (const item of [1, 2, 3]) {
		  console.log(item + a);
		}
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*item\s*\+\s*5\s*\)/)}),it("should inline a variable used in a for-in loop",()=>{const e=transformCode(`
		let a = "test";
		for (const key in { key: a }) {
		  console.log(key, a);
		}
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*key,\s*"test"\s*\)/)}),it("should inline a variable used inside an object spread expression",()=>{const e=transformCode(`
		let a = 10;
		const obj = { ...{ value: a + 5 } };
		console.log(obj);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/value:\s*\(?10\s*\+\s*5\)?/)}),it("should inline a variable inside an immediately invoked arrow function",()=>{const e=transformCode(`
		let a = 2;
		(() => console.log(a * 3))();
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*2\s*\*\s*3\s*\)/)}),it("should inline a variable used in a logical AND expression",()=>{const e=transformCode(`
		let a = true;
		let b = a && 5;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/let b =\s*\(?true\s*&&\s*5\)?/)}),it("should inline a variable used in a logical OR expression",()=>{const e=transformCode(`
		let a = false;
		let b = a || 7;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/let b =\s*\(?false\s*\|\|\s*7\)?/)}),it("should inline a variable used in nested ternary operators with multiple conditions",()=>{const e=transformCode(`
		let a = 5;
		let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/)})});
