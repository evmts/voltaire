/**
 * @fileoverview Unwrap ERC-6492 signatures.
 * @module ERC6492/unwrapSignature
 * @since 0.2.14
 */

import { decodeParameters } from "@tevm/voltaire/Abi";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Hex from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

const ERC6492_SUFFIX =
	"0x6492649264926492649264926492649264926492649264926492649264926492" as const;

const ERC6492_PARAMS = [
	{ type: "address", name: "factory" },
	{ type: "bytes", name: "factoryData" },
	{ type: "bytes", name: "signature" },
] as const;

const normalizeHex = (value: Uint8Array | `0x${string}`): HexType =>
	typeof value === "string" ? (value as HexType) : Hex.fromBytes(value);

/**
 * Unwrap an ERC-6492 signature into its components.
 *
 * @param signature - The wrapped signature
 * @returns Effect containing unwrapped data or null if not wrapped
 *
 * @since 0.2.14
 */
export const unwrapSignature = (
	signature: HexType | `0x${string}`,
): Effect.Effect<
	{
		signature: HexType;
		factoryAddress: AddressType;
		factoryData: HexType;
	} | null,
	never
> =>
	Effect.sync(() => {
		const lower = signature.toLowerCase();
		const suffix = ERC6492_SUFFIX.slice(2);
		if (!lower.endsWith(suffix)) {
			return null;
		}

		const encoded =
			`0x${lower.slice(2, lower.length - suffix.length)}` as const;

		try {
			const decoded = decodeParameters(
				ERC6492_PARAMS as any,
				Hex.toBytes(encoded),
			) as unknown as [
				`0x${string}` | Uint8Array,
				`0x${string}` | Uint8Array,
				`0x${string}` | Uint8Array,
			];

			const [factory, factoryData, innerSignature] = decoded;
			return {
				factoryAddress: Address(factory as any),
				factoryData: normalizeHex(factoryData),
				signature: normalizeHex(innerSignature),
			};
		} catch {
			return null;
		}
	});
