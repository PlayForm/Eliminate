#!/usr/bin/env node
var Eliminate_default = new (await import("commander")).Command().name("Eliminate").version("0.0.4").description("\u2198\uFE0F\u2001Eliminate\u2001\u2014").argument(
  "-E, --Eliminate <Eliminate>",
  "\u{1F4DC}\u2001Eliminate configuration file\u2001\u2014"
).action((await import("../Function/Eliminate.js")).default).parse();
export {
  Eliminate_default as default
};
//# sourceMappingURL=Eliminate.js.map
