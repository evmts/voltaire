// @ts-check

/** @import { Parameter } from "./Parameter.js" */

/**
 * @param {Parameter["type"]} type
 * @param {readonly Parameter[]=} components
 * @returns {boolean}
 */
export function isDynamicType(type, components) {
	if (type === "string" || type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple" && components) {
		return components.some((c) => isDynamicType(c.type, c.components));
	}
	if (type.includes("[") && type.endsWith("]")) {
		const match = type.match(/^(.+)\[(\d+)\]$/);
		if (match?.[1]) {
			const elementType = /** @type {Parameter["type"]} */ (match[1]);
			// Pass components through: `tuple[N]` is dynamic iff its tuple is.
			return isDynamicType(elementType, components);
		}
	}
	return false;
}
