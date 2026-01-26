/**
 * @fileoverview Effect Schema for the Signature branded type.
 * Provides a canonical schema declaration for cryptographic signatures.
 *
 * @module Signature/SignatureSchema
 * @since 0.1.0
 */

import type { SignatureType } from "@tevm/voltaire/Signature";
import * as S from "effect/Schema";

/**
 * Canonical schema declaration for SignatureType.
 * Validates that a value is a Uint8Array with a valid algorithm property.
 *
 * @since 0.1.0
 */
export const SignatureTypeSchema = S.declare<SignatureType>(
	(u): u is SignatureType => {
		if (!(u instanceof Uint8Array)) return false;
		const val = u as unknown as Record<string, unknown>;
		return (
			"algorithm" in val &&
			(val.algorithm === "secp256k1" ||
				val.algorithm === "p256" ||
				val.algorithm === "ed25519")
		);
	},
	{ identifier: "Signature" },
);
