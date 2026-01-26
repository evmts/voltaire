/**
 * @fileoverview Factory for creating custom account layers from user-provided signers.
 *
 * @module toAccount
 * @since 0.0.1
 *
 * @description
 * Allows consumers to bring their own signing implementation (hardware wallets,
 * remote signers, HSMs) and expose it as an AccountService layer.
 *
 * @see {@link AccountService} - The service interface
 */

import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	type BrandedSignature,
	Signature,
	type TypedData,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	AccountError,
	AccountService,
	type AccountShape,
	type Authorization,
	type SignAuthorizationParams,
	type UnsignedAuthorization,
	type UnsignedTransaction,
} from "./AccountService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type SignatureType = BrandedSignature.SignatureType;
type TypedDataType = TypedData.TypedDataType;
type AddressInput = AddressType | `0x${string}`;
type SignatureInput = SignatureType | HexType | Uint8Array;

type SignerEffect<TInput, TOutput> = (
	input: TInput,
) => Effect.Effect<TOutput, AccountError>;

type SignerEffectOptional<TInput, TOutput> = (
	input: TInput,
) => Effect.Effect<TOutput, AccountError> | undefined;

export type ToAccountOptions = {
	/** The account address. */
	readonly address: AddressInput;
	/** Account type (defaults to "hardware"). */
	readonly type?: AccountShape["type"];
	/** Optional public key for local/hardware accounts. */
	readonly publicKey?: HexType;
	/** Optional extended public key for HD accounts. */
	readonly hdKey?: string;
	/** Sign a personal message (EIP-191). */
	readonly signMessage: SignerEffect<HexType, SignatureInput>;
	/** Sign an unsigned transaction. */
	readonly signTransaction: SignerEffect<UnsignedTransaction, SignatureInput>;
	/** Sign typed structured data (EIP-712). */
	readonly signTypedData: SignerEffect<TypedDataType, SignatureInput>;
	/** Optional raw hash signer (no prefix). */
	readonly sign?: SignerEffectOptional<{ hash: HexType }, SignatureInput>;
	/** Optional EIP-7702 authorization signer. */
	readonly signAuthorization?: SignerEffectOptional<
		UnsignedAuthorization | SignAuthorizationParams,
		Authorization
	>;
	/** Optional cleanup for sensitive key material. */
	readonly clearKey?: () => Effect.Effect<void>;
	/** Optional child derivation for HD accounts. */
	readonly deriveChild?: (index: number) => Effect.Effect<AccountShape, Error>;
};

const toAddressType = (address: AddressInput): AddressType =>
	typeof address === "string" ? Address.fromHex(address) : address;

const toSignatureType = (signature: SignatureInput): SignatureType => {
	if (Signature.is(signature)) return signature as SignatureType;
	if (typeof signature === "string") {
		return Signature.fromHex(signature) as SignatureType;
	}
	return Signature.fromBytes(signature) as SignatureType;
};

const mapToAccountError =
	(input: unknown, message: string) => (error: unknown) =>
		error instanceof AccountError
			? error
			: new AccountError(input, message, {
					cause: error instanceof Error ? error : undefined,
				});

const unsupported = (action: string, input: unknown) =>
	Effect.fail(
		new AccountError(input, `${action} is not supported by this account`),
	);

/**
 * Creates an account layer from user-provided signing functions.
 *
 * @description
 * Wraps custom signers (hardware wallets, remote signers, HSMs) into the
 * AccountService interface. Signature results can be provided as a branded
 * Signature, hex string, or raw bytes (65-byte ECDSA).
 *
 * @param options - Custom account configuration and signers
 * @returns Layer providing AccountService
 *
 * @since 0.0.1
 */
export const toAccount = (
	options: ToAccountOptions,
): Layer.Layer<AccountService> =>
	Layer.succeed(AccountService, {
		address: toAddressType(options.address),
		type: options.type ?? "hardware",
		publicKey: options.publicKey,
		hdKey: options.hdKey,
		signMessage: (message) =>
			options
				.signMessage(message)
				.pipe(
					Effect.map(toSignatureType),
					Effect.mapError(
						mapToAccountError(
							{ action: "signMessage", message },
							"Failed to sign message",
						),
					),
				),
		sign: (params) =>
			(options.sign
				? options.sign(params)
				: unsupported("sign", { action: "sign", params })
			).pipe(
				Effect.map(toSignatureType),
				Effect.mapError(
					mapToAccountError({ action: "sign", params }, "Failed to sign hash"),
				),
			),
		signTransaction: (tx) =>
			options
				.signTransaction(tx)
				.pipe(
					Effect.map(toSignatureType),
					Effect.mapError(
						mapToAccountError(
							{ action: "signTransaction", tx },
							"Failed to sign transaction",
						),
					),
				),
		signTypedData: (typedData) =>
			options
				.signTypedData(typedData)
				.pipe(
					Effect.map(toSignatureType),
					Effect.mapError(
						mapToAccountError(
							{ action: "signTypedData", typedData },
							"Failed to sign typed data",
						),
					),
				),
		signAuthorization: (authorization) =>
			(options.signAuthorization
				? options.signAuthorization(authorization)
				: unsupported("signAuthorization", {
						action: "signAuthorization",
						authorization,
					})
			).pipe(
				Effect.mapError(
					mapToAccountError(
						{ action: "signAuthorization", authorization },
						"Failed to sign authorization",
					),
				),
			),
		clearKey: options.clearKey ?? (() => Effect.void),
		deriveChild: options.deriveChild,
	});
