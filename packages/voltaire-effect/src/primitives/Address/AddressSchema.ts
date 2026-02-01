/**
 * @fileoverview Effect Schema for the Address branded type.
 * Provides a canonical schema declaration for Ethereum addresses.
 *
 * @module Address/AddressSchema
 * @since 0.1.0
 */

import type { AddressType } from "@tevm/voltaire/Address";
import * as S from "effect/Schema";

/**
 * Canonical schema declaration for AddressType.
 * Validates that a value is a 20-byte Uint8Array.
 *
 * @since 0.1.0
 */
export const AddressTypeSchema = S.declare<AddressType>(
	(u): u is AddressType => u instanceof Uint8Array && u.length === 20,
	{ identifier: "Address" },
);
