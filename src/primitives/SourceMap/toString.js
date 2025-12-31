/**
 * Convert source map to compressed string format
 *
 * Applies compression: omits fields that match previous entry.
 *
 * @param {import('./SourceMapType.js').SourceMap} sourceMap - SourceMap
 * @returns {string} Compressed source map string
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.from("0:50:0:-;51:100:0:-;");
 * const str = SourceMap.toString(map);
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export function toString(sourceMap) {
	if (sourceMap.entries.length === 0) return "";

	const parts = [];
	// Initialize to invalid values so first entry always outputs
	let prevStart = -1;
	let prevLength = -1;
	let prevFileIndex = -1;
	let prevJump = "";
	let prevModifierDepth = undefined;

	for (const entry of sourceMap.entries) {
		const fields = [];

		// Start
		fields.push(entry.start !== prevStart ? entry.start.toString() : "");
		// Length
		fields.push(entry.length !== prevLength ? entry.length.toString() : "");
		// File index
		fields.push(
			entry.fileIndex !== prevFileIndex ? entry.fileIndex.toString() : "",
		);
		// Jump
		fields.push(entry.jump !== prevJump ? entry.jump : "");
		// Modifier depth
		if (
			entry.modifierDepth !== undefined &&
			entry.modifierDepth !== prevModifierDepth
		) {
			fields.push(entry.modifierDepth.toString());
		} else if (entry.modifierDepth !== prevModifierDepth) {
			fields.push("");
		}

		parts.push(fields.join(":"));

		prevStart = entry.start;
		prevLength = entry.length;
		prevFileIndex = entry.fileIndex;
		prevJump = entry.jump;
		prevModifierDepth = entry.modifierDepth;
	}

	return parts.join(";");
}
