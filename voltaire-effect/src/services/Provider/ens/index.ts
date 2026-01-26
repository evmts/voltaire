/**
 * @fileoverview ENS resolution utilities for Ethereum Name Service.
 * @module Provider/ens
 * @since 0.0.1
 *
 * @description
 * Provides Effect-based functions for resolving ENS names and addresses.
 * Uses the ENS Universal Resolver for name resolution and the ENS Registry
 * for resolver lookups.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, HttpTransport } from 'voltaire-effect/services'
 * import { getEnsAddress, getEnsName } from 'voltaire-effect/services/Provider/ens'
 *
 * const program = Effect.gen(function* () {
 *   // Forward resolution
 *   const address = yield* getEnsAddress({ name: 'vitalik.eth' })
 *
 *   // Reverse resolution
 *   const name = yield* getEnsName({
 *     address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *   })
 *
 *   return { address, name }
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://eth-mainnet.g.alchemy.com/v2/...'))
 * )
 * ```
 */

export { EnsError } from "./EnsError.js";
export {
	ENS_REGISTRY_ADDRESS,
	ENS_UNIVERSAL_RESOLVER_ADDRESS,
} from "./constants.js";
export {
	getEnsAddress,
	type GetEnsAddressParams,
} from "./getEnsAddress.js";
export { getEnsAvatar, type GetEnsAvatarParams } from "./getEnsAvatar.js";
export { getEnsName, type GetEnsNameParams } from "./getEnsName.js";
export {
	getEnsResolver,
	type GetEnsResolverParams,
} from "./getEnsResolver.js";
export { getEnsText, type GetEnsTextParams } from "./getEnsText.js";
