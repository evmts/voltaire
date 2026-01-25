/**
 * @fileoverview JSON-RPC account implementation for remote signing.
 *
 * @module JsonRpcAccount
 * @since 0.0.1
 *
 * @description
 * Provides an account implementation that delegates signing to a remote
 * JSON-RPC provider. Suitable for browser wallets (MetaMask, etc.) where
 * the private key is managed externally.
 *
 * Uses standard JSON-RPC methods:
 * - `personal_sign` for message signing
 * - `eth_signTransaction` for transaction signing
 * - `eth_signTypedData_v4` for EIP-712 typed data
 *
 * Requires TransportService (typically BrowserTransport) for communication.
 *
 * @see {@link AccountService} - The service interface
 * @see {@link LocalAccount} - Alternative for local signing
 * @see {@link BrowserTransport} - Typical transport for this account
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	type BrandedSignature,
	Hex,
	Signature,
	type TypedData,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportService } from "../Transport/index.js";
import {
	AccountError,
	AccountService,
	type UnsignedTransaction,
} from "./AccountService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;

/**
 * Converts a bigint to a hex string.
 *
 * @param value - The bigint value to convert
 * @returns Hex-encoded string
 *
 * @internal
 */
function bigintToHex(value: bigint): HexType {
	return Hex.fromBigInt(value);
}

/**
 * Creates a JSON-RPC account layer that delegates signing to a remote provider.
 *
 * @description
 * Signs messages and transactions via personal_sign, eth_signTransaction,
 * and eth_signTypedData_v4 JSON-RPC methods. The private key is managed
 * by the external provider (e.g., MetaMask).
 *
 * Requires TransportService to communicate with the provider.
 *
 * @param address - The account address controlled by the remote provider
 * @returns Layer providing AccountService
 *
 * @throws {AccountError} When the provider rejects the request
 * @throws {AccountError} When the user denies the signing request
 *
 * @since 0.0.1
 *
 * @example Basic usage with BrowserTransport
 * ```typescript
 * import { Effect } from 'effect'
 * import { AccountService, JsonRpcAccount, BrowserTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* AccountService
 *   const signature = yield* account.signMessage(messageHex)
 *   return signature
 * }).pipe(
 *   Effect.provide(JsonRpcAccount(userAddress)),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 *
 * @example With Signer for browser dApps
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   SignerService,
 *   Signer,
 *   JsonRpcAccount,
 *   Provider,
 *   BrowserTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   // Will trigger MetaMask popup for signing
 *   const txHash = yield* signer.sendTransaction({
 *     to: recipient,
 *     value: 1000000000000000000n
 *   })
 *   return txHash
 * }).pipe(
 *   Effect.provide(Signer.Live),
 *   Effect.provide(JsonRpcAccount(userAddress)),
 *   Effect.provide(Provider),
 *   Effect.provide(BrowserTransport)
 * )
 * ```
 *
 * @see {@link AccountService} - The service interface
 * @see {@link LocalAccount} - For local private key signing
 * @see {@link BrowserTransport} - Typical transport for browser wallets
 */
export const JsonRpcAccount = (address: AddressType) =>
	Layer.effect(
		AccountService,
		Effect.gen(function* () {
			const transport = yield* TransportService;

			return AccountService.of({
				address,
				type: "json-rpc" as const,

				signMessage: (message: HexType) =>
					transport
						.request<HexType>("personal_sign", [
							message,
							Address.toHex(address),
						])
						.pipe(
							Effect.map(
								(sigHex) => Signature.fromHex(sigHex) as SignatureType,
							),
							Effect.mapError(
								(e) =>
									new AccountError(
										{ action: "signMessage", message },
										"Failed to sign message via JSON-RPC",
										{ cause: e instanceof Error ? e : undefined },
									),
							),
						),

				signTransaction: (tx: UnsignedTransaction) =>
					Effect.gen(function* () {
						const txRequest = {
							from: Address.toHex(address),
							to: tx.to ? Address.toHex(tx.to) : undefined,
							value: tx.value !== undefined ? bigintToHex(tx.value) : undefined,
							data: tx.data,
							nonce: tx.nonce !== undefined ? bigintToHex(tx.nonce) : undefined,
							gas:
								tx.gasLimit !== undefined
									? bigintToHex(tx.gasLimit)
									: undefined,
							gasPrice:
								tx.gasPrice !== undefined
									? bigintToHex(tx.gasPrice)
									: undefined,
							maxFeePerGas:
								tx.maxFeePerGas !== undefined
									? bigintToHex(tx.maxFeePerGas)
									: undefined,
							maxPriorityFeePerGas:
								tx.maxPriorityFeePerGas !== undefined
									? bigintToHex(tx.maxPriorityFeePerGas)
									: undefined,
							chainId:
								tx.chainId !== undefined ? bigintToHex(tx.chainId) : undefined,
						};
						const sigHex = yield* transport.request<HexType>(
							"eth_signTransaction",
							[txRequest],
						);
						return Signature.fromHex(sigHex) as SignatureType;
					}).pipe(
						Effect.mapError(
							(e) =>
								new AccountError(
									{ action: "signTransaction", tx },
									"Failed to sign transaction via JSON-RPC",
									{ cause: e instanceof Error ? e : undefined },
								),
						),
					),

				signTypedData: (typedData: TypedDataType) =>
					transport
						.request<HexType>("eth_signTypedData_v4", [
							Address.toHex(address),
							JSON.stringify(typedData, (_, v) =>
								typeof v === "bigint" ? v.toString() : v,
							),
						])
						.pipe(
							Effect.map(
								(sigHex) => Signature.fromHex(sigHex) as SignatureType,
							),
							Effect.mapError(
								(e) =>
									new AccountError(
										{ action: "signTypedData", typedData },
										"Failed to sign typed data via JSON-RPC",
										{ cause: e instanceof Error ? e : undefined },
									),
							),
						),
			});
		}),
	);
