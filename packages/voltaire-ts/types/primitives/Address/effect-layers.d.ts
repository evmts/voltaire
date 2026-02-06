import * as Layer from "effect/Layer";
import { Keccak256Service, RlpEncoderService, Secp256k1Service } from "./effect-services.js";
/**
 * Live implementation of Keccak256Service
 * Wraps native keccak256 implementation with Effect error handling
 */
export declare const Keccak256ServiceLive: Layer.Layer<Keccak256Service, never, never>;
/**
 * Live implementation of Secp256k1Service
 * Wraps native secp256k1 operations with Effect error handling
 */
export declare const Secp256k1ServiceLive: Layer.Layer<Secp256k1Service, never, never>;
/**
 * Live implementation of RlpEncoderService
 * Wraps native RLP encoder with Effect error handling
 */
export declare const RlpEncoderServiceLive: Layer.Layer<RlpEncoderService, never, never>;
/**
 * Combined layer providing all Address-related crypto services
 * Use this when you need all services at once
 */
export declare const AddressServicesLive: Layer.Layer<Keccak256Service | Secp256k1Service | RlpEncoderService, never, never>;
/**
 * Test layer with mock implementations for testing
 * Override specific service behaviors for testing scenarios
 */
export declare const AddressServicesTest: Layer.Layer<Keccak256Service | Secp256k1Service | RlpEncoderService, never, never>;
//# sourceMappingURL=effect-layers.d.ts.map