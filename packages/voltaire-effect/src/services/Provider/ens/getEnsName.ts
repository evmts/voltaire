/**
 * @fileoverview Reverse resolves an Ethereum address to its ENS name.
 * @module Provider/ens/getEnsName
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { call } from "../functions/call.js";
import type { ProviderService } from "../ProviderService.js";
import { ENS_UNIVERSAL_RESOLVER_ADDRESS } from "./constants.js";
import { EnsError } from "./EnsError.js";
import { bytesToHex, dnsEncode, toReverseName } from "./utils.js";

/**
 * Parameters for getEnsName.
 * @since 0.0.1
 */
export interface GetEnsNameParams {
	/** Ethereum address to reverse resolve */
	readonly address: `0x${string}`;
	/** Optional Universal Resolver address override */
	readonly universalResolverAddress?: `0x${string}`;
}

/**
 * Reverse resolves an Ethereum address to its ENS name.
 *
 * @description
 * Uses the ENS Universal Resolver to perform a reverse lookup,
 * finding the primary ENS name associated with an address.
 * Returns null if no name is set.
 *
 * @param params - Resolution parameters
 * @returns Effect yielding the ENS name or null
 *
 * @example
 * ```typescript
 * const name = yield* getEnsName({
 *   address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 * })
 * // 'vitalik.eth'
 * ```
 *
 * @since 0.0.1
 */
export const getEnsName = (
	params: GetEnsNameParams,
): Effect.Effect<string | null, EnsError, ProviderService> =>
	Effect.gen(function* () {
		const {
			address,
			universalResolverAddress = ENS_UNIVERSAL_RESOLVER_ADDRESS,
		} = params;

		const reverseName = toReverseName(address);
		const dnsName = dnsEncode(reverseName);

		// Encode the Universal Resolver reverse(bytes) call
		// selector = 0xec11c823
		const selector = "ec11c823";
		const dnsNameHex = bytesToHex(dnsName).slice(2);

		// Encode: offset, length, data
		const offset =
			"0000000000000000000000000000000000000000000000000000000000000020";
		const len = dnsName.length.toString(16).padStart(64, "0");
		const data = dnsNameHex.padEnd(Math.ceil(dnsName.length / 32) * 64, "0");

		const callData = `0x${selector}${offset}${len}${data}` as `0x${string}`;

		const result = yield* call({
			to: universalResolverAddress,
			data: callData,
		}).pipe(
			Effect.mapError(
				(e) =>
					new EnsError(
						address,
						`Failed to reverse resolve address: ${e.message}`,
						e,
					),
			),
		);

		if (!result || result === "0x") {
			return null;
		}

		// The result is (string name, address resolver, address reverseResolver)
		// Decode the first return value (string)
		const hex = result.slice(2);
		if (hex.length < 192) {
			return null;
		}

		// First 32 bytes: offset to string data
		const stringOffset = Number.parseInt(hex.slice(0, 64), 16);
		const stringLengthStart = stringOffset * 2;
		const stringLength = Number.parseInt(
			hex.slice(stringLengthStart, stringLengthStart + 64),
			16,
		);

		if (stringLength === 0) {
			return null;
		}

		// Get the string bytes
		const stringDataStart = stringLengthStart + 64;
		const stringHex = hex.slice(
			stringDataStart,
			stringDataStart + stringLength * 2,
		);
		const bytes = new Uint8Array(stringLength);
		for (let i = 0; i < stringLength; i++) {
			bytes[i] = Number.parseInt(stringHex.slice(i * 2, i * 2 + 2), 16);
		}

		const name = new TextDecoder().decode(bytes);
		return name || null;
	});
