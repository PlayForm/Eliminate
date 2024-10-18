import type Interface from "../Interface/Exec.js";

/**
 * @module Exec
 *
 */
export default (async (
	...[
		Command,
		Echo = async (Return) => console.log(Return),
	]: Parameters<Interface>
) => {
	try {
		const { stdout, stderr } = (await import("child_process")).exec(
			Command,
		);

		if (typeof Echo === "function") {
			stdout?.on("data", async (Data) => await Echo(Data.trim()));
			stderr?.on("data", async (Data) => await Echo(Data.trim(), true));
		}
	} catch (_Error) {
		console.log(_Error);
	}
}) satisfies Interface as Interface;
