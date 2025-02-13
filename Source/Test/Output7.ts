describe("Additional Edge Case Inlining Tests - Round 3", () => {
	// Assumes the existence of a helper function `transformCode(source: string, optionOverrides?: Partial<Option>): string>`
	// that creates a TS Program, applies the inliner transformation, and returns the printed output.
  
	it("should inline a variable used in a default parameter expression", () => {
	  const source = `
		let a = 5;
		function f(x = a + 3) { return x; }
		console.log(f());
	  `;
	  const result = transformCode(source);
	  // Expect 'a' to be inlined in the default parameter, turning (a + 3) into (5 + 3)
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/function f\([^)]*=\s*\(?5\s*\+\s*3\)?\)/);
	});
  
	it("should inline a variable used in an optional chaining expression", () => {
	  const source = `
		let a = { b: 10 };
		console.log(a?.b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined so that the optional chain uses the literal object
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/\(\s*\{ b:\s*10\s*\}\s*\)\?\./);
	});
  
	it("should inline a variable used in a nullish coalescing expression", () => {
	  const source = `
		let a = null;
		let b = a ?? 7;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined so that (null ?? 7) is computed at the call site,
	  // but note that if the safety checks prevent inlining due to the nature of null,
	  // then 'a' might remain. This test assumes safe inlining if used only once.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/let b =\s*\(?null\s*\?\?\s*7\)?/);
	});
  
	it("should inline a variable used within an array method callback", () => {
	  const source = `
		let a = 3;
		const arr = [1, 2, 3].map(x => x + a);
		console.log(arr);
	  `;
	  const result = transformCode(source);
	  // 'a' is used only inside the arrow callback, so it should be inlined.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/x\s*\+\s*3/);
	});
  
	it("should inline a variable used in a computed property key", () => {
	  const source = `
		let a = "key";
		const obj = { [a + "Name"]: "value" };
		console.log(obj);
	  `;
	  const result = transformCode(source);
	  // Expect that the computed key becomes (("key" + "Name")) without a separate variable declaration.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/\[\s*\(?("key")\s*\+\s*"Name"\)?\s*\]/);
	});
  
	it("should inline a variable inside a try-finally block", () => {
	  const source = `
		let a = 4;
		try {
		  console.log(a + 2);
		} finally {
		  console.log("Done");
		}
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the try block.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?4\s*\+\s*2\)?\s*\)/);
	});
  
	it("should preserve a variable declared with var when used in multiple statements", () => {
	  const source = `
		var a = 10;
		let b = a + 1;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // Depending on implementation, var variables may not be safe to inline if they're hoisted or reassigned.
	  // This test expects that the inliner preserves 'a' because of potential side effects.
	  expect(result).toContain("var a = 10");
	  expect(result).toMatch(/a\s*\+\s*1/);
	});
  
	it("should inline a variable in a complex binary expression with mixed operators", () => {
	  const source = `
		let a = 2;
		let b = a * 3 + a;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in both occurrences, yielding an arithmetic expression with proper parenthesis.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?\(2\s*\*\s*3\)\s*\+\s*2\)?\s*\)/);
	});
  
	it("should inline a variable used in a class method", () => {
	  const source = `
		let a = 5;
		class MyClass {
		  method() {
			return a + 2;
		  }
		}
		console.log(new MyClass().method());
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the class method.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/return\s+5\s*\+\s*2/);
	});
  
	it("should inline a variable used as a default parameter in an arrow function", () => {
	  const source = `
		let a = 3;
		const f = (x = a + 2) => x;
		console.log(f());
	  `;
	  const result = transformCode(source);
	  // Expect 'a' to be inlined in the default parameter expression.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/\(x\s*=\s*\(?3\s*\+\s*2\)?\)/);
	});
  
	it("should inline a variable used in a for-of loop", () => {
	  const source = `
		let a = 5;
		for (const item of [1, 2, 3]) {
		  console.log(item + a);
		}
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined inside the loop body.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*item\s*\+\s*5\s*\)/);
	});
  
	it("should inline a variable used in a for-in loop", () => {
	  const source = `
		let a = "test";
		for (const key in { key: a }) {
		  console.log(key, a);
		}
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined if used only once per occurrence.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*key,\s*"test"\s*\)/);
	});
  
	it("should inline a variable used inside an object spread expression", () => {
	  const source = `
		let a = 10;
		const obj = { ...{ value: a + 5 } };
		console.log(obj);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the computed property inside the object literal.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/value:\s*\(?10\s*\+\s*5\)?/);
	});
  
	it("should inline a variable inside an immediately invoked arrow function", () => {
	  const source = `
		let a = 2;
		(() => console.log(a * 3))();
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the arrow function body.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*2\s*\*\s*3\s*\)/);
	});
  
	it("should inline a variable used in a logical AND expression", () => {
	  const source = `
		let a = true;
		let b = a && 5;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the logical expression.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/let b =\s*\(?true\s*&&\s*5\)?/);
	});
  
	it("should inline a variable used in a logical OR expression", () => {
	  const source = `
		let a = false;
		let b = a || 7;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the logical expression.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/let b =\s*\(?false\s*\|\|\s*7\)?/);
	});
  
	it("should inline a variable used in nested ternary operators with multiple conditions", () => {
	  const source = `
		let a = 5;
		let b = a > 3 ? (a < 10 ? a * 2 : a * 3) : a - 1;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in all parts of the nested ternary.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?5\s*>\s*3\s*\?\s*\(?5\s*<\s*10\s*\?\s*5\s*\*\s*2\s*:\s*5\s*\*\s*3\)?\s*:\s*5\s*-\s*1\)?\s*\)/);
	});
  });
  