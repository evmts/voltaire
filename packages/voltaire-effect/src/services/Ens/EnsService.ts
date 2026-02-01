/**
 * @fileoverview ENS service definition for ENS resolution.
 *
 * @module EnsService
 * @since 0.0.1
 *
 * @description
 * The EnsService provides a high-level interface for resolving Ethereum Name
 * Service (ENS) records such as addresses, reverse names, resolver contracts,
 * avatars, and text records.
 *
 * Requires ProviderService to be provided via the live layer.
 *
 * @see {@link DefaultEns} - The live implementation layer
 * @see {@link ProviderService} - Required provider dependency
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { EnsError } from "../Provider/ens/EnsError.js";
import type { GetEnsAddressParams } from "../Provider/ens/getEnsAddress.js";
import type { GetEnsAvatarParams } from "../Provider/ens/getEnsAvatar.js";
import type { GetEnsNameParams } from "../Provider/ens/getEnsName.js";
import type { GetEnsResolverParams } from "../Provider/ens/getEnsResolver.js";
import type { GetEnsTextParams } from "../Provider/ens/getEnsText.js";

/**
 * Shape of the ENS service.
 *
 * @since 0.0.1
 */
export type EnsShape = {
	/** Resolves an ENS name to an address */
	readonly getEnsAddress: (
		params: GetEnsAddressParams,
	) => Effect.Effect<`0x${string}` | null, EnsError>;
	/** Reverse-resolves an address to its ENS name */
	readonly getEnsName: (
		params: GetEnsNameParams,
	) => Effect.Effect<string | null, EnsError>;
	/** Gets the resolver address for an ENS name */
	readonly getEnsResolver: (
		params: GetEnsResolverParams,
	) => Effect.Effect<`0x${string}` | null, EnsError>;
	/** Gets the avatar URL/URI for an ENS name */
	readonly getEnsAvatar: (
		params: GetEnsAvatarParams,
	) => Effect.Effect<string | null, EnsError>;
	/** Gets a text record for an ENS name */
	readonly getEnsText: (
		params: GetEnsTextParams,
	) => Effect.Effect<string | null, EnsError>;
};

/**
 * ENS service for name resolution.
 *
 * @description
 * Provides methods for resolving ENS names, reverse lookups, and records.
 *
 * @since 0.0.1
 */
export class EnsService extends Context.Tag("EnsService")<
	EnsService,
	EnsShape
>() {}
