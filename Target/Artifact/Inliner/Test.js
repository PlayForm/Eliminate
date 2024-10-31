import{expect as f}from"chai";import s from"typescript";import{VariableInliner as d}from"../Inliner.js";class p{compiler;fileMap=new Map;constructor(){this.compiler=this.createCompilerHost()}createCompilerHost(){return{getSourceFile:(e,t)=>{const r=this.fileMap.get(e);return r?s.createSourceFile(e,r,t):void 0},getDefaultLibFileName:()=>"lib.d.ts",writeFile:()=>{},getCurrentDirectory:()=>"",getCanonicalFileName:e=>e,useCaseSensitiveFileNames:()=>!0,getNewLine:()=>`
`,fileExists:e=>this.fileMap.has(e),readFile:e=>this.fileMap.get(e)}}async runTest(e){const t=`test-${e.name}.ts`;this.fileMap.set(t,e.input);const r=s.createProgram([t],{target:s.ScriptTarget.ES2020,module:s.ModuleKind.CommonJS},this.compiler),o=new d(e.options),i=r.getSourceFile(t);if(!i)throw new Error(`Failed to create source file for test ${e.name}`);const n=o.transform(i,r).code.replace(/\s+/g," ").trim(),l=e.expected.replace(/\s+/g," ").trim();f(n).to.equal(l)}}class b{validate(e,t){const r=[],o=i=>{if(s.isVariableDeclaration(i)&&i.initializer){const a=t.getTypeAtLocation(i.name),n=t.getTypeAtLocation(i.initializer);t.isTypeAssignableTo(n,a)||r.push({node:i,message:"Type mismatch in variable declaration",category:"type"})}if(s.isIdentifier(i)){const a=t.getSymbolAtLocation(i);if(a&&a.declarations){const n=a.declarations[0];if(s.isVariableDeclaration(n)){const l=this.findEnclosingScope(i),g=this.findEnclosingScope(n);this.isAccessibleFrom(l,g)||r.push({node:i,message:"Variable reference violates scope rules",category:"scope"})}}}s.forEachChild(i,o)};return o(e),new m(r)}findEnclosingScope(e){let t=e;for(;t;){if(s.isSourceFile(t)||s.isBlock(t)||s.isFunctionLike(t))return t;t=t.parent}return e.getSourceFile()}isAccessibleFrom(e,t){let r=e;for(;r;){if(r===t)return!0;r=r.parent}return!1}}class m{constructor(e){this.errors=e}hasErrors(){return this.errors.length>0}getErrors(){return[...this.errors]}toString(){return this.errors.map(e=>`${e.category.toUpperCase()}: ${e.message}`).join(`
`)}}class h{typeChecker;constructor(e){this.typeChecker=e}handleDecorators(e){if(!s.canHaveDecorators(e))return e;const t=s.getDecorators(e);if(!t)return e;for(const r of t){const o=this.typeChecker.getSymbolAtLocation(r.expression);if(o&&this.isInliningAffectingDecorator(o))return e}return e}isInliningAffectingDecorator(e){const t=e.getName();return["observable","computed","action"].includes(t)}handleNamespaces(e){if(s.isModuleDeclaration(e)){const t=r=>{const o=i=>s.isVariableStatement(i)?this.transformNamespaceVariable(i):s.visitEachChild(i,o,r);return o};return s.transform(e,[t]).transformed[0]}return e}transformNamespaceVariable(e){const t=e.declarationList.declarations.map(r=>{if(s.isIdentifier(r.name)){const o=this.typeChecker.getSymbolAtLocation(r.name);if(o&&this.isExported(o))return r}return r});return s.factory.updateVariableStatement(e,e.modifiers,s.factory.createVariableDeclarationList(t,e.declarationList.flags))}isExported(e){return!!(e.flags&s.SymbolFlags.Exported)}}const u=[{name:"basic-inlining",input:`
      const x = 5;
      const y = x + 3;
      console.log(y);
    `,expected:`
      console.log(5 + 3);
    `},{name:"destructuring",input:`
      const obj = { a: 1, b: 2 };
      const { a, b } = obj;
      console.log(a + b);
    `,expected:`
      const obj = { a: 1, b: 2 };
      console.log(obj.a + obj.b);
    `,options:{inlineDestructuring:!0}},{name:"decorator-preservation",input:`
      class Example {
        @observable
        x = 5;
        
        @computed
        get doubled() {
          return this.x * 2;
        }
      }
    `,expected:`
      class Example {
        @observable
        x = 5;
        
        @computed
        get doubled() {
          return this.x * 2;
        }
      }
    `},{name:"namespace-handling",input:`
      namespace MyNamespace {
        export const x = 5;
        const y = x + 3;
        export const z = y * 2;
      }
    `,expected:`
      namespace MyNamespace {
        export const x = 5;
        export const z = (x + 3) * 2;
      }
    `}];async function y(){const c=new p;for(const e of u)try{await c.runTest(e),console.log(`\u2713 Test passed: ${e.name}`)}catch(t){console.error(`\u2717 Test failed: ${e.name}`),console.error(t)}}export{p as TestRunner,h as TypeScriptFeatureHandler,b as TypeScriptValidator,m as ValidationResult,y as runAllTests,u as testCases};
