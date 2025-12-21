// Export type
export type { BlockHeaderType } from "./BlockHeaderType.js";

// Import internal functions
import { from as _from } from "./from.js";

// Export internal functions (tree-shakeable)
export { _from };

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

// Namespace export
export const BlockHeader = {
	from,
};
