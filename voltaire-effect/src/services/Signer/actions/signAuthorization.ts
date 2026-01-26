/**
 * @fileoverview Sign authorization action for EIP-7702.
 *
 * @module Signer/actions/signAuthorization
 * @since 0.0.1
 */

import { Address, type BrandedAddress } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { SignerError } from "../SignerService.js";
import { ProviderService } from "../../Provider/index.js";
import {
	AccountService,
	type SignedAuthorization,
} from "../../Account/index.js";

type AddressType = BrandedAddress.AddressType;

/**
 * Parameters for signing an EIP-7702 authorization.
 *
 * @since 0.0.1
 */
export interface SignAuthorizationParams {
	/** Address of the contract to delegate to */
	readonly contractAddress: `0x${string}` | AddressType;
	/** Chain ID where the authorization is valid */
	readonly chainId?: bigint;
	/** Nonce of the authorizing account (fetched if not provided) */
	readonly nonce?: bigint;
}

/**
 * Signs an EIP-7702 authorization tuple.
 *
 * @description
 * Signs an authorization that allows the account's EOA to delegate code
 * execution to a contract. The signed authorization can be included in
 * a type 4 (EIP-7702) transaction's authorizationList.
 *
 * Per EIP-7702, the signing hash is:
 * keccak256(MAGIC || rlp([chain_id, address, nonce]))
 * where MAGIC = 0x05.
 *
 * @param params - Authorization parameters
 * @returns Effect yielding signed authorization with r, s, yParity
 *
 * @example
 * ```typescript
 * // Sign authorization to delegate to a smart account
 * const signed = yield* signAuthorization({
 *   contractAddress: '0x1234...smart-account-implementation',
 *   chainId: 1n
 * });
 *
 * // Include in a type 4 transaction
 * yield* signer.sendTransaction({
 *   to: someContract,
 *   authorizationList: [signed]
 * });
 * ```
 *
 * @since 0.0.1
 */
export const signAuthorization = (
	params: SignAuthorizationParams,
): Effect.Effect<
	SignedAuthorization,
	SignerError,
	ProviderService | AccountService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const account = yield* AccountService;

		const chainId =
			params.chainId ?? BigInt(yield* provider.getChainId());

		const nonce =
			params.nonce ??
			(yield* provider.getTransactionCount(
				Address.toHex(account.address as AddressType),
				"pending",
			));

		const contractAddressHex =
			typeof params.contractAddress === "string"
				? params.contractAddress
				: Address.toHex(params.contractAddress as AddressType);

		const unsigned = {
			chainId,
			address: contractAddressHex as `0x${string}`,
			nonce,
		};

		return yield* account.signAuthorization(unsigned).pipe(
			Effect.mapError(
				(e) =>
					new SignerError(
						{ action: "signAuthorization", params },
						`Failed to sign authorization: ${e.message}`,
						{ cause: e, code: e.code },
					),
			),
		);
	}).pipe(
		Effect.mapError((e) => {
			if (e instanceof SignerError) return e;
			const err = e as Error & { code?: number };
			return new SignerError(
				{ action: "signAuthorization", params },
				`Failed to sign authorization: ${err.message}`,
				{ cause: err, code: err.code },
			);
		}),
	);

export type { SignedAuthorization };
