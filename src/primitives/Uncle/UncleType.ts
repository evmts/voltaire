import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { HashType } from "../Hash/HashType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Uncle (Ommer) block type - represents uncle/ommer block header
 *
 * Uncle blocks are valid blocks that were mined but not included in the main chain.
 * They receive reduced rewards and help secure the network.
 *
 * @see https://voltaire.tevm.sh/primitives/uncle for Uncle documentation
 * @see https://ethereum.org/en/glossary/#ommer for ommer/uncle definition
 * @since 0.0.0
 */
export type UncleType = {
	readonly parentHash: BlockHashType;
	readonly ommersHash: HashType;
	readonly beneficiary: AddressType;
	readonly stateRoot: HashType;
	readonly transactionsRoot: HashType;
	readonly receiptsRoot: HashType;
	readonly logsBloom: Uint8Array; // 256 bytes
	readonly difficulty: Uint256Type;
	readonly number: BlockNumberType;
	readonly gasLimit: Uint256Type;
	readonly gasUsed: Uint256Type;
	readonly timestamp: Uint256Type;
	readonly extraData: Uint8Array;
	readonly mixHash: HashType;
	readonly nonce: Uint8Array; // 8 bytes
};
