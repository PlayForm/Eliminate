var g=p=>{const c=t.createSourceFile("temp.ts",p,t.ScriptTarget.Latest,!0),s={},n={},o=new Set,l=e=>{if(t.isVariableDeclaration(e)&&e.initializer){const i=e.name.getText();s[i]=0,n[i]=e.initializer}else if(t.isIdentifier(e)){const i=e.getText();typeof s[i]<"u"&&s[i]++}else(t.isExportAssignment(e)||t.isExportSpecifier(e))&&o.add(e.name?.getText()??"");t.forEachChild(e,l)};l(c);const u=e=>i=>{const f=r=>{if(t.isVariableStatement(r)){const a=r.declarationList.declarations.filter(x=>{const m=x.name.getText();return s[m]!==1||o.has(m)});return a.length===0?t.factory.createEmptyStatement():t.factory.updateVariableStatement(r,r.modifiers,t.factory.updateVariableDeclarationList(r.declarationList,a))}else if(t.isIdentifier(r)){const a=r.getText();if(s[a]===1&&n[a]&&!o.has(a))return n[a]}return t.visitEachChild(r,f,e)};return t.visitNode(i,f)};return t.createPrinter().printFile(t.transform(c,[u]).transformed[0])};const t=await import("typescript");export{g as default,t as ts};
