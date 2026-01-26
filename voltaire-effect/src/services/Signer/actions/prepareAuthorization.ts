/**
 * @fileoverview Prepare authorization action for EIP-7702.
 *
 * @module Signer/actions/prepareAuthorization
 * @since 0.0.1
 */

import { Address, type BrandedAddress } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { SignerError } from "../SignerService.js";
import { ProviderService } from "../../Provider/index.js";
import { AccountService } from "../../Account/index.js";

type AddressType = BrandedAddress.AddressType;

/**
 * Parameters for preparing an EIP-7702 authorization.
 *
 * @since 0.0.1
 */
export interface PrepareAuthorizationParams {
	/** Address of the contract to delegate to */
	readonly contractAddress: `0x${string}` | AddressType;
	/** Chain ID where the authorization is valid */
	readonly chainId?: bigint;
}

/**
 * Unsigned EIP-7702 authorization tuple.
 *
 * @since 0.0.1
 */
export interface Authorization {
	/** Chain ID where the authorization is valid */
	readonly chainId: bigint;
	/** Address of the contract to delegate to (hex string) */
	readonly address: `0x${string}`;
	/** Nonce of the authorizing account */
	readonly nonce: bigint;
}

/**
 * Prepares an EIP-7702 authorization for signing.
 *
 * @description
 * Prepares an unsigned authorization tuple that allows an EOA to delegate
 * code execution to a contract address. This fetches the current nonce
 * and chain ID if not provided.
 *
 * The prepared authorization can then be signed with signAuthorization.
 *
 * @param params - Authorization parameters
 * @returns Effect yielding the prepared unsigned authorization
 *
 * @example
 * ```typescript
 * // Prepare authorization to delegate to a smart account contract
 * const authorization = yield* prepareAuthorization({
 *   contractAddress: '0x1234...smart-account-implementation',
 * });
 *
 * // Sign it
 * const signed = yield* signAuthorization(authorization);
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
export const prepareAuthorization = (
	params: PrepareAuthorizationParams,
): Effect.Effect<
	Authorization,
	SignerError,
	ProviderService | AccountService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const account = yield* AccountService;

		const chainId =
			params.chainId ?? BigInt(yield* provider.getChainId());

		const addressHex = Address.toHex(account.address as AddressType);
		const nonce = yield* provider.getTransactionCount(addressHex, "pending");

		const contractAddressHex =
			typeof params.contractAddress === "string"
				? params.contractAddress
				: Address.toHex(params.contractAddress as AddressType);

		return {
			chainId,
			address: contractAddressHex as `0x${string}`,
			nonce,
		};
	}).pipe(
		Effect.mapError((e) => {
			if (e instanceof SignerError) return e;
			const err = e as Error & { code?: number };
			return new SignerError(
				{ action: "prepareAuthorization", params },
				`Failed to prepare authorization: ${err.message}`,
				{ cause: err, code: err.code },
			);
		}),
	);
