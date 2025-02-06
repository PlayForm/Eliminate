#!/usr/bin/env node

/**
 * @module Eliminate
 *
 */
export default new (await import("commander")).Command()
	.name("Eliminate")
	.version(process.env["VERSION_PACKAGE"] ?? "0.0.1")
	.description("Eliminate ↘️")
	.argument(
		"-E, --Eliminate <Eliminate>",
		"Eliminate configuration file 📜",
	)
	.action((await import("../Function/Eliminate.js")).default)
	.parse();
