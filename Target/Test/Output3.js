describe("Extensive Variable Inliner Tests",()=>{it("Should Inline Multi Pass Variables Across Multiple Passes",()=>{const e=transformCode(`let a = 1;
			
			let b = a + 2;
			
			let c = b * 3;
			
			console.log(c);`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).toMatch(/\(1\s*\+\s*2\).*3/)}),it("Should Handle Variables In Nested Block Scopes",()=>{const e=transformCode(`let a = 10;
			{
				let b = a + 5;

				{
					let c = b * 2;

					console.log(c);
				}
			}`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(.+\)/)}),it("Should Not Inline A Variable That Is Redefined In The Same Scope",()=>{const e=transformCode(`let a = 1;
			
			a = 2;
			
			console.log(a);`);expect(e).toContain("let a = 1"),expect(e).toContain("a = 2"),expect(e).toContain("console.log(a)")}),it("Should Not Inline Variables When Shadowed In Nested Scopes",()=>{const e=transformCode(`let a = 1;
			
			{
				let a = 2;

				console.log(a);
			}

			console.log(a);`);expect(e).toMatch(/let a = 1/),expect(e).toMatch(/let a = 2/)}),it("Should Inline A Variable Inside A Nested Function When Safe",()=>{const e=transformCode(`function outer() {
				let a = 5;

				function inner() {
					return a + 1;
				}

				return inner();
			}

			console.log(outer());`);expect(e).not.toContain("let a ="),expect(e).toMatch(/return\s+5\s*\+\s*1/)}),it("Should Not Inline Variables That Are Used In Multiple Locations",()=>{const e=transformCode(`let a = 1;
			
			let b = a + 2;
			
			let c = a + 3;
			
			console.log(b, c);`);expect(e).toContain("let a = 1"),expect(e).toContain("a + 2"),expect(e).toContain("a + 3")}),it("Should Perform Multi Pass Inlining With Interdependent Variables",()=>{const e=transformCode(`let x = 1;
			
			let y = x + 2;
			
			let z = y + x;
			
			console.log(z);`);expect(e).not.toContain("let x ="),expect(e).not.toContain("let y ="),expect(e).toMatch(/console\.log\(\s*\(?1\s*\+\s*2\)?\s*\+\s*1\s*\)/)}),it("Should Inline Variables Through Multiple Levels Of Nested Functions",()=>{const e=transformCode(`function level1() {
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

			console.log(level1());`);expect(e).not.toContain("let a ="),expect(e).not.toContain("let b ="),expect(e).not.toContain("let c ="),expect(e).toMatch(/console\.log\(.+\)/)}),it("Should Preserve Variables Or Functions Marked By Comments From Inlining",()=>{const e=transformCode(`// Do not inline this variable.
			let a = 5;
			
			let b = a + 3;
			
			function foo() {
				/* Important: preserve 'a' */
				return a + 1;
			}

			console.log(b, foo());`);expect(e).toContain("let a = 5"),expect(e).toContain("function foo")}),it("Should Not Inline A Function That Is Redefined",()=>{const e=transformCode(`function foo() { return 1; }
			
			foo = function() { return 2; }
			
			console.log(foo());`);expect(e).toContain("function foo"),expect(e).toContain("foo = function"),expect(e).toContain("console.log(foo())")}),it("Should Not Inline A Variable That Is Reassigned Within A Nested Block",()=>{const e=transformCode(`let a = 1;
			
			{
				let b = a + 1;

				console.log(b);

				b = 3;

				console.log(b);
			}`);expect(e).toContain("let b ="),expect(e).toContain("let a =")}),it("Should Handle Variables With Similar Names In Different Scopes",()=>{const e=transformCode(`let a = 100;
			
			function f() {
				let a = 200;

				return a + 10;
			}

			console.log(a, f());`);expect(e).toMatch(/let a = 100/),expect(e).toMatch(/let a = 200/)}),it("Should Correctly Inline Across Multiple Passes With Nested Redefinitions And Cross Scope Usage",()=>{const e=transformCode(`let x = 1;
			
			let y = x + 1;
			
			function f() {
				let x = 10;

				let z = y + x;

				return z;
			}

			console.log(f(), y);`);expect(e).not.toContain("let y ="),expect(e).toContain("let x = 10"),expect(e).toMatch(/console\.log\(.+,\s*y\s*\)/)}),it("Should Not Inline A Variable If It Is Captured In A Closure And Later Modified",()=>{const e=transformCode(`let a = 1;
			
			function f() {
				return a;
			}

			a = 2;
			
			console.log(f(), a);`);expect(e).toContain("let a = 1"),expect(e).toContain("a = 2"),expect(e).toContain("function f()")})});
