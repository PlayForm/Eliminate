#!/usr/bin/env node

/**
 * @module Eliminate
 *
 */
export default new (await import("commander")).Command()
	.name("Eliminate")
	// biome-ignore lint/nursery/noProcessEnv:
	.version(process.env["VERSION_PACKAGE"] ?? "0.0.1")
	// biome-ignore lint/nursery/noSecrets:
	.description("Eliminate ↘️")
	.argument("-E, --Eliminate <Eliminate>", "Eliminate configuration file 📜")
	.action((await import("../Function/Eliminate.js")).default)
	.parse();
