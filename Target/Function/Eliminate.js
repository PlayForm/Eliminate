var p=async(...[f])=>{let t=r((await import("../Variable/Eliminate.js")).default,{});t=f?r(t,await(await import("../Function/File.js")).default(f)):t;const{Path:a,File:e,Action:n}=t,o=new Set;typeof a<"u"&&((Array.isArray(a)||a instanceof Set)&&a.forEach(i=>o.add(i)),a instanceof Map&&o.add(a));for(const i of o)typeof e<"u"&&typeof e!="boolean"&&typeof n!="boolean"&&await(await(await(await new(await import("@playform/pipe")).default(t.Cache,t.Logger).In(i)).By(e)).Not(t.Exclude)).Pipe(n)};const{default:r}=await import("../Function/Merge.js"),s=[];export{r as Merge,s as Pipe,p as default};
