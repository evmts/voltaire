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
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;

import { AccountService, LocalAccount } from "../Account/index.js";
import { ProviderService } from "../Provider/index.js";
import { TransportService } from "../Transport/index.js";
import { prepareAuthorization as prepareAuthorizationAction } from "./actions/prepareAuthorization.js";
import {
	type CallsStatus,
	type ChainConfig,
	type Permission,
	type PermissionRequest,
	SignerError,
	SignerService,
	type SignerShape,
	type TransactionRequest,
	type WalletCapabilities,
} from "./SignerService.js";

const INTERNAL_CODE_BUNDLE_PENDING = -40003;

/**
 * Detects transaction type from request fields.
 */
const getTransactionType = (
	tx: TransactionRequest,
	supportsEIP1559: boolean,
): 0 | 1 | 2 | 3 | 4 => {
	if (tx.type !== undefined) return tx.type;
	if (tx.authorizationList !== undefined) return 4;
	const hasBlobFields =
		tx.blobVersionedHashes !== undefined ||
		tx.maxFeePerBlobGas !== undefined ||
		tx.blobs !== undefined ||
		tx.kzgCommitments !== undefined ||
		tx.kzgProofs !== undefined;
	if (hasBlobFields) return 3;
	if (tx.maxFeePerGas !== undefined || tx.maxPriorityFeePerGas !== undefined)
		return 2;
	if (tx.accessList !== undefined && tx.gasPrice !== undefined) return 1;
	if (tx.gasPrice !== undefined) return 0;
	return supportsEIP1559 ? 2 : 0;
};

const toAuthorizationParity = (auth: {
	yParity?: number;
	v?: number;
}): number => {
	if (auth.yParity !== undefined) return auth.yParity;
	if (auth.v !== undefined) {
		if (auth.v === 27 || auth.v === 28) return auth.v - 27;
		return auth.v % 2;
	}
	return 0;
};

/**
 * Serializes a signed transaction for broadcast.
 *
 * @description
 * Combines transaction fields with signature to create RLP-encoded
 * signed transaction ready for eth_sendRawTransaction.
 *
 * Supports all 5 transaction types:
 * - Legacy (type 0)
 * - EIP-2930 (type 1)
 * - EIP-1559 (type 2)
 * - EIP-4844 (type 3)
 * - EIP-7702 (type 4)
 *
 * @param tx - The transaction with required fields populated
 * @param signature - The transaction signature (r, s, v)
 * @param txType - The detected transaction type
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
	txType: 0 | 1 | 2 | 3 | 4,
): HexType => {
	const [yParity, rBytes, sBytes] = Signature.toTuple(signature);
	const r = rBytes;
	const s = sBytes;

	const toAddress = tx.to
		? typeof tx.to === "string"
			? Address.fromHex(tx.to)
			: (tx.to as AddressType)
		: null;
	const data = tx.data ? Hex.toBytes(tx.data) : new Uint8Array(0);

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

	switch (txType) {
		case 0: {
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
			break;
		}
		case 1: {
			fullTx = {
				type: VoltaireTransaction.Type.EIP2930,
				chainId: tx.chainId,
				nonce: tx.nonce,
				gasPrice: tx.gasPrice ?? 0n,
				gasLimit: tx.gasLimit,
				to: toAddress,
				value: tx.value ?? 0n,
				data,
				accessList,
				yParity,
				r,
				s,
			};
			break;
		}
		case 2: {
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
			break;
		}
		case 3: {
			if (!toAddress) {
				throw new Error("EIP-4844 transactions require a 'to' address");
			}
			const blobVersionedHashes = (tx.blobVersionedHashes ?? []).map((hash) =>
				Hash.fromHex(hash),
			);
			fullTx = {
				type: VoltaireTransaction.Type.EIP4844,
				chainId: tx.chainId,
				nonce: tx.nonce,
				maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
				maxFeePerGas: tx.maxFeePerGas ?? 0n,
				gasLimit: tx.gasLimit,
				to: toAddress,
				value: tx.value ?? 0n,
				data,
				accessList,
				maxFeePerBlobGas: tx.maxFeePerBlobGas ?? 0n,
				blobVersionedHashes,
				yParity,
				r,
				s,
			};
			break;
		}
		case 4: {
			const authorizationList: VoltaireTransaction.AuthorizationList = (
				tx.authorizationList ?? []
			).map((auth) => ({
				chainId: auth.chainId,
				address: Address.fromHex(auth.address),
				nonce: auth.nonce,
				yParity: toAuthorizationParity(auth),
				r: Hex.toBytes(auth.r as HexType),
				s: Hex.toBytes(auth.s as HexType),
			}));
			fullTx = {
				type: VoltaireTransaction.Type.EIP7702,
				chainId: tx.chainId,
				nonce: tx.nonce,
				maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? 0n,
				maxFeePerGas: tx.maxFeePerGas ?? 0n,
				gasLimit: tx.gasLimit,
				to: toAddress,
				value: tx.value ?? 0n,
				data,
				accessList,
				authorizationList,
				yParity,
				r,
				s,
			};
			break;
		}
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
				const nonce =
					tx.nonce ??
					(yield* provider.getTransactionCount(addressHex, "pending"));
				const chainId = tx.chainId ?? BigInt(yield* provider.getChainId());
				const toHex = tx.to
					? typeof tx.to === "string"
						? tx.to
						: Address.toHex(tx.to as AddressType)
					: undefined;
				const txForEstimate = {
					to: toHex,
					from: addressHex,
					data: tx.data as `0x${string}` | undefined,
					value: tx.value,
					gas: tx.gasLimit,
				};
				const gasLimit =
					tx.gasLimit ?? (yield* provider.estimateGas(txForEstimate));

				const latestBlock = yield* provider.getBlock({ blockTag: "latest" });
				const baseFeePerGas = latestBlock.baseFeePerGas
					? BigInt(latestBlock.baseFeePerGas)
					: undefined;
				const supportsEIP1559 = baseFeePerGas !== undefined;

				const txType = getTransactionType(tx, supportsEIP1559);

				let gasParams: {
					gasPrice?: bigint;
					maxFeePerGas?: bigint;
					maxPriorityFeePerGas?: bigint;
					maxFeePerBlobGas?: bigint;
				};

				if (txType === 0 || txType === 1) {
					const gasPrice = tx.gasPrice ?? (yield* provider.getGasPrice());
					gasParams = { gasPrice };
				} else {
					const maxPriorityFeePerGas =
						tx.maxPriorityFeePerGas ??
						(yield* provider.getMaxPriorityFeePerGas());
					const baseFee = baseFeePerGas ?? (yield* provider.getGasPrice());
					const maxFeePerGas =
						tx.maxFeePerGas ?? (baseFee * 12n) / 10n + maxPriorityFeePerGas;
					gasParams = { maxFeePerGas, maxPriorityFeePerGas };

					if (txType === 3 && tx.maxFeePerBlobGas !== undefined) {
						gasParams.maxFeePerBlobGas = tx.maxFeePerBlobGas;
					}
				}

				const toAddress = tx.to
					? typeof tx.to === "string"
						? Address.fromHex(tx.to)
						: (tx.to as AddressType)
					: tx.to === null
						? null
						: undefined;

				const txForSigning = {
					type: txType,
					to: toAddress,
					value: tx.value,
					data: tx.data,
					nonce,
					chainId,
					gasLimit,
					accessList: tx.accessList,
					blobVersionedHashes: tx.blobVersionedHashes,
					blobs: tx.blobs,
					kzgCommitments: tx.kzgCommitments,
					kzgProofs: tx.kzgProofs,
					authorizationList: tx.authorizationList,
					...gasParams,
				};

				const fullTx = {
					...tx,
					type: txType,
					nonce,
					chainId,
					gasLimit,
					...gasParams,
				};

				const signature = yield* account.signTransaction(txForSigning);
				return serializeTransaction(fullTx, signature, txType);
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

			prepareAuthorization: (params) =>
				prepareAuthorizationAction(params).pipe(
					Effect.provideService(ProviderService, provider),
					Effect.provideService(AccountService, account),
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

			getAddresses: () =>
				transport.request<string[]>("eth_accounts").pipe(
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

			getPermissions: () =>
				transport
					.request<Permission[]>("wallet_getPermissions")
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "getPermissions" },
									`Failed to get permissions: ${e.message}`,
									{ cause: e, code: e.code },
								),
						),
					),

			requestPermissions: (permissions: PermissionRequest) =>
				transport
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
					),

			addChain: (chain: ChainConfig) => {
				const chainIdHex = `0x${chain.id.toString(16)}`;
				const rpcUrls = chain.rpcUrls.default.http;
				const blockExplorerUrls = chain.blockExplorers?.default.url
					? [chain.blockExplorers.default.url]
					: undefined;

				return transport
					.request<void>("wallet_addEthereumChain", [
						{
							chainId: chainIdHex,
							chainName: chain.name,
							nativeCurrency: {
								name: chain.nativeCurrency.name,
								symbol: chain.nativeCurrency.symbol,
								decimals: chain.nativeCurrency.decimals,
							},
							rpcUrls,
							blockExplorerUrls,
						},
					])
					.pipe(
						Effect.mapError((e) => {
							const isUserRejected = e.code === 4001;
							const message = isUserRejected
								? "User rejected the request"
								: `Failed to add chain: ${e.message}`;
							return new SignerError({ action: "addChain", chain }, message, {
								cause: e,
								code: e.code,
								context: isUserRejected ? { userRejected: true } : undefined,
							});
						}),
					);
			},

			switchChain: (chainId) =>
				transport
					.request<void>("wallet_switchEthereumChain", [
						{ chainId: `0x${chainId.toString(16)}` },
					])
					.pipe(
						Effect.mapError((e) => {
							const isUserRejected = e.code === 4001;
							const message = isUserRejected
								? "User rejected the request"
								: `Failed to switch chain: ${e.message}`;
							return new SignerError(
								{ action: "switchChain", chainId },
								message,
								{
									cause: e,
									code: e.code,
									context: isUserRejected ? { userRejected: true } : undefined,
								},
							);
						}),
					),

			getCapabilities: (accountAddr) =>
				transport
					.request<WalletCapabilities>("wallet_getCapabilities", [
						accountAddr
							? typeof accountAddr === "string"
								? accountAddr
								: Address.toHex(accountAddr as AddressType)
							: Address.toHex(account.address as AddressType),
					])
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "getCapabilities", account: accountAddr },
									`Failed to get capabilities: ${e.message}`,
									{ cause: e, code: e.code },
								),
						),
					),

			sendCalls: (params) =>
				Effect.gen(function* () {
					const chainId = yield* provider.getChainId();
					const formattedCalls = params.calls.map((call) => ({
						to:
							typeof call.to === "string"
								? call.to
								: Address.toHex(call.to as AddressType),
						data: call.data,
						value:
							call.value !== undefined
								? `0x${call.value.toString(16)}`
								: undefined,
					}));

					return yield* transport.request<string>("wallet_sendCalls", [
						{
							version: "1.0",
							chainId: `0x${chainId.toString(16)}`,
							from: Address.toHex(account.address as AddressType),
							calls: formattedCalls,
							capabilities: params.capabilities,
						},
					]);
				}).pipe(
					Effect.mapError((e) => {
						const err = e as Error & { code?: number };
						return new SignerError(
							{ action: "sendCalls", params },
							`Failed to send calls: ${err.message}`,
							{ cause: err, code: err.code },
						);
					}),
				),

			getCallsStatus: (bundleId) =>
				transport
					.request<CallsStatus>("wallet_getCallsStatus", [bundleId])
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "getCallsStatus", bundleId },
									`Failed to get calls status: ${e.message}`,
									{ cause: e, code: e.code },
								),
						),
					),

			waitForCallsStatus: (bundleId, options) => {
				const timeout = options?.timeout ?? 60000;
				const interval = options?.pollingInterval ?? 1000;

				const getStatus = transport
					.request<CallsStatus>("wallet_getCallsStatus", [bundleId])
					.pipe(
						Effect.mapError(
							(e) =>
								new SignerError(
									{ action: "getCallsStatus", bundleId },
									`Failed to get calls status: ${e.message}`,
									{ cause: e, code: e.code },
								),
						),
					);

				return getStatus.pipe(
					Effect.flatMap((status) =>
						status.status === "PENDING"
							? Effect.fail(
									new SignerError({ bundleId }, "Bundle still pending", {
										code: INTERNAL_CODE_BUNDLE_PENDING,
									}),
								)
							: Effect.succeed(status),
					),
					Effect.retry(
						Schedule.spaced(Duration.millis(interval)).pipe(
							Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
							Schedule.whileInput(
								(e: SignerError) => e.code === INTERNAL_CODE_BUNDLE_PENDING,
							),
						),
					),
					Effect.timeoutFail({
						duration: Duration.millis(timeout),
						onTimeout: () =>
							new SignerError(
								{ action: "waitForCallsStatus", bundleId },
								`Timeout waiting for bundle ${bundleId}`,
							),
					}),
				);
			},
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
