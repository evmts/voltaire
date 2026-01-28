/**
 * @fileoverview Resolves an ENS name to an Ethereum address.
 * @module Provider/ens/getEnsAddress
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { call } from "../functions/call.js";
import type { ProviderService } from "../ProviderService.js";
import { ENS_UNIVERSAL_RESOLVER_ADDRESS } from "./constants.js";
import { EnsError } from "./EnsError.js";
import {
	bytesToHex,
	decodeAddress,
	dnsEncode,
	encodeAddrCall,
	namehash,
} from "./utils.js";

/**
 * Parameters for getEnsAddress.
 * @since 0.0.1
 */
export interface GetEnsAddressParams {
	/** ENS name to resolve (e.g., "vitalik.eth") */
	readonly name: string;
	/** Optional Universal Resolver address override */
	readonly universalResolverAddress?: `0x${string}`;
}

/**
 * Resolves an ENS name to an Ethereum address.
 *
 * @description
 * Uses the ENS Universal Resolver to resolve an ENS name to its
 * associated Ethereum address. Returns null if the name doesn't
 * resolve to an address.
 *
 * @param params - Resolution parameters
 * @returns Effect yielding the address or null
 *
 * @example
 * ```typescript
 * const address = yield* getEnsAddress({ name: 'vitalik.eth' })
 * // '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 * ```
 *
 * @since 0.0.1
 */
export const getEnsAddress = (
	params: GetEnsAddressParams,
): Effect.Effect<`0x${string}` | null, EnsError, ProviderService> =>
	Effect.gen(function* () {
		const { name, universalResolverAddress = ENS_UNIVERSAL_RESOLVER_ADDRESS } =
			params;

		const node = namehash(name);
		const dnsName = dnsEncode(name);
		const addrCallData = encodeAddrCall(node);

		// Encode the Universal Resolver resolve(bytes,bytes) call
		// selector = 0x9061b923
		const selector = "9061b923";
		const dnsNameHex = bytesToHex(dnsName).slice(2);
		const addrCallHex = addrCallData.slice(2);

		// Encode dynamic data: offset1, offset2, length1, data1, length2, data2
		const offset1 =
			"0000000000000000000000000000000000000000000000000000000000000040";
		const offset2Num = 64 + Math.ceil(dnsName.length / 32) * 32 + 32;
		const offset2 = offset2Num.toString(16).padStart(64, "0");
		const len1 = dnsName.length.toString(16).padStart(64, "0");
		const data1 = dnsNameHex.padEnd(Math.ceil(dnsName.length / 32) * 64, "0");
		const len2 = (addrCallHex.length / 2).toString(16).padStart(64, "0");
		const data2 = addrCallHex.padEnd(
			Math.ceil(addrCallHex.length / 64) * 64,
			"0",
		);

		const callData =
			`0x${selector}${offset1}${offset2}${len1}${data1}${len2}${data2}` as `0x${string}`;

		const result = yield* call({
			to: universalResolverAddress,
			data: callData,
		}).pipe(
			Effect.mapError(
				(e) =>
					new EnsError(name, `Failed to resolve ENS name: ${e.message}`, e),
			),
		);

		// Decode the resolve result - first word is offset to data, then length, then data
		if (!result || result === "0x") {
			return null;
		}

		// The result contains (bytes result, address resolver)
		// Skip first 64 hex chars (32 bytes offset), get length from next 64, then data
		const hex = result.slice(2);
		if (hex.length < 192) {
			return null;
		}

		// First 32 bytes: offset to first return value
		const dataOffset = Number.parseInt(hex.slice(0, 64), 16);
		// At dataOffset: length of bytes
		const dataLengthStart = dataOffset * 2;
		const dataLength = Number.parseInt(
			hex.slice(dataLengthStart, dataLengthStart + 64),
			16,
		);

		if (dataLength === 0) {
			return null;
		}

		// Get the actual return data (the addr() result)
		const addrData =
			`0x${hex.slice(dataLengthStart + 64, dataLengthStart + 64 + dataLength * 2)}` as `0x${string}`;

		return decodeAddress(addrData);
	});
