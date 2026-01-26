/**
 * @fileoverview Wrap signatures for ERC-6492 counterfactual validation.
 * @module ERC6492/wrapSignature
 * @since 0.2.14
 */

import { encodeParameters } from "@tevm/voltaire/Abi";
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

const normalizeAddress = (address: AddressType | `0x${string}`): `0x${string}` =>
	typeof address === "string" ? address : Address.toHex(address);

/**
 * Wrap a signature with ERC-6492 deployment data.
 *
 * @param params - Signature and factory data to wrap
 * @param params.signature - The original signature bytes
 * @param params.factoryAddress - Factory contract address
 * @param params.factoryData - Factory calldata to deploy the account
 * @returns Effect containing the wrapped signature
 *
 * @since 0.2.14
 */
export const wrapSignature = (params: {
	signature: HexType | `0x${string}`;
	factoryAddress: AddressType | `0x${string}`;
	factoryData: HexType | `0x${string}`;
}): Effect.Effect<HexType, never> =>
	Effect.sync(() => {
		const encoded = encodeParameters(ERC6492_PARAMS as any, [
			normalizeAddress(params.factoryAddress),
			params.factoryData,
			params.signature,
		] as any);

		const encodedHex = Hex.fromBytes(encoded);
		return `${encodedHex}${ERC6492_SUFFIX.slice(2)}` as HexType;
	});
