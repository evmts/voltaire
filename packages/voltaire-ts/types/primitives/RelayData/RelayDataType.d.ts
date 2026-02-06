import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { SlotType } from "../Slot/SlotType.js";
/**
 * RelayData type
 *
 * Represents MEV relay connection information for Proposer-Builder Separation (PBS).
 * Relays act as trusted intermediaries between block builders and validators,
 * ensuring builders cannot see validator signatures before block delivery.
 *
 * @see https://voltaire.tevm.sh/primitives/relay-data for RelayData documentation
 * @see https://boost.flashbots.net/ for MEV-Boost
 * @see https://ethereum.org/en/roadmap/pbs/ for PBS overview
 * @since 0.0.0
 */
export type RelayDataType = {
    /**
     * MEV relay endpoint URL
     * Base URL for relay API (e.g., "https://relay.flashbots.net")
     */
    readonly relayUrl: string;
    /**
     * Relay's BLS public key (48 bytes)
     * Used to verify relay signatures and attestations
     */
    readonly relayPubkey: Uint8Array;
    /**
     * Builder's BLS public key (48 bytes, optional)
     * If known, used to verify builder identity
     */
    readonly builderPubkey?: Uint8Array;
    /**
     * Current consensus layer slot
     * The slot this relay data is valid for
     */
    readonly slot: SlotType;
    /**
     * Parent block hash (32 bytes)
     * The block being built on top of
     */
    readonly parentHash: HashType;
    /**
     * Validator fee recipient address (20 bytes)
     * Where block rewards should be sent
     */
    readonly proposerFeeRecipient: AddressType;
};
/**
 * Inputs that can be converted to RelayData
 */
export type RelayDataLike = RelayDataType | {
    relayUrl: string;
    relayPubkey: Uint8Array | string;
    builderPubkey?: Uint8Array | string;
    slot: SlotType | bigint | number | string;
    parentHash: HashType | string | Uint8Array;
    proposerFeeRecipient: AddressType | string;
};
/**
 * Well-known MEV relay endpoints
 */
export declare const MEV_RELAYS: {
    readonly FLASHBOTS: "https://relay.flashbots.net";
    readonly BLOXROUTE_MAX_PROFIT: "https://bloxroute.max-profit.bloxroute.com";
    readonly BLOXROUTE_REGULATED: "https://bloxroute.regulated.bloxroute.com";
    readonly EDEN: "https://relay.edennetwork.io";
    readonly MANIFOLD: "https://mainnet-relay.securerpc.com";
    readonly ULTRASOUND: "https://relay.ultrasound.money";
    readonly AGNOSTIC: "https://agnostic-relay.net";
};
//# sourceMappingURL=RelayDataType.d.ts.map