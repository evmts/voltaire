/**
 * @fileoverview Prepare authorization action for EIP-7702.
 *
 * @module Signer/actions/prepareAuthorization
 * @since 0.0.1
 */

import { Address, type BrandedAddress } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	AccountService,
	type UnsignedAuthorization,
} from "../../Account/index.js";
import { ProviderService } from "../../Provider/index.js";
import { getChainId, getTransactionCount } from "../../Provider/functions/index.js";
import {
	type PrepareAuthorizationParams,
	SignerError,
} from "../SignerService.js";

type AddressType = BrandedAddress.AddressType;

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
	UnsignedAuthorization,
	SignerError,
	ProviderService | AccountService
> =>
	Effect.gen(function* () {
		const account = yield* AccountService;

		const chainId = params.chainId ?? (yield* getChainId());

		const addressHex = Address.toHex(account.address as AddressType);
		const nonce =
			params.nonce ??
			(yield* getTransactionCount(addressHex, "pending"));

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
