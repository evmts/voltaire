/**
 * @fileoverview Type-safe contract write action for sending transactions to contracts.
 *
 * @module Signer/actions/writeContract
 * @since 0.0.1
 */

import {
	Address,
	BrandedAbi,
	type BrandedAddress,
	type BrandedHex,
} from "@tevm/voltaire";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import {
	type AddressInput,
	type SignerError,
	SignerService,
} from "../SignerService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;

/**
 * ABI type for contract interactions.
 */
export type Abi = readonly unknown[];

/**
 * Parameters for writing to a contract.
 */
export interface WriteContractParams<
	TAbi extends Abi,
	TFunctionName extends string,
> {
	/** Contract address to call */
	readonly address: AddressInput;
	/** Contract ABI */
	readonly abi: TAbi;
	/** Function name to call */
	readonly functionName: TFunctionName;
	/** Function arguments */
	readonly args?: readonly unknown[];
	/** Value in wei to send */
	readonly value?: bigint;
	/** Gas limit */
	readonly gas?: bigint;
	/** Gas price for legacy transactions */
	readonly gasPrice?: bigint;
	/** Max fee per gas for EIP-1559 transactions */
	readonly maxFeePerGas?: bigint;
	/** Max priority fee for EIP-1559 transactions */
	readonly maxPriorityFeePerGas?: bigint;
	/** Transaction nonce */
	readonly nonce?: bigint;
}

/**
 * Writes to a contract by encoding function call and sending a transaction.
 *
 * @description
 * Encodes the function call using the ABI and sends a transaction to the contract.
 * Returns the transaction hash on success.
 *
 * @param params - Write contract parameters
 * @returns Effect yielding transaction hash
 *
 * @example
 * ```typescript
 * const hash = yield* writeContract({
 *   address: tokenAddress,
 *   abi: erc20Abi,
 *   functionName: 'transfer',
 *   args: [recipient, parseUnits('100', 18)],
 *   maxFeePerGas: parseGwei('20')
 * });
 * ```
 *
 * @since 0.0.1
 */
export const writeContract = <TAbi extends Abi, TFunctionName extends string>(
	params: WriteContractParams<TAbi, TFunctionName>,
): Effect.Effect<HashType, SignerError, SignerService> =>
	Effect.gen(function* () {
		const signer = yield* SignerService;

		const data = BrandedAbi.encodeFunction(
			params.abi as unknown as BrandedAbi.Abi,
			params.functionName,
			params.args ?? [],
		);

		const to =
			typeof params.address === "string"
				? Address.fromHex(params.address)
				: (params.address as AddressType);

		return yield* signer.sendTransaction({
			to,
			data: data as HexType,
			value: params.value,
			gasLimit: params.gas,
			gasPrice: params.gasPrice,
			maxFeePerGas: params.maxFeePerGas,
			maxPriorityFeePerGas: params.maxPriorityFeePerGas,
			nonce: params.nonce,
		});
	});
