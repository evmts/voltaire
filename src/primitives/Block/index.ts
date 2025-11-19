// Export type
export type { BlockType } from "./BlockType.js";

// Import internal functions
import { from as _from } from "./from.js";

// Export internal functions (tree-shakeable)
export { _from };

// Export public functions
export function from(params: {
	header: import("../BlockHeader/BlockHeaderType.js").BlockHeaderType;
	body: import("../BlockBody/BlockBodyType.js").BlockBodyType;
	hash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
	size: bigint | number | string;
	totalDifficulty?: bigint | number | string;
}) {
	return _from(params);
}

// Namespace export
export const Block = {
	from,
};
