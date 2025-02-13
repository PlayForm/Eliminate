describe("Highly Advanced Inlining Tests - Round 5",()=>{it("Should Handle Inlining In An Async Arrow Function With Nested Await",()=>{const e=transformCode(`let delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
		
		async function run() {
			let a = await delay(100);
			
			return a;
			
		}
			
		run().then(console.log);`,{Async:!0});expect(e).toContain("let a =")}),it("Should Inline A Generic Function's Variable When Type Parameters Do Not Affect The Initializer",()=>{const e=transformCode(`function identity<T>(x: T): T { return x; }
		
		let a = identity(42);
		
		console.log(a);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*42\s*\)/)}),it("Should Not Inline A Variable When Its Initializer Has A Type Cast",()=>{const e=transformCode(`let a = (5 as number) + 2;
		
		let b = a * 3;
		
		console.log(b);`);expect(e).toContain("let a ="),expect(e).toMatch(/a \* 3/)}),it("Should Inline Variables Defined With Const In Nested Functions If They Are Not Reassigned",()=>{const e=transformCode(`const a = 10;
		
		function outer() {
			function inner() {
				return a + 5;
			}

			return inner();
		}
			
		console.log(outer());`);expect(e).not.toContain("const a ="),expect(e).toMatch(/return\s+10\s*\+\s*5/)}),it("Should Not Inline A Variable If It Is Used With A Non Null Assertion Operator",()=>{const e=transformCode(`let a = { value: 3 };
		
		let b = a!.value + 2;
		
		console.log(b);`);expect(e).toContain("let a ="),expect(e).toMatch(/a!\.value/)}),it("Should Not Inline A Variable Declared In A For Loop Header When It Is Mutated",()=>{const e=transformCode(`for (let i = 0; i < 5; i++) {
			console.log(i * 2);
			
		}`);expect(e).toContain("let i = 0")}),it("Should Inline A Variable In A Complex Expression Mixing Ternaries, Logical Operators, And Arithmetic",()=>{const e=transformCode(`let a = 3;
		
		let b = a > 2 ? (a < 5 ? a + 1 : a - 1) : (a && 0);
		
		let c = b * 2;
		
		console.log(c);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*\(?\(3\s*>\s*2\s*\?.*\)\s*\*\s*2\)?\s*\)/)}),it("Should Preserve Destructured Variables And Not Attempt To Inline Them",()=>{const e=transformCode(`let data = { a: 1, b: 2, c: 3 };
		
		let { a, b } = data;
		
		let sum = a + b;
		
		console.log(sum);`);expect(e).toContain("let { a, b } = data"),expect(e).toMatch(/a \+ b/)}),it("Should Inline A Variable Defined Using Computed Property Access If Safe",()=>{const e=transformCode(`let obj = { x: 5 };
		
		let a = obj.x;
		
		let b = a * 2;
		
		console.log(b);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/obj\.x\s*\*\s*2/)}),it("Should Inline A Variable That Is Used In A Chained Method Call",()=>{const e=transformCode(`let prefix = "Mr. ";
		
		let name = "Smith";
		
		let fullName = [prefix, name].join("");
		
		console.log(fullName);`);expect(e).not.toContain("let prefix ="),expect(e).not.toContain("let name ="),expect(e).toMatch(/\[\s*"Mr\.\s*"\s*,\s*"Smith"\s*\]/)}),it("Should Inline A Variable Used Within A Class Static Block",()=>{const e=transformCode(`let a = 42;
		
		class MyClass {
			static {
			console.log(a + 1);
			
			}
			
		}`);expect(e).not.toContain("let a ="),expect(e).toMatch(/console\.log\(\s*42\s*\+\s*1\s*\)/)}),it("Should Inline A Variable In A Complex Nested Arrow Function With Multiple Closures",()=>{const e=transformCode(`let a = 5;
		
		const f = () => {
			const g = () => {
			const h = () => a + 2;
			
			return h();
			
			};
			
			return g();
			
		};
		
		console.log(f());`);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+5\s*\+\s*2/)}),it("Should Inline A Variable Used In A Nested IIFE That Returns A Function",()=>{const e=transformCode(`let a = 3;
		
		const f = (function() {
			return function() { return a * 3; }
			
		})();
		
		console.log(f());`);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+3\s*\*\s*3/)}),it("Should Inline A Variable Used In A Tagged Template Literal If Safe",()=>{const e=transformCode(`let tag = (strings: TemplateStringsArray, ...values: any[]) => strings[0] + values[0];
		
		let a = 100;
		
		const message = tag\`Value is: \${a}\`;
		
		console.log(message);`);expect(e).not.toContain("let a ="),expect(e).toMatch(/`Value is:\s*100`/)}),it("Should Not Inline A Variable If It Is Used In A Compound Assignment",()=>{const e=transformCode(`let a = 3;
		
		let b = a;
		
		b += 7;
		
		console.log(b);`);expect(e).not.toContain("let a ="),expect(e).toContain("let b ="),expect(e).toMatch(/b \+= 7/)})});
