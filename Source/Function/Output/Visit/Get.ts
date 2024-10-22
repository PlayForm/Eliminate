import type Interface from "@Interface/Output/Visit/Get.js";

/**
 * @module Output
 *
 */
export default ((...[Search, Map]) =>
	[...Map.entries()].find(
		([_Key, Value]) => Value === Search,
	)?.[0]) satisfies Interface as Interface;
