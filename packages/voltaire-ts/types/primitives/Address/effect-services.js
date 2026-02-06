import * as Context from "effect/Context";
/**
 * Tag for Keccak256Service dependency injection
 */
export const Keccak256Service = Context.GenericTag("@voltaire/Address/Keccak256");
/**
 * Tag for Secp256k1Service dependency injection
 */
export const Secp256k1Service = Context.GenericTag("@voltaire/Address/Secp256k1");
/**
 * Tag for RlpEncoderService dependency injection
 */
export const RlpEncoderService = Context.GenericTag("@voltaire/Address/RlpEncoder");
