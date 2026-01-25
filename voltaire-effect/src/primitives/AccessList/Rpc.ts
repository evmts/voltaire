/**
 * Schema for EIP-2930 Access Lists in JSON-RPC format.
 *
 * @description
 * Transforms JSON-compatible access list input (with hex strings) into
 * the branded `BrandedAccessList` type with proper byte arrays.
 *
 * @example Decoding
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as S from 'effect/Schema'
 *
 * const accessList = S.decodeSync(AccessList.Rpc)([
 *   {
 *     address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *     storageKeys: ['0x0000000000000000000000000000000000000000000000000000000000000001']
 *   }
 * ])
 * ```
 *
 * @example Encoding
 * ```typescript
 * const json = S.encodeSync(AccessList.Rpc)(accessList)
 * ```
 *
 * @module AccessList/Rpc
 * @since 0.1.0
 */

import {
	AccessList,
	type BrandedAccessList,
	type Item,
} from "@tevm/voltaire/AccessList";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Raw access list item input type (JSON-compatible).
 * @since 0.1.0
 */
export type AccessListItemInput = {
	address: string;
	storageKeys: readonly string[];
};

/**
 * Raw access list input type (JSON-compatible).
 * @since 0.1.0
 */
export type AccessListInput = readonly AccessListItemInput[];

const AccessListTypeSchema = S.declare<BrandedAccessList>(
	(u): u is BrandedAccessList => Array.isArray(u) && AccessList.is(u),
	{ identifier: "AccessList" },
);

const AccessListItemInputSchema = S.Struct({
	address: S.String,
	storageKeys: S.Array(S.String),
});

const AccessListInputSchema = S.Array(AccessListItemInputSchema);

/**
 * Schema for EIP-2930 Access Lists in JSON-RPC format.
 *
 * @since 0.1.0
 */
export const Rpc: S.Schema<BrandedAccessList, AccessListInput> =
	S.transformOrFail(AccessListInputSchema, AccessListTypeSchema, {
		strict: true,
		decode: (input, _options, ast) => {
			try {
				const items: Item[] = input.map((item) => ({
					address: parseAddress(item.address),
					storageKeys: item.storageKeys.map(parseHash),
				}));
				return ParseResult.succeed(AccessList.from(items));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (list) => {
			const items: AccessListItemInput[] = list.map((item) => ({
				address: toHexString(item.address),
				storageKeys: item.storageKeys.map(toHexString),
			}));
			return ParseResult.succeed(items);
		},
	}).annotations({ identifier: "AccessList.Rpc" });

function parseAddress(hex: string): AddressType {
	const bytes = hexToBytes(hex, 20);
	return bytes as AddressType;
}

function parseHash(hex: string): HashType {
	const bytes = hexToBytes(hex, 32);
	return bytes as HashType;
}

function hexToBytes(hex: string, expectedLength: number): Uint8Array {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (cleanHex.length !== expectedLength * 2) {
		throw new Error(
			`Expected ${expectedLength} bytes, got ${cleanHex.length / 2}`,
		);
	}
	const bytes = new Uint8Array(expectedLength);
	for (let i = 0; i < expectedLength; i++) {
		bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function toHexString(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}
