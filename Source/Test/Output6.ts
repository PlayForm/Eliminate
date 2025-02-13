describe("Even More Advanced Inlining Tests - Additional Scenarios", () => {
	// Assumes the existence of a helper function `transformCode(source: string, optionOverrides?: Partial<Option>): string`
	// that creates a TS Program, applies the inliner transformation, and returns the printed output.
  
	it("should inline a variable in a switch-case when used only in one case", () => {
	  const source = `
		let a = 10;
		switch (value) {
		  case 1:
			console.log(a + 1);
			break;
		  case 2:
			console.log("no usage");
			break;
		}
	  `;
	  const result = transformCode(source);
	  // 'a' is referenced only in one branch (one usage), so it should be inlined.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?10\s*\+\s*1\)?\s*\)/);
	});
  
	it("should not inline a variable declared before try/catch if used in both try and catch", () => {
	  const source = `
		let a = 5;
		try {
		  console.log(a + 2);
		} catch (e) {
		  console.error(a);
		}
	  `;
	  const result = transformCode(source);
	  // 'a' is used in both try and catch blocks, so its reference count is high.
	  expect(result).toContain("let a = 5");
	});
  
	it("should inline a variable declared before try/catch if used only in try", () => {
	  const source = `
		let a = 5;
		try {
		  console.log(a + 2);
		} catch (e) {
		  console.error(e);
		}
	  `;
	  const result = transformCode(source);
	  // 'a' is used only in the try block so it should be inlined.
	  expect(result).not.toContain("let a = 5");
	  expect(result).toMatch(/console\.log\(\s*\(?5\s*\+\s*2\)?\s*\)/);
	});
  
	it("should not inline a variable in a generator function if its initializer involves yield", () => {
	  const source = `
		function* gen() {
		  let a = yield 3;
		  return a + 1;
		}
		const g = gen();
		console.log(g.next().value);
	  `;
	  const result = transformCode(source);
	  // The presence of a yield expression in the initializer prevents inlining.
	  expect(result).toContain("let a =");
	});
  
	it("should inline a variable used in computed property names", () => {
	  const source = `
		let a = 4;
		const obj = {
		  [a + 2]: "computed"
		};
		console.log(obj);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined so that the computed property shows an arithmetic expression.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/\[\s*\(?4\s*\+\s*2\)?\s*\]/);
	});
  
	it("should inline a variable used inside a template literal", () => {
	  const source = `
		let a = "hello";
		const str = \`Message: \${a} world\`;
		console.log(str);
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined to yield the literal "hello" in the template.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/`Message:\s*hello\s*world`/);
	});
  
	it("should inline variables in nested arrow functions", () => {
	  const source = `
		let a = 2;
		const outer = () => {
		  const inner = () => a + 3;
		  return inner();
		};
		console.log(outer());
	  `;
	  const result = transformCode(source);
	  // 'a' should be inlined in the nested arrow function.
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/return\s+2\s*\+\s*3/);
	});
  
	it("should inline a variable used only in an if statement condition", () => {
	  const source = `
		let a = 8;
		if (a > 5) {
		  console.log("big");
		}
	  `;
	  const result = transformCode(source);
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/if\s*\(\s*8\s*>\s*5\s*\)/);
	});
  
	it("should inline a chain of assignments in multi-pass inlining", () => {
	  const source = `
		let a = 1;
		let b = a;
		let c = b;
		let d = c + 4;
		console.log(d);
	  `;
	  const result = transformCode(source);
	  // Expect a, b, and c to be inlined so that d becomes (1 + 4)
	  expect(result).not.toContain("let a =");
	  expect(result).not.toContain("let b =");
	  expect(result).not.toContain("let c =");
	  expect(result).toMatch(/console\.log\(\s*\(?1\s*\+\s*4\)?\s*\)/);
	});
  
	it("should not inline destructured variables", () => {
	  const source = `
		const { a, b } = { a: 10, b: 20 };
		const sum = a + b;
		console.log(sum);
	  `;
	  const result = transformCode(source);
	  // Destructured variables should be preserved.
	  expect(result).toContain("{ a, b }");
	  expect(result).toMatch(/a\s*\+\s*b/);
	});
  
	it("should inline a constant variable in a computed arithmetic expression", () => {
	  const source = `
		const a = 5;
		const b = (a * 2) + (a - 3);
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // With Option.Const false by default, 'a' can be inlined.
	  expect(result).not.toContain("const a =");
	  expect(result).toMatch(/console\.log\(\s*\(?\(5\s*\*\s*2\)\s*\+\s*\(5\s*-\s*3\)\)?\s*\)/);
	});
  
	it("should mix inlined and preserved variables based on usage frequency", () => {
	  const source = `
		let a = 1;
		let b = a + 2;
		let c = 3;
		b = b + c;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  // 'a' is only used in the initialization of b and can be inlined;
	  // 'b' and 'c' are used in reassignment or multiple places and should be preserved.
	  expect(result).not.toContain("let a =");
	  expect(result).toContain("let b =");
	  expect(result).toContain("let c =");
	});
  
	it("should inline function expressions assigned to variables when safe", () => {
	  const source = `
		const foo = function() { return 42; };
		const result = foo();
		console.log(result);
	  `;
	  const result = transformCode(source);
	  // With Option.Function disabled by default, function expressions may be inlined.
	  expect(result).not.toContain("const foo");
	  // The call site should reflect an inlined arrow function or equivalent.
	  expect(result).toMatch(/console\.log\(\s*.*42.*\)/);
	});
  
	it("should inline variables in nested switch-case structures", () => {
	  const source = `
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
	  `;
	  const result = transformCode(source);
	  // Expect that 'a' is inlined; 'b' should be inlined if its usage is single.
	  expect(result).not.toContain("let a =");
	  expect(result).not.toContain("let b =");
	});
  
	it("should inline a variable with a multi-line initializer expression", () => {
	  const source = `
		let a = (
		  1 +
		  2
		);
		let b = a * 3;
		console.log(b);
	  `;
	  const result = transformCode(source);
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*3\)?\s*\)/);
	});
  
	it("should correctly inline variables in nested binary expressions", () => {
	  const source = `
		let a = 1;
		let b = (a + 2) * (a - 3);
		console.log(b);
	  `;
	  const result = transformCode(source);
	  expect(result).not.toContain("let a =");
	  expect(result).toMatch(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*\(1\s*-\s*3\)\)?\s*\)/);
	});
  
	it("should not inline a variable used before its declaration", () => {
	  const source = `
		console.log(a);
		let a = 10;
	  `;
	  const result = transformCode(source);
	  // Because 'a' is referenced before its declaration, inlining should not occur.
	  expect(result).toContain("let a = 10");
	  expect(result).toMatch(/console\.log\(\s*a\s*\)/);
	});
  
	it("should not inline variables with circular dependencies", () => {
	  const source = `
		let a = b + 1;
		let b = a + 1;
		console.log(a, b);
	  `;
	  const result = transformCode(source);
	  // Circular dependencies should prevent inlining.
	  expect(result).toContain("let a =");
	  expect(result).toContain("let b =");
	});
  });
  