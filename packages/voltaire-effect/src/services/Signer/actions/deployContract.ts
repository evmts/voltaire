/**
 * @fileoverview Contract deployment action for deploying new contracts.
 *
 * @module Signer/actions/deployContract
 * @since 0.0.1
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import { Constructor } from "@tevm/voltaire/Abi";
import type { HashType } from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import {
	ProviderResponseError,
	ProviderService,
	type WaitForTransactionReceiptError,
} from "../../Provider/index.js";
import { waitForTransactionReceipt } from "../../Provider/functions/index.js";
import { type SignerError, SignerService } from "../SignerService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;

/**
 * ABI type for contract deployment.
 */
export type Abi = readonly unknown[];

/**
 * ABI item type for type guards.
 */
type AbiItem = { type: string; inputs?: readonly unknown[] };

/**
 * Parameters for deploying a contract.
 */
export interface DeployContractParams<TAbi extends Abi> {
	/** Contract ABI */
	readonly abi: TAbi;
	/** Contract bytecode (hex string with 0x prefix) */
	readonly bytecode: HexType | `0x${string}`;
	/** Constructor arguments */
	readonly args?: readonly unknown[];
	/** Value in wei to send (for payable constructors) */
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
 * Result of a contract deployment.
 */
export interface DeployContractResult {
	/** Transaction hash of the deployment */
	readonly hash: HashType;
	/** Effect that resolves to the deployed contract address after confirmation */
	readonly address: Effect.Effect<
		AddressType,
		WaitForTransactionReceiptError,
		ProviderService
	>;
}

/**
 * Deploys a contract by sending a transaction with bytecode and constructor args.
 *
 * @description
 * Encodes constructor arguments (if any) and appends them to the bytecode.
 * Sends a deployment transaction (no `to` address) and returns:
 * - The transaction hash immediately
 * - A lazy Effect to get the deployed contract address after confirmation
 *
 * @param params - Deploy contract parameters
 * @returns Effect yielding DeployContractResult with hash and lazy address getter
 *
 * @example
 * ```typescript
 * const { hash, address } = yield* deployContract({
 *   abi: myContractAbi,
 *   bytecode: '0x608060405234801...',
 *   args: [initialOwner, initialSupply]
 * });
 *
 * // Wait for deployment and get address
 * const contractAddress = yield* address;
 * console.log('Deployed at:', Address.toHex(contractAddress));
 * ```
 *
 * @since 0.0.1
 */
export const deployContract = <TAbi extends Abi>(
	params: DeployContractParams<TAbi>,
): Effect.Effect<
	DeployContractResult,
	SignerError,
	SignerService | ProviderService
> =>
	Effect.gen(function* () {
		const signer = yield* SignerService;

		const constructorItem = (params.abi as readonly AbiItem[]).find(
			(item): item is Constructor.ConstructorType =>
				item.type === "constructor",
		);

		let data: HexType;
		const bytecodeHex = params.bytecode as HexType;

		if (params.args && params.args.length > 0 && constructorItem) {
			const encodedArgsBytes = Constructor.encodeParams(
				constructorItem,
				params.args as unknown[],
			);
			const encodedArgsHex = Hex.fromBytes(encodedArgsBytes);
			const bytecodeBytes = Hex.toBytes(bytecodeHex);
			const encodedBytes = Hex.toBytes(encodedArgsHex);
			const combined = new Uint8Array(
				bytecodeBytes.length + encodedBytes.length,
			);
			combined.set(bytecodeBytes, 0);
			combined.set(encodedBytes, bytecodeBytes.length);
			data = Hex.fromBytes(combined) as HexType;
		} else {
			data = bytecodeHex;
		}

		const hash = yield* signer.sendTransaction({
			to: undefined,
			data,
			value: params.value,
			gasLimit: params.gas,
			gasPrice: params.gasPrice,
			maxFeePerGas: params.maxFeePerGas,
			maxPriorityFeePerGas: params.maxPriorityFeePerGas,
			nonce: params.nonce,
		});

		const address: Effect.Effect<
			AddressType,
			WaitForTransactionReceiptError,
			ProviderService
		> = Effect.gen(function* () {
			const hashHex = Hex(hash) as `0x${string}`;
			const receipt = yield* waitForTransactionReceipt(hashHex);
			if (!receipt.contractAddress) {
				return yield* Effect.fail(
					new ProviderResponseError({ hash }, "No contract address in receipt"),
				);
			}
			return Address.fromHex(receipt.contractAddress);
		});

		return { hash, address };
	});
