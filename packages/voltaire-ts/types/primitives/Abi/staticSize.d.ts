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
export function staticSize(type: Parameter["type"], components?: readonly Parameter[] | undefined): number;
import type { Parameter } from "./Parameter.js";
//# sourceMappingURL=staticSize.d.ts.map