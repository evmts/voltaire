/**
 * @fileoverview Gets a text record for an ENS name.
 * @module Provider/ens/getEnsText
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { ProviderService } from "../ProviderService.js";
import { EnsError } from "./EnsError.js";
import { ENS_UNIVERSAL_RESOLVER_ADDRESS } from "./constants.js";
import {
	bytesToHex,
	dnsEncode,
	encodeTextCall,
	hexToBytes,
	namehash,
} from "./utils.js";

/**
 * Parameters for getEnsText.
 * @since 0.0.1
 */
export interface GetEnsTextParams {
	/** ENS name to get text record for */
	readonly name: string;
	/** Text record key (e.g., "url", "description", "email") */
	readonly key: string;
	/** Optional Universal Resolver address override */
	readonly universalResolverAddress?: `0x${string}`;
}

/**
 * Gets a text record for an ENS name.
 *
 * @description
 * Retrieves a text record associated with an ENS name.
 * Common keys include: "url", "description", "email", "avatar",
 * "notice", "keywords", "com.twitter", "com.github", etc.
 *
 * @param params - Resolution parameters
 * @returns Effect yielding the text record value or null
 *
 * @example
 * ```typescript
 * const twitter = yield* getEnsText({
 *   name: 'vitalik.eth',
 *   key: 'com.twitter'
 * })
 * // 'VitalikButerin'
 * ```
 *
 * @since 0.0.1
 */
export const getEnsText = (
	params: GetEnsTextParams,
): Effect.Effect<string | null, EnsError, ProviderService> =>
	Effect.gen(function* () {
		const { name, key, universalResolverAddress = ENS_UNIVERSAL_RESOLVER_ADDRESS } =
			params;

		const provider = yield* ProviderService;

		const node = namehash(name);
		const dnsName = dnsEncode(name);
		const textCallData = encodeTextCall(node, key);

		// Encode the Universal Resolver resolve(bytes,bytes) call
		const selector = "9061b923";
		const dnsNameHex = bytesToHex(dnsName).slice(2);
		const textCallHex = textCallData.slice(2);

		const offset1 = "0000000000000000000000000000000000000000000000000000000000000040";
		const offset2Num = 64 + Math.ceil(dnsName.length / 32) * 32 + 32;
		const offset2 = offset2Num.toString(16).padStart(64, "0");
		const len1 = dnsName.length.toString(16).padStart(64, "0");
		const data1 = dnsNameHex.padEnd(Math.ceil(dnsName.length / 32) * 64, "0");
		const len2 = (textCallHex.length / 2).toString(16).padStart(64, "0");
		const data2 = textCallHex.padEnd(Math.ceil(textCallHex.length / 64) * 64, "0");

		const callData = `0x${selector}${offset1}${offset2}${len1}${data1}${len2}${data2}` as `0x${string}`;

		const result = yield* provider
			.call({
				to: universalResolverAddress,
				data: callData,
			})
			.pipe(
				Effect.mapError(
					(e) =>
						new EnsError(
							{ name, key },
							`Failed to get ENS text record: ${e.message}`,
							e,
						),
				),
			);

		if (!result || result === "0x") {
			return null;
		}

		// Decode resolve result to get the text() return value
		const hex = result.slice(2);
		if (hex.length < 192) {
			return null;
		}

		// First 32 bytes: offset to bytes data
		const dataOffset = Number.parseInt(hex.slice(0, 64), 16);
		const dataLengthStart = dataOffset * 2;
		const dataLength = Number.parseInt(
			hex.slice(dataLengthStart, dataLengthStart + 64),
			16,
		);

		if (dataLength === 0) {
			return null;
		}

		// Get the actual text() return data
		const textData = hex.slice(dataLengthStart + 64, dataLengthStart + 64 + dataLength * 2);

		// text() returns a string, need to decode ABI string
		if (textData.length < 128) {
			return null;
		}

		// String offset (should be 0x20)
		const stringOffset = Number.parseInt(textData.slice(0, 64), 16);
		const stringLengthStart = stringOffset * 2;
		const stringLength = Number.parseInt(
			textData.slice(stringLengthStart, stringLengthStart + 64),
			16,
		);

		if (stringLength === 0) {
			return null;
		}

		const stringDataStart = stringLengthStart + 64;
		const stringHex = textData.slice(stringDataStart, stringDataStart + stringLength * 2);
		const bytes = hexToBytes(stringHex);
		return new TextDecoder().decode(bytes);
	});
