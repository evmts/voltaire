/**
 * Find response by id in batch
 *
 * @param {Array} batch - Batch response
 * @returns {function} Function that takes an id and returns matching response or undefined
 *
 * @example
 * ```typescript
 * const batch = BatchResponse.from([
 *   { id: 1, result: "0x123" },
 *   { id: 2, result: "0x456" }
 * ]);
 * const res = BatchResponse.findById(batch)(1);
 * // { id: 1, result: "0x123" }
 * ```
 */
export function findById(batch) {
	return /** @param {string | number | null} id */ (id) => batch.find((res) => res.id === id);
}
