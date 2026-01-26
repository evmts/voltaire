/**
 * @fileoverview Gets the avatar for an ENS name.
 * @module Provider/ens/getEnsAvatar
 * @since 0.0.1
 */

import type * as Effect from "effect/Effect";
import type { ProviderService } from "../ProviderService.js";
import type { EnsError } from "./EnsError.js";
import { getEnsText } from "./getEnsText.js";

/**
 * Parameters for getEnsAvatar.
 * @since 0.0.1
 */
export interface GetEnsAvatarParams {
	/** ENS name to get avatar for */
	readonly name: string;
	/** Optional Universal Resolver address override */
	readonly universalResolverAddress?: `0x${string}`;
}

/**
 * Gets the avatar URL/URI for an ENS name.
 *
 * @description
 * Retrieves the avatar text record for an ENS name.
 * The avatar can be a URL, IPFS URI, NFT URI (eip155:), etc.
 *
 * Note: This returns the raw avatar record value. For NFT avatars,
 * additional resolution may be needed to get the actual image URL.
 *
 * @param params - Resolution parameters
 * @returns Effect yielding the avatar URI or null
 *
 * @example
 * ```typescript
 * const avatar = yield* getEnsAvatar({ name: 'vitalik.eth' })
 * // 'eip155:1/erc721:0xb7F7...'
 * ```
 *
 * @since 0.0.1
 */
export const getEnsAvatar = (
	params: GetEnsAvatarParams,
): Effect.Effect<string | null, EnsError, ProviderService> =>
	getEnsText({
		name: params.name,
		key: "avatar",
		universalResolverAddress: params.universalResolverAddress,
	});
