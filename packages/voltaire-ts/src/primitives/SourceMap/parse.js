/**
 * Parse a single colon-delimited source map entry inheriting omitted fields
 * @param {string} part
 * @param {import('./SourceMapType.js').SourceMapEntry} prev
 * @returns {import('./SourceMapType.js').SourceMapEntry}
 */
function parseEntryPart(part, prev) {
	const fields = part.split(":");
	return {
		start:
			fields[0] !== "" && fields[0] !== undefined
				? Number.parseInt(fields[0], 10)
				: prev.start,
		length:
			fields[1] !== "" && fields[1] !== undefined
				? Number.parseInt(fields[1], 10)
				: prev.length,
		fileIndex:
			fields[2] !== "" && fields[2] !== undefined
				? Number.parseInt(fields[2], 10)
				: prev.fileIndex,
		jump:
			fields[3] !== "" && fields[3] !== undefined
				? /** @type {"i" | "o" | "-"} */ (fields[3])
				: prev.jump,
		modifierDepth:
			fields[4] !== "" && fields[4] !== undefined
				? Number.parseInt(fields[4], 10)
				: prev.modifierDepth,
	};
}

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
export function parse(raw) {
	/** @type {import('./SourceMapType.js').SourceMapEntry[]} */
	const entries = [];
	if (raw === "") {
		return { raw, entries };
	}

	/** @type {import('./SourceMapType.js').SourceMapEntry} */
	let prev = {
		start: 0,
		length: 0,
		fileIndex: 0,
		jump: "-",
		modifierDepth: undefined,
	};

	for (const part of raw.split(";")) {
		if (part === "") {
			if (entries.length > 0) {
				entries.push({ ...prev });
			}
			continue;
		}
		prev = parseEntryPart(part, prev);
		entries.push(prev);
	}

	return { raw, entries };
}
