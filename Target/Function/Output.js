var g=p=>{const c=t.createSourceFile("temp.ts",p,t.ScriptTarget.Latest,!0),s={},n={},o=new Set,l=e=>{if(t.isVariableDeclaration(e)&&e.initializer){const r=e.name.getText();s[r]=0,n[r]=e.initializer}else if(t.isIdentifier(e)){const r=e.getText();s.hasOwnProperty(r)&&typeof s[r]<"u"&&s[r]++}else(t.isExportAssignment(e)||t.isExportSpecifier(e))&&o.add(e.name?.getText()??"");t.forEachChild(e,l)};l(c);const u=e=>r=>{const f=i=>{if(t.isVariableStatement(i)){const a=i.declarationList.declarations.filter(x=>{const m=x.name.getText();return s[m]!==1||o.has(m)});return a.length===0?t.factory.createEmptyStatement():t.factory.updateVariableStatement(i,i.modifiers,t.factory.updateVariableDeclarationList(i.declarationList,a))}else if(t.isIdentifier(i)){const a=i.getText();if(s[a]===1&&n[a]&&!o.has(a))return n[a]}return t.visitEachChild(i,f,e)};return t.visitNode(r,f)};return t.createPrinter().printFile(t.transform(c,[u]).transformed[0])};const t=await import("typescript");export{g as default,t as ts};
