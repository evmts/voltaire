import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	CryptoOperationError,
	RlpEncodingError,
} from "./effect-errors.js";

/**
 * Service interface for Keccak256 hashing operations
 */
export interface Keccak256Service {
	/**
	 * Compute Keccak256 hash of data
	 */
	readonly hash: (
		data: Uint8Array,
	) => Effect.Effect<Uint8Array, CryptoOperationError>;
}

/**
 * Tag for Keccak256Service dependency injection
 */
export const Keccak256Service = Context.GenericTag<Keccak256Service>(
	"@voltaire/Address/Keccak256",
);

/**
 * Service interface for Secp256k1 cryptographic operations
 */
export interface Secp256k1Service {
	/**
	 * Derive public key from private key
	 */
	readonly derivePublicKey: (
		privateKey: Uint8Array,
	) => Effect.Effect<Uint8Array, CryptoOperationError>;

	/**
	 * Get public key point coordinates from private key
	 */
	readonly getPublicKey: (
		privateKey: Uint8Array,
	) => Effect.Effect<{ x: bigint; y: bigint }, CryptoOperationError>;
}

/**
 * Tag for Secp256k1Service dependency injection
 */
export const Secp256k1Service = Context.GenericTag<Secp256k1Service>(
	"@voltaire/Address/Secp256k1",
);

/**
 * Service interface for RLP encoding operations
 */
export interface RlpEncoderService {
	/**
	 * Encode data using RLP encoding
	 */
	readonly encode: (
		data: unknown,
	) => Effect.Effect<Uint8Array, RlpEncodingError>;
}

/**
 * Tag for RlpEncoderService dependency injection
 */
export const RlpEncoderService = Context.GenericTag<RlpEncoderService>(
	"@voltaire/Address/RlpEncoder",
);

/**
 * Combined type for all Address crypto services
 */
export type AddressServices =
	| Keccak256Service
	| Secp256k1Service
	| RlpEncoderService;
