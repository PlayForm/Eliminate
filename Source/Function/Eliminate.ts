import type Path from "@playform/pipe/Target/Type/Path.js";

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

	const { Path, File, Action } = Configuration;

	const Paths = new Set<Path>();

	if (typeof Path !== "undefined") {
		if (Array.isArray(Path) || Path instanceof Set) {
			Path.forEach((Path) => Paths.add(Path));
		}

		if (Path instanceof Map) {
			Paths.add(Path);
		}
	}
	
	for (const Path of Paths) {
		if (
			typeof File !== "undefined" &&
			typeof File !== "boolean" &&
			typeof Action !== "boolean"
		) {
			await (
				await (
					await (
						await new (await import("@playform/pipe")).default(
							Configuration.Cache,
							Configuration.Logger,
						).In(Path)
					).By(File)
				).Not(Configuration.Exclude)
			).Pipe(Action);
		}
	}
}) satisfies Interface as Interface;

export const { default: Merge } = await import("../Function/Merge.js");

export const Pipe: string[] = [];
