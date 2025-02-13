describe("Even More Advanced Inlining Tests - Additional Scenarios",()=>{it("should inline a variable in a switch-case when used only in one case",()=>{const e=transformCode(`
		let a = 10;
		switch (value) {
		  case 1:
			console.log(a + 1);
			break;
		  case 2:
			console.log("no usage");
			break;
		}
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?10\s*\+\s*1\)?\s*\)/)}),it("should not inline a variable declared before try/catch if used in both try and catch",()=>{const e=transformCode(`
		let a = 5;
		try {
		  console.log(a + 2);
		} catch (e) {
		  console.error(a);
		}
	  `);expect(e).toContain("let a = 5")}),it("should inline a variable declared before try/catch if used only in try",()=>{const e=transformCode(`
		let a = 5;
		try {
		  console.log(a + 2);
		} catch (e) {
		  console.error(e);
		}
	  `);expect(e).not.toContain("let a = 5"),expect(e).toMatch(/console\.log\(\s*\(?5\s*\+\s*2\)?\s*\)/)}),it("should not inline a variable in a generator function if its initializer involves yield",()=>{const e=transformCode(`
		function* gen() {
		  let a = yield 3;
		  return a + 1;
		}
		const g = gen();
		console.log(g.next().value);
	  `);expect(e).toContain("let a =")}),it("should inline a variable used in computed property names",()=>{const e=transformCode(`
		let a = 4;
		const obj = {
		  [a + 2]: "computed"
		};
		console.log(obj);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/\[\s*\(?4\s*\+\s*2\)?\s*\]/)}),it("should inline a variable used inside a template literal",()=>{const e=transformCode(`
		let a = "hello";
		const str = \`Message: \${a} world\`;
		console.log(str);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/`Message:\s*hello\s*world`/)}),it("should inline variables in nested arrow functions",()=>{const e=transformCode(`
		let a = 2;
		const outer = () => {
		  const inner = () => a + 3;
		  return inner();
		};
		console.log(outer());
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+2\s*\+\s*3/)}),it("should inline a variable used only in an if statement condition",()=>{const e=transformCode(`
		let a = 8;
		if (a > 5) {
		  console.log("big");
		}
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/if\s*\(\s*8\s*>\s*5\s*\)/)}),it("should inline a chain of assignments in multi-pass inlining",()=>{const e=transformCode(`
		let a = 1;
		let b = a;
		let c = b;
		let d = c + 4;
		console.log(d);
	  `);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(\s*\(?1\s*\+\s*4\)?\s*\)/)}),it("should not inline destructured variables",()=>{const e=transformCode(`
		const { a, b } = { a: 10, b: 20 };
		const sum = a + b;
		console.log(sum);
	  `);expect(e).toContain("{ a, b }"),expect(e).toMatch(/a\s*\+\s*b/)}),it("should inline a constant variable in a computed arithmetic expression",()=>{const e=transformCode(`
		const a = 5;
		const b = (a * 2) + (a - 3);
		console.log(b);
	  `);expect(e).not.toContain("const a ="),expect(e).toMatch(/console\.log\(\s*\(?\(5\s*\*\s*2\)\s*\+\s*\(5\s*-\s*3\)\)?\s*\)/)}),it("should mix inlined and preserved variables based on usage frequency",()=>{const e=transformCode(`
		let a = 1;
		let b = a + 2;
		let c = 3;
		b = b + c;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toContain("let b ="),expect(e).toContain("let c =")}),it("should inline function expressions assigned to variables when safe",()=>{const e=transformCode(`
		const foo = function() { return 42; };
		const result = foo();
		console.log(result);
	  `);expect(e).not.toContain("const foo"),expect(e).toMatch(/console\.log\(\s*.*42.*\)/)}),it("should inline variables in nested switch-case structures",()=>{const e=transformCode(`
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
	  `);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b =")}),it("should inline a variable with a multi-line initializer expression",()=>{const e=transformCode(`
		let a = (
		  1 +
		  2
		);
		let b = a * 3;
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*3\)?\s*\)/)}),it("should correctly inline variables in nested binary expressions",()=>{const e=transformCode(`
		let a = 1;
		let b = (a + 2) * (a - 3);
		console.log(b);
	  `);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?\(1\s*\+\s*2\)\s*\*\s*\(1\s*-\s*3\)\)?\s*\)/)}),it("should not inline a variable used before its declaration",()=>{const e=transformCode(`
		console.log(a);
		let a = 10;
	  `);expect(e).toContain("let a = 10"),expect(e).toMatch(/console\.log\(\s*a\s*\)/)}),it("should not inline variables with circular dependencies",()=>{const e=transformCode(`
		let a = b + 1;
		let b = a + 1;
		console.log(a, b);
	  `);expect(e).toContain("let a ="),expect(e).toContain("let b =")})});
