import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { hash as keccak256Native } from "../../crypto/Keccak256/hash.js";
import { derivePublicKey as derivePublicKeyNative } from "../../crypto/Secp256k1/derivePublicKey.js";
import { encode as rlpEncodeNative } from "../Rlp/BrandedRlp/encode.js";
import { CryptoOperationError, RlpEncodingError } from "./effect-errors.js";
import {
	Keccak256Service,
	RlpEncoderService,
	Secp256k1Service,
} from "./effect-services.js";

/**
 * Live implementation of Keccak256Service
 * Wraps native keccak256 implementation with Effect error handling
 */
export const Keccak256ServiceLive = Layer.succeed(
	Keccak256Service,
	Keccak256Service.of({
		hash: (data) =>
			Effect.try({
				try: () => keccak256Native(data),
				catch: (error) =>
					new CryptoOperationError({
						operation: "keccak256",
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			}),
	}),
);

/**
 * Live implementation of Secp256k1Service
 * Wraps native secp256k1 operations with Effect error handling
 */
export const Secp256k1ServiceLive = Layer.succeed(
	Secp256k1Service,
	Secp256k1Service.of({
		derivePublicKey: (privateKey) =>
			Effect.try({
				try: () => derivePublicKeyNative(privateKey),
				catch: (error) =>
					new CryptoOperationError({
						operation: "secp256k1",
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			}),
		getPublicKey: (privateKey) =>
			Effect.try({
				try: () => {
					// This would need implementation using @noble/curves
					// For now, derive public key and extract x, y coordinates
					const publicKey = derivePublicKeyNative(privateKey);
					// Public key is 64 bytes: 32 bytes for x, 32 bytes for y
					const x = publicKey.slice(0, 32);
					const y = publicKey.slice(32, 64);

					// Convert to bigint
					let xBigInt = 0n;
					let yBigInt = 0n;
					for (let i = 0; i < 32; i++) {
						xBigInt = (xBigInt << 8n) | BigInt(x[i]);
						yBigInt = (yBigInt << 8n) | BigInt(y[i]);
					}
					return { x: xBigInt, y: yBigInt };
				},
				catch: (error) =>
					new CryptoOperationError({
						operation: "secp256k1",
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			}),
	}),
);

/**
 * Live implementation of RlpEncoderService
 * Wraps native RLP encoder with Effect error handling
 */
export const RlpEncoderServiceLive = Layer.succeed(
	RlpEncoderService,
	RlpEncoderService.of({
		encode: (data) =>
			Effect.try({
				try: () => rlpEncodeNative(data),
				catch: (error) =>
					new RlpEncodingError({
						data,
						message: error instanceof Error ? error.message : String(error),
						cause: error,
					}),
			}),
	}),
);

/**
 * Combined layer providing all Address-related crypto services
 * Use this when you need all services at once
 */
export const AddressServicesLive = Layer.mergeAll(
	Keccak256ServiceLive,
	Secp256k1ServiceLive,
	RlpEncoderServiceLive,
);

/**
 * Test layer with mock implementations for testing
 * Override specific service behaviors for testing scenarios
 */
export const AddressServicesTest = Layer.mergeAll(
	// Mock Keccak256 that returns predictable hashes
	Layer.succeed(
		Keccak256Service,
		Keccak256Service.of({
			hash: (data) => Effect.succeed(new Uint8Array(32).fill(0xaa)),
		}),
	),
	// Mock Secp256k1 that returns predictable keys
	Layer.succeed(
		Secp256k1Service,
		Secp256k1Service.of({
			derivePublicKey: (privateKey) => Effect.succeed(new Uint8Array(64).fill(0xbb)),
			getPublicKey: (privateKey) => Effect.succeed({ x: 0xccccccccn, y: 0xdddddddddn }),
		}),
	),
	// Mock RLP encoder
	Layer.succeed(
		RlpEncoderService,
		RlpEncoderService.of({
			encode: (data) => Effect.succeed(new Uint8Array([0xee, 0xee])),
		}),
	),
);