/**
 * @fileoverview Get addresses action for eth_accounts (non-prompting variant).
 *
 * @module Signer/actions/getAddresses
 * @since 0.0.1
 */

import { Address, type BrandedAddress } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { TransportService } from "../../Transport/index.js";
import { SignerError } from "../SignerService.js";

type AddressType = BrandedAddress.AddressType;

/**
 * Gets the connected wallet addresses without prompting (eth_accounts).
 *
 * @description
 * Retrieves the list of addresses the wallet has exposed to this dapp.
 * Unlike requestAddresses, this does NOT prompt the user - it only returns
 * addresses that have already been authorized.
 *
 * Returns an empty array if no addresses have been authorized yet.
 *
 * @returns Effect yielding array of connected addresses
 *
 * @example
 * ```typescript
 * const addresses = yield* getAddresses();
 * if (addresses.length === 0) {
 *   console.log('No addresses authorized, need to call requestAddresses');
 * } else {
 *   console.log('Connected address:', Address.toHex(addresses[0]));
 * }
 * ```
 *
 * @since 0.0.1
 */
export const getAddresses = (): Effect.Effect<
	AddressType[],
	SignerError,
	TransportService
> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;

		return yield* transport.request<string[]>("eth_accounts").pipe(
			Effect.map((addresses) =>
				addresses.map((addr) => Address(addr) as AddressType),
			),
			Effect.mapError(
				(e) =>
					new SignerError(
						{ action: "getAddresses" },
						`Failed to get addresses: ${e.message}`,
						{ cause: e, code: e.code },
					),
			),
		);
	});
