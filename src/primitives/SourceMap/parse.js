/**
 * Parse source map string into entries
 *
 * Solidity source map format: "s:l:f:j:m;s:l:f:j:m;..."
 * Fields can be omitted to inherit from previous entry (compression).
 *
 * @param {string} raw - Source map string
 * @returns {import('./SourceMapType.js').SourceMap} Parsed source map
 * @example
 * ```javascript
 * import * as SourceMap from './primitives/SourceMap/index.js';
 * const map = SourceMap.parse("0:50:0:-;51:100:0:-;151:25:0:o");
 * console.log(map.entries.length); // 3
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: source map parsing requires many conditions
export function parse(raw) {
	/** @type {import('./SourceMapType.js').SourceMapEntry[]} */
	const entries = [];

	// Handle empty string
	if (raw === "") {
		return { raw, entries };
	}

	const parts = raw.split(";");

	// Previous values for compression (empty fields inherit from previous)
	let prevStart = 0;
	let prevLength = 0;
	let prevFileIndex = 0;
	let prevJump = /** @type {"i" | "o" | "-"} */ ("-");
	/** @type {number | undefined} */
	let prevModifierDepth;

	for (const part of parts) {
		if (part === "") {
			// Empty entry: inherit all from previous (only if we have previous entries)
			if (entries.length > 0) {
				entries.push({
					start: prevStart,
					length: prevLength,
					fileIndex: prevFileIndex,
					jump: prevJump,
					modifierDepth: prevModifierDepth,
				});
			}
			continue;
		}

		const fields = part.split(":");

		// Parse fields (each can be empty to inherit)
		const start =
			fields[0] !== "" && fields[0] !== undefined
				? Number.parseInt(fields[0], 10)
				: prevStart;
		const length =
			fields[1] !== "" && fields[1] !== undefined
				? Number.parseInt(fields[1], 10)
				: prevLength;
		const fileIndex =
			fields[2] !== "" && fields[2] !== undefined
				? Number.parseInt(fields[2], 10)
				: prevFileIndex;
		const jump =
			fields[3] !== "" && fields[3] !== undefined
				? /** @type {"i" | "o" | "-"} */ (fields[3])
				: prevJump;
		/** @type {number | undefined} */
		const modifierDepth =
			fields[4] !== "" && fields[4] !== undefined
				? Number.parseInt(fields[4], 10)
				: prevModifierDepth;

		entries.push({
			start,
			length,
			fileIndex,
			jump,
			modifierDepth,
		});

		// Update previous values
		prevStart = start;
		prevLength = length;
		prevFileIndex = fileIndex;
		prevJump = jump;
		prevModifierDepth = modifierDepth;
	}

	return { raw, entries };
}
