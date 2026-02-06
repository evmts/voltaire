import type { BlockBodyType } from "../BlockBody/BlockBodyType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import type { BlockHeaderType } from "../BlockHeader/BlockHeaderType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Block type - represents complete Ethereum block
 *
 * Full block with header, body, and computed metadata.
 * Used for block validation, storage, and propagation.
 *
 * @see https://voltaire.tevm.sh/primitives/block for Block documentation
 * @see https://ethereum.org/en/developers/docs/blocks/ for block documentation
 * @since 0.0.0
 */
export type BlockType = {
    /** Block header (metadata + Merkle roots) */
    readonly header: BlockHeaderType;
    /** Block body (transactions, ommers, withdrawals) */
    readonly body: BlockBodyType;
    /** Block hash (computed from RLP(header)) */
    readonly hash: BlockHashType;
    /** Block size in bytes (RLP-encoded) */
    readonly size: Uint256Type;
    /** Total difficulty (cumulative, pre-merge only) */
    readonly totalDifficulty?: Uint256Type;
};
//# sourceMappingURL=BlockType.d.ts.map