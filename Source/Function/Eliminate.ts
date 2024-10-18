import type Interface from "../Interface/Eliminate.js";

/**
 * @module Eliminate
 *
 */
export default (async (...[File]: Parameters<Interface>) => {
	for (const _File of File) {
		for (const __File of await (
			await import("fast-glob")
		).default(_File.replaceAll("'", "").replaceAll('"', ""))) {
			Pipe.push(__File);
		}
	}

	Pipe.reverse();

	console.log(Pipe);
	console.log(File);
}) satisfies Interface as Interface;

export const Pipe: string[] = [];
