/**
 * @fileoverview Request permissions action for EIP-2255 wallet_requestPermissions.
 *
 * @module Signer/actions/requestPermissions
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import { TransportService } from "../../Transport/index.js";
import {
	type Permission,
	type PermissionRequest,
	SignerError,
} from "../SignerService.js";

/**
 * Requests specific permissions from the wallet (EIP-2255).
 *
 * @description
 * Prompts the user to grant specific permissions to the dapp.
 * This allows requesting permissions like eth_accounts access.
 *
 * @param permissions - Object with permission names as keys
 * @returns Effect yielding array of granted permissions
 *
 * @example
 * ```typescript
 * // Request accounts permission
 * const permissions = yield* requestPermissions({
 *   eth_accounts: {}
 * });
 *
 * // Request with specific parameters
 * const permissions = yield* requestPermissions({
 *   eth_accounts: {},
 *   eth_chainId: {}
 * });
 * ```
 *
 * @since 0.0.1
 */
export const requestPermissions = (
	permissions: PermissionRequest,
): Effect.Effect<Permission[], SignerError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		return yield* transport
			.request<Permission[]>("wallet_requestPermissions", [permissions])
			.pipe(
				Effect.mapError(
					(e) =>
						new SignerError(
							{ action: "requestPermissions", permissions },
							`Failed to request permissions: ${e.message}`,
							{ cause: e, code: e.code },
						),
				),
			);
	});

export type {
	Caveat,
	Permission,
	PermissionRequest,
} from "../SignerService.js";
