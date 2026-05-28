// @ts-check

/** @import { Parameter } from "./Parameter.js" */

/**
 * Compute the static (head) encoded size in bytes for a static ABI type.
 *
 * Only valid for static types (the caller must ensure the type is not dynamic).
 * - A static fixed-size array `T[n]` occupies `n * staticSize(T)` bytes.
 * - A static (nested) tuple occupies the sum of its components' static sizes.
 * - All other static types (uint, int, address, bool, bytesN) occupy 32 bytes.
 *
 * @param {Parameter["type"]} type
 * @param {readonly Parameter[]=} components
 * @returns {number}
 */
export function staticSize(type, components) {
	if (type === "tuple" && components) {
		let total = 0;
		for (const comp of components) {
			total += staticSize(comp.type, comp.components);
		}
		return total;
	}

	const fixedArrayMatch = type.match(/^(.+)\[(\d+)\]$/);
	if (fixedArrayMatch?.[1] && fixedArrayMatch[2]) {
		const elementType = /** @type {Parameter["type"]} */ (fixedArrayMatch[1]);
		const arraySize = Number.parseInt(fixedArrayMatch[2], 10);
		return arraySize * staticSize(elementType, components);
	}

	return 32;
}
