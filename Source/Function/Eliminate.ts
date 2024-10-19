import type Interface from "../Interface/Eliminate.js";
import type Option from "../Interface/Option.js";

/**
 * @module Eliminate
 *
 */
export default (async (...[Eliminate]: Parameters<Interface>) => {
	let Configuration: Option = Merge(
		(await import("../Variable/Eliminate.js")).default,
		{},
	);

	Configuration = Eliminate
		? Merge(
				Configuration,
				await (await import("../Function/File.js")).default(Eliminate),
			)
		: Configuration;

	console.log("Eliminate:");
	console.log(Eliminate);

	console.log("Configuration:");
	console.log(Configuration);
}) satisfies Interface as Interface;

export const { default: Merge } = await import("../Function/Merge.js");

export const Pipe: string[] = [];
