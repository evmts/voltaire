/**
 * @fileoverview ENS module exports for ENS resolution utilities.
 *
 * @module Ens
 * @since 0.0.1
 *
 * @description
 * This module provides the ENS service for resolving names and records.
 * It includes the service definition, live implementation layer, and
 * helper utilities for direct ENS resolution.
 *
 * Main exports:
 * - {@link EnsService} - The service tag/interface
 * - {@link DefaultEns} - The live implementation layer
 * - {@link EnsError} - Error type for ENS operations
 *
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { EnsService, DefaultEns, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const ens = yield* EnsService
 *   return yield* ens.getEnsAddress({ name: 'vitalik.eth' })
 * }).pipe(
 *   Effect.provide(DefaultEns),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link ProviderService} - Required dependency for RPC communication
 */

export {
	ENS_REGISTRY_ADDRESS,
	ENS_UNIVERSAL_RESOLVER_ADDRESS,
} from "../Provider/ens/constants.js";
export { EnsError } from "../Provider/ens/EnsError.js";
export {
	type GetEnsAddressParams,
	getEnsAddress,
} from "../Provider/ens/getEnsAddress.js";
export {
	type GetEnsAvatarParams,
	getEnsAvatar,
} from "../Provider/ens/getEnsAvatar.js";
export {
	type GetEnsNameParams,
	getEnsName,
} from "../Provider/ens/getEnsName.js";
export {
	type GetEnsResolverParams,
	getEnsResolver,
} from "../Provider/ens/getEnsResolver.js";
export {
	type GetEnsTextParams,
	getEnsText,
} from "../Provider/ens/getEnsText.js";
export { DefaultEns } from "./DefaultEns.js";
export { EnsService, type EnsShape } from "./EnsService.js";
