/**
 * @fileoverview Live implementation of SignerService with composition helpers.
 *
 * @module Signer
 * @since 0.0.1
 *
 * @description
 * Provides the live implementation layer for SignerService along with
 * convenient layer composition helpers like `fromProvider` and `fromPrivateKey`.
 *
 * The layer requires:
 * - AccountService - For cryptographic signing (LocalAccount or JsonRpcAccount)
 * - ProviderService - For gas estimation and nonce lookup
 * - TransportService - For broadcasting transactions
 *
 * @see {@link SignerService} - The service interface
 * @see {@link AccountService} - Required for signing
 * @see {@link ProviderService} - Required for gas/nonce
 * @see {@link TransportService} - Required for broadcast
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	type BrandedSignature,
	Hex,
	Signature,
} from "@tevm/voltaire";
import * as Hash from "@tevm/voltaire/Hash";
import type { HashType } from "@tevm/voltaire/Hash";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

import { AccountService, LocalAccount } from "../Account/index.js";
import { ProviderService } from "../Provider/index.js";
import { TransportService } from "../Transport/index.js";
import {
	type TransactionRequest,
	SignerError,
	SignerService,
	type SignerShape,
} from "./SignerService.js";

/**
 * Serializes a signed transaction for broadcast.
 *
 * @description
 * Combines transaction fields with signature to create RLP-encoded
 * signed transaction ready for eth_sendRawTransaction.
 *
 * @param tx - The transaction with required fields populated
 * @param signature - The transaction signature (r, s, v)
 * @returns Hex-encoded signed transaction
 *
 * @internal
 */
const serializeTransaction = (
	tx: TransactionRequest & {
		nonce: bigint;
		gasLimit: bigint;
		chainId: bigint;
		maxFeePerGas?: bigint;
		maxPriorityFeePerGas?: bigint;
		gasPrice?: bigint;
	},
	signature: SignatureType,
): HexType => {
	const [yParity, rBytes, sBytes] = Signature.toTuple(signature);
	const r = rBytes;
	const s = sBytes;

	const toAddress = tx.to ? (tx.to as AddressType) : null;
	const data = tx.data ? Hex.toBytes(tx.data) : new Uint8Array(0);

	const isEIP1559 =
		tx.maxFeePerGas !== undefined || tx.maxPriorityFeePerGas !== undefined;

	// Convert accessList: address to AddressType, storageKeys to HashType
	const accessList: VoltaireTransaction.AccessList = (tx.accessList ?? []).map(
		(item): VoltaireTransaction.AccessListItem => ({
			address:
				typeof item.address === "string"
					? Address.fromHex(item.address)
					: (item.address as AddressType),
			storageKeys: item.storageKeys.map((key) => Hash.fromHex(key)),
		}),
	);

	let fullTx: VoltaireTransaction.Any;

	if (isEIP1559) {
		fullTx = {
			type: VoltaireTransaction.Type.EIP1559,
			chainId: tx.chainId,
			nonce: tx.nonce,
			maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
			maxFeePerGas: tx.maxFeePerGas ?? 0n,
			gasLimit: tx.gasLimit,
			to: toAddress,
			value: tx.value ?? 0n,
			data,
			accessList,
			yParity,
			r,
			s,
		};
	} else {
		const vValue = tx.chainId * 2n + 35n + BigInt(yParity);

		fullTx = {
			type: VoltaireTransaction.Type.Legacy,
			nonce: tx.nonce,
			gasPrice: tx.gasPrice ?? 0n,
			gasLimit: tx.gasLimit,
			to: toAddress,
			value: tx.value ?? 0n,
			data,
			v: vValue,
			r,
			s,
		};
	}

	const serialized = VoltaireTransaction.serialize(fullTx);
	return Hex.fromBytes(serialized) as HexType;
};

/**
 * Live implementation of the signer layer.
 *
 * @description
 * Provides a concrete implementation of SignerService that combines:
 * - AccountService for cryptographic signing
 * - ProviderService for gas estimation and nonce lookup
 * - TransportService for broadcasting transactions
 *
 * This layer:
 * - Fetches nonce and gas estimates automatically
 * - Signs transactions using the provided account
 * - Broadcasts via eth_sendRawTransaction
 * - Maps errors to SignerError
 *
 * Requires AccountService, ProviderService, and TransportService in context.
 *
 * @since 0.0.1
 */
const SignerLive: Layer.Layer<
	SignerService,
	never,
	AccountService | ProviderService | TransportService
> = Layer.effect(
	SignerService,
	Effect.gen(function* () {
		const account = yield* AccountService;
		const provider = yield* ProviderService;
		const transport = yield* TransportService;

		const signTransaction = (
			tx: TransactionRequest,
		): Effect.Effect<HexType, SignerError> =>
			Effect.gen(function* () {
				const addressHex = Address.toHex(account.address as AddressType);
				// Use 'pending' to include pending txs in nonce calculation
				const nonce =
					tx.nonce ??
					(yield* provider.getTransactionCount(addressHex, "pending"));
				const chainId = tx.chainId ?? BigInt(yield* provider.getChainId());
				const txForEstimate = {
					to: tx.to ? Address.toHex(tx.to as AddressType) : undefined,
					from: addressHex,
					data: tx.data as `0x${string}` | undefined,
					value: tx.value,
					gas: tx.gasLimit,
				};
				const gasLimit =
					tx.gasLimit ?? (yield* provider.estimateGas(txForEstimate));

				// Fetch latest block once for EIP-1559 detection and base fee
				const latestBlock = yield* provider.getBlock({ blockTag: "latest" });
				const baseFeePerGas = latestBlock.baseFeePerGas
					? BigInt(latestBlock.baseFeePerGas)
					: undefined;
				const supportsEIP1559 = baseFeePerGas !== undefined;

				const useEIP1559 =
					tx.maxFeePerGas !== undefined ||
					tx.maxPriorityFeePerGas !== undefined ||
					(tx.gasPrice === undefined && supportsEIP1559);

				let gasParams: {
					gasPrice?: bigint;
					maxFeePerGas?: bigint;
					maxPriorityFeePerGas?: bigint;
				};

				if (useEIP1559) {
					const maxPriorityFeePerGas =
						tx.maxPriorityFeePerGas ??
						(yield* provider.getMaxPriorityFeePerGas());
					// Use baseFeePerGas from block, fallback to getGasPrice if somehow missing
					const baseFee = baseFeePerGas ?? (yield* provider.getGasPrice());
					// 2x multiplier on base fee for fee volatility buffer (matches viem/ethers defaults)
					const multiplier = 2n;
					const maxFeePerGas =
						tx.maxFeePerGas ?? baseFee * multiplier + maxPriorityFeePerGas;
					gasParams = { maxFeePerGas, maxPriorityFeePerGas };
				} else {
					const gasPrice = tx.gasPrice ?? (yield* provider.getGasPrice());
					gasParams = { gasPrice };
				}

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
				Effect.mapError((e) => {
					const code =
						e instanceof Error && "code" in e && typeof e.code === "number"
							? e.code
							: undefined;
					return new SignerError(
						tx,
						`Failed to sign transaction: ${e instanceof Error ? e.message : String(e)}`,
						{ cause: e instanceof Error ? e : undefined, code },
					);
				}),
			);

		const signer: SignerShape = {
			signMessage: (message) =>
				account
					.signMessage(message)
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "signMessage", message },
									`Failed to sign message: ${e.message}`,
									{ cause: e },
								),
						),
					),

			signTransaction,

			signTypedData: (typedData) =>
				account
					.signTypedData(typedData)
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "signTypedData", typedData },
									`Failed to sign typed data: ${e.message}`,
									{ cause: e },
								),
						),
					),

			sendTransaction: (tx) =>
				Effect.gen(function* () {
					const signed = yield* signTransaction(tx);
					return yield* transport
						.request<string>("eth_sendRawTransaction", [signed])
						.pipe(
							Effect.map((hash) => Hash.fromHex(hash)),
							Effect.mapError(
								(e) =>
									new SignerError(
										tx,
										`Failed to send transaction: ${e.message}`,
										{ cause: e, code: e.code },
									),
							),
						);
				}),

			sendRawTransaction: (signedTx) =>
				transport.request<string>("eth_sendRawTransaction", [signedTx]).pipe(
					Effect.map((hash) => Hash.fromHex(hash)),
					Effect.mapError(
						(e) =>
							new SignerError(
								{ action: "sendRawTransaction", signedTx },
								`Failed to send raw transaction: ${e.message}`,
								{ cause: e, code: e.code },
							),
					),
				),

			requestAddresses: () =>
				transport.request<string[]>("eth_requestAccounts").pipe(
					Effect.map((addresses) =>
						addresses.map((addr) => Address(addr) as AddressType),
					),
					Effect.mapError(
						(e) =>
							new SignerError(
								{ action: "requestAddresses" },
								`Failed to request addresses: ${e.message}`,
								{ cause: e, code: e.code },
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
								new SignerError(
									{ action: "switchChain", chainId },
									`Failed to switch chain: ${e.message}`,
									{ cause: e, code: e.code },
								),
						),
					),
		};

		return signer;
	}),
);

/**
 * Signer namespace with layer constructors and composition helpers.
 *
 * @description
 * Provides the live implementation and convenient factory functions for
 * creating Signer layers with different configurations.
 *
 * @since 0.0.1
 *
 * @example Basic usage with separate layers
 * ```typescript
 * import { Effect } from 'effect'
 * import { Signer, SignerService, LocalAccount, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   return yield* signer.sendTransaction({ to: recipient, value: 1n })
 * }).pipe(
 *   Effect.provide(Signer.Live),
 *   Effect.provide(LocalAccount(privateKey)),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Using fromProvider for composed layers
 * ```typescript
 * import { Effect } from 'effect'
 * import { Signer, SignerService, LocalAccount, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const transport = HttpTransport('https://...')
 * const signerLayer = Signer.fromProvider(Provider, LocalAccount(privateKey))
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   return yield* signer.sendTransaction({ to: recipient, value: 1n })
 * }).pipe(
 *   Effect.provide(signerLayer),
 *   Effect.provide(transport)
 * )
 * ```
 *
 * @example Using fromPrivateKey for quick setup
 * ```typescript
 * import { Effect } from 'effect'
 * import { Signer, SignerService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const transport = HttpTransport('https://...')
 * const signerLayer = Signer.fromPrivateKey(privateKey, Provider)
 *
 * const program = Effect.gen(function* () {
 *   const signer = yield* SignerService
 *   return yield* signer.sendTransaction({ to: recipient, value: 1n })
 * }).pipe(
 *   Effect.provide(signerLayer),
 *   Effect.provide(transport)
 * )
 * ```
 */
export const Signer = {
	/**
	 * Live implementation layer requiring AccountService, ProviderService, and TransportService.
	 */
	Live: SignerLive,

	/**
	 * Creates a Signer layer by composing a provider layer and account layer.
	 *
	 * @description
	 * Combines a ProviderService layer with an AccountService layer to create
	 * a fully configured SignerService layer. The resulting layer still requires
	 * TransportService to be provided.
	 *
	 * @param providerLayer - Layer providing ProviderService (requires TransportService)
	 * @param accountLayer - Layer providing AccountService
	 * @returns Layer providing SignerService (requires TransportService)
	 *
	 * @since 0.0.1
	 */
	fromProvider: <E1, R1, E2, R2>(
		providerLayer: Layer.Layer<ProviderService, E1, R1>,
		accountLayer: Layer.Layer<AccountService, E2, R2>,
	): Layer.Layer<SignerService, E1 | E2, R1 | R2 | TransportService> =>
		SignerLive.pipe(Layer.provide(providerLayer), Layer.provide(accountLayer)),

	/**
	 * Creates a Signer layer from a private key and provider layer.
	 *
	 * @description
	 * Convenience function that creates a LocalAccount from the private key
	 * and composes it with the given provider layer. The resulting layer
	 * still requires TransportService and the crypto services (Secp256k1Service, KeccakService).
	 *
	 * @param privateKey - The private key as a hex string (with 0x prefix)
	 * @param providerLayer - Layer providing ProviderService (requires TransportService)
	 * @returns Layer providing SignerService (requires TransportService and crypto services)
	 *
	 * @since 0.0.1
	 */
	fromPrivateKey: <E, R>(
		privateKey: HexType,
		providerLayer: Layer.Layer<ProviderService, E, R>,
	) => Signer.fromProvider(providerLayer, LocalAccount(privateKey)),
} as const;
