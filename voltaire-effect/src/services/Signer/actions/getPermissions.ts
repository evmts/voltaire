/**
 * @fileoverview Get permissions action for EIP-2255 wallet_getPermissions.
 *
 * @module Signer/actions/getPermissions
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { SignerError } from "../SignerService.js";
import { TransportService } from "../../Transport/index.js";

/**
 * Caveat applied to a permission.
 *
 * @since 0.0.1
 */
export interface Caveat {
	/** Caveat type */
	readonly type: string;
	/** Caveat value */
	readonly value: unknown;
}

/**
 * Wallet permission object per EIP-2255.
 *
 * @since 0.0.1
 */
export interface Permission {
	/** Unix timestamp when permission was granted */
	readonly date: number;
	/** Invoker (origin) that was granted the permission */
	readonly invoker: string;
	/** Parent capability (always "wallet_api" for root) */
	readonly parentCapability: string;
	/** Optional caveats restricting the permission */
	readonly caveats?: readonly Caveat[];
}

/**
 * Gets the current permissions granted to the dapp (EIP-2255).
 *
 * @description
 * Retrieves the list of permissions currently granted to this dapp
 * by the connected wallet. This does not prompt the user.
 *
 * @returns Effect yielding array of granted permissions
 *
 * @example
 * ```typescript
 * const permissions = yield* getPermissions();
 * const hasAccountAccess = permissions.some(
 *   p => p.parentCapability === 'eth_accounts'
 * );
 * console.log('Has account access:', hasAccountAccess);
 * ```
 *
 * @since 0.0.1
 */
export const getPermissions = (): Effect.Effect<
	Permission[],
	SignerError,
	TransportService
> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		return yield* transport.request<Permission[]>("wallet_getPermissions").pipe(
			Effect.mapError(
				(e) =>
					new SignerError(
						{ action: "getPermissions" },
						`Failed to get permissions: ${e.message}`,
						{ cause: e, code: e.code },
					),
			),
		);
	});
