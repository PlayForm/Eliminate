#!/usr/bin/env node
var Eliminate_default = new (await import("commander")).Command().name("Eliminate").version("0.0.5").description("Eliminate\u2001\u2198\uFE0F").argument(
  "-E, --Eliminate <Eliminate>",
  "\u{1F4DC}\u2001Eliminate configuration file"
).action((await import("../Function/Eliminate.js")).default).parse();
export {
  Eliminate_default as default
};
//# sourceMappingURL=Eliminate.js.map
