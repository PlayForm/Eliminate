import type Interface from "@Interface/Output/Visit/Get.js";

/**
 * @module Output
 *
 */
export default ((...[Search, In, Map]) =>
	[...Map.entries()].find(
		([_Key, Value]) => Value[In] === Search,
	)?.[0]) satisfies Interface as Interface;
