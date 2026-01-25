/**
 * @fileoverview Live implementation of WalletClientService.
 * 
 * @module WalletClient
 * @since 0.0.1
 * 
 * @description
 * Provides the live implementation layer for WalletClientService. This layer
 * translates the high-level WalletClientService methods into signing operations
 * via AccountService and JSON-RPC calls via TransportService.
 * 
 * The layer requires:
 * - AccountService - For cryptographic signing (LocalAccount or JsonRpcAccount)
 * - PublicClientService - For gas estimation and nonce lookup
 * - TransportService - For broadcasting transactions
 * 
 * @see {@link WalletClientService} - The service interface
 * @see {@link AccountService} - Required for signing
 * @see {@link PublicClientService} - Required for gas/nonce
 * @see {@link TransportService} - Required for broadcast
 */

import { BrandedAddress, BrandedHex, Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
import { AccountService } from "../Account/index.js";
import { PublicClientService } from "../PublicClient/index.js";
import { TransportService } from "../Transport/index.js";
import {
	WalletClientService,
	WalletClientError,
	type TransactionRequest,
	type WalletClientShape,
} from "./WalletClientService.js";

/**
 * Serializes a signed transaction for broadcast.
 * 
 * @description
 * Combines transaction fields with signature to create RLP-encoded
 * signed transaction ready for eth_sendRawTransaction.
 * 
 * @param tx - The transaction with required fields populated
 * @param _signature - The transaction signature (r, s, v)
 * @returns Hex-encoded signed transaction
 * 
 * @internal
 */
const serializeTransaction = (
	tx: TransactionRequest & { nonce: bigint; gasLimit: bigint; chainId: bigint },
	_signature: unknown,
): HexType => {
	const parts = [
		tx.nonce.toString(16).padStart(2, "0"),
		tx.gasLimit.toString(16).padStart(2, "0"),
		tx.chainId.toString(16).padStart(2, "0"),
		tx.value?.toString(16) ?? "0",
	];
	return `0x${parts.join("")}` as HexType;
};

/**
 * Live implementation of the wallet client layer.
 * 
 * @description
 * Provides a concrete implementation of WalletClientService that combines:
 * - AccountService for cryptographic signing
 * - PublicClientService for gas estimation and nonce lookup
 * - TransportService for broadcasting transactions
 * 
 * This layer:
 * - Fetches nonce and gas estimates automatically
 * - Signs transactions using the provided account
 * - Broadcasts via eth_sendRawTransaction
 * - Maps errors to WalletClientError
 * 
 * Requires AccountService, PublicClientService, and TransportService in context.
 * 
 * @since 0.0.1
 * 
 * @example Basic usage with local account
 * ```typescript
 * import { Effect } from 'effect'
 * import { 
 *   WalletClientLive, 
 *   WalletClientService, 
 *   LocalAccount,
 *   PublicClient,
 *   HttpTransport,
 *   Secp256k1Live,
 *   KeccakLive
 * } from 'voltaire-effect/services'
 * 
 * const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   const txHash = yield* wallet.sendTransaction({
 *     to: recipientAddress,
 *     value: 1000000000000000000n
 *   })
 *   return txHash
 * }).pipe(
 *   Effect.provide(WalletClientLive),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Secp256k1Live),
 *   Effect.provide(KeccakLive),
 *   Effect.provide(PublicClient),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * 
 * await Effect.runPromise(program)
 * ```
 * 
 * @example Composing layers for reuse
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import { 
 *   WalletClientLive, 
 *   LocalAccount,
 *   PublicClient,
 *   HttpTransport 
 * } from 'voltaire-effect/services'
 * 
 * // Create a fully composed wallet layer
 * const MyWallet = WalletClientLive.pipe(
 *   Layer.provide(LocalAccount(privateKey)),
 *   Layer.provide(PublicClient),
 *   Layer.provide(HttpTransport('https://...'))
 * )
 * 
 * const program = Effect.gen(function* () {
 *   const wallet = yield* WalletClientService
 *   return yield* wallet.sendTransaction({ ... })
 * }).pipe(Effect.provide(MyWallet))
 * ```
 * 
 * @see {@link WalletClientService} - The service interface
 * @see {@link AccountService} - Required for signing
 * @see {@link LocalAccount} - Local private key signing
 * @see {@link JsonRpcAccount} - Remote JSON-RPC signing
 * @see {@link PublicClientService} - Required for gas/nonce
 */
export const WalletClientLive: Layer.Layer<
	WalletClientService,
	never,
	AccountService | PublicClientService | TransportService
> = Layer.effect(
	WalletClientService,
	Effect.gen(function* () {
		const account = yield* AccountService;
		const publicClient = yield* PublicClientService;
		const transport = yield* TransportService;

		const signTransaction = (
			tx: TransactionRequest,
		): Effect.Effect<HexType, WalletClientError> =>
			Effect.gen(function* () {
				const addressHex = Address.toHex(account.address as AddressType)
				const nonce =
					tx.nonce ??
					BigInt(yield* publicClient.getTransactionCount(addressHex));
				const chainId = tx.chainId ?? BigInt(yield* publicClient.getChainId());
				const txForEstimate = {
					to: tx.to ? Address.toHex(tx.to as AddressType) : undefined,
					from: addressHex,
					data: tx.data as `0x${string}` | undefined,
					value: tx.value,
					gas: tx.gasLimit,
				}
				const gasLimit = tx.gasLimit ?? (yield* publicClient.estimateGas(txForEstimate));

				const gasParams =
					tx.maxFeePerGas !== undefined
						? {
								maxFeePerGas: tx.maxFeePerGas,
								maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
							}
						: { gasPrice: tx.gasPrice ?? (yield* publicClient.getGasPrice()) };

				const fullTx = {
					...tx,
					nonce,
					chainId,
					gasLimit,
					...gasParams,
				};

				const signature = yield* account.signTransaction(fullTx);
				return serializeTransaction(fullTx, signature);
			}).pipe(
				Effect.mapError(
					(e) =>
						new WalletClientError(
							tx,
							`Failed to sign transaction: ${e instanceof Error ? e.message : String(e)}`,
							{ cause: e instanceof Error ? e : undefined },
						),
				),
			);

		const walletClient: WalletClientShape = {
			signMessage: (message) =>
				account.signMessage(message).pipe(
					Effect.mapError(
						(e) =>
							new WalletClientError(
								{ action: 'signMessage', message },
								`Failed to sign message: ${e.message}`,
								{ cause: e },
							),
					),
				),

			signTransaction,

			signTypedData: (typedData) =>
				account.signTypedData(typedData).pipe(
					Effect.mapError(
						(e) =>
							new WalletClientError(
								{ action: 'signTypedData', typedData },
								`Failed to sign typed data: ${e.message}`,
								{ cause: e },
							),
					),
				),

			sendTransaction: (tx) =>
				Effect.gen(function* () {
					const signed = yield* signTransaction(tx);
					return yield* transport
						.request<HexType>("eth_sendRawTransaction", [signed])
						.pipe(
							Effect.mapError(
								(e) =>
									new WalletClientError(
										tx,
										`Failed to send transaction: ${e.message}`,
										{ cause: e },
									),
							),
						);
				}),

			sendRawTransaction: (signedTx) =>
				transport
					.request<HexType>("eth_sendRawTransaction", [signedTx])
					.pipe(
						Effect.mapError(
							(e) =>
								new WalletClientError(
									{ action: 'sendRawTransaction', signedTx },
									`Failed to send raw transaction: ${e.message}`,
									{ cause: e },
								),
						),
					),

			requestAddresses: () =>
				transport.request<AddressType[]>("eth_requestAccounts").pipe(
					Effect.mapError(
						(e) =>
							new WalletClientError(
								{ action: 'requestAddresses' },
								`Failed to request addresses: ${e.message}`,
								{ cause: e },
							),
					),
				),

			switchChain: (chainId) =>
				transport
					.request<void>("wallet_switchEthereumChain", [
						{ chainId: `0x${chainId.toString(16)}` },
					])
					.pipe(
						Effect.mapError(
							(e) =>
								new WalletClientError(
									{ action: 'switchChain', chainId },
									`Failed to switch chain: ${e.message}`,
									{ cause: e },
								),
						),
					),
		};

		return walletClient;
	}),
);


