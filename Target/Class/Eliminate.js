#!/usr/bin/env node
var i=new(await import("commander")).Command().name("Eliminate").version("0.0.5").description("Eliminate\u2001\u2198\uFE0F").argument("-E, --Eliminate <Eliminate>","\u{1F4DC}\u2001Eliminate configuration file\u2001\u2014").action((await import("../Function/Eliminate.js")).default).parse();export{i as default};
