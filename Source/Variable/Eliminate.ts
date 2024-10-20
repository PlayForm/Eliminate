import type Interface from "../Interface/Option.js";

/**
 * @module Option
 *
 */
export default (await import("../Function/Merge.js")).default(
	(await import("@playform/pipe/Target/Variable/Option.js")).default,
	{} satisfies Interface,
);
