/**
 * Solidity source map entry
 *
 * Maps bytecode positions to source code locations.
 * Format: s:l:f:j:m (start:length:fileIndex:jump:modifierDepth)
 */
export type SourceMapEntry = {
	/** Byte offset in source code */
	readonly start: number;
	/** Length in source code */
	readonly length: number;
	/** Source file index */
	readonly fileIndex: number;
	/** Jump type: 'i' (into), 'o' (out), '-' (regular) */
	readonly jump: "i" | "o" | "-";
	/** Modifier depth (optional) */
	readonly modifierDepth?: number;
};

/**
 * Solidity source map
 *
 * Semicolon-separated entries mapping bytecode to source locations.
 * Format: "s:l:f:j:m;s:l:f:j:m;..."
 */
export type SourceMap = {
	/** Raw source map string */
	readonly raw: string;
	/** Parsed entries */
	readonly entries: readonly SourceMapEntry[];
};
