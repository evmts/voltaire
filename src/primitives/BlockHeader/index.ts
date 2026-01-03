// Export type
export type { BlockHeaderType } from "./BlockHeaderType.js";

// Import internal functions
import { calculateHash as _calculateHash } from "./calculateHash.js";
import { from as _from } from "./from.js";
import { toRlp as _toRlp } from "./toRlp.js";

// Export internal functions (tree-shakeable)
export { _calculateHash, _from, _toRlp };

// Export public functions
export function from(params: {
	parentHash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
	ommersHash: import("../Hash/HashType.js").HashType | string;
	beneficiary: import("../Address/AddressType.js").AddressType | string;
	stateRoot: import("../Hash/HashType.js").HashType | string;
	transactionsRoot: import("../Hash/HashType.js").HashType | string;
	receiptsRoot: import("../Hash/HashType.js").HashType | string;
	logsBloom: Uint8Array;
	difficulty: bigint | number | string;
	number: bigint | number;
	gasLimit: bigint | number | string;
	gasUsed: bigint | number | string;
	timestamp: bigint | number | string;
	extraData: Uint8Array;
	mixHash: import("../Hash/HashType.js").HashType | string;
	nonce: Uint8Array;
	baseFeePerGas?: bigint | number | string;
	withdrawalsRoot?: import("../Hash/HashType.js").HashType | string;
	blobGasUsed?: bigint | number | string;
	excessBlobGas?: bigint | number | string;
	parentBeaconBlockRoot?: import("../Hash/HashType.js").HashType | string;
}) {
	return _from(params as Parameters<typeof _from>[0]);
}

// Public calculateHash wrapper
import type { BlockHeaderType } from "./BlockHeaderType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";

export function calculateHash(header: BlockHeaderType): BlockHashType {
	return _calculateHash(header);
}

export function toRlp(header: BlockHeaderType): Uint8Array {
	return _toRlp(header);
}

// Namespace export
export const BlockHeader = {
	from,
	calculateHash,
	toRlp,
};
