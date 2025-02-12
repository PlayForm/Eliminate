#!/usr/bin/env node
var i=new(await import("commander")).Command().name("Eliminate").version("0.0.6").description("Eliminate\u2001\u2198\uFE0F").argument("-E, --Eliminate <Eliminate>","Eliminate configuration file\u2001\u{1F4DC}").action((await import("../Function/Eliminate.js")).default).parse();export{i as default};
