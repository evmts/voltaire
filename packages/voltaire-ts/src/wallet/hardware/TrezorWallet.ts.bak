import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { SignatureType } from "../../primitives/Signature/SignatureType.js";
import type { Any as TransactionType } from "../../primitives/Transaction/types.js";
import type {
	DeviceInfo,
	EIP712TypedData,
	HardwareWallet,
} from "./HardwareWallet.js";

/**
 * Trezor hardware wallet implementation
 *
 * Provides integration with Trezor devices via Trezor Connect.
 * Works with both Trezor One and Trezor Model T.
 *
 * @example
 * ```typescript
 * import { TrezorWallet } from '@tevm/voltaire/native'
 *
 * const trezor = new TrezorWallet({
 *   manifest: {
 *     email: 'developer@example.com',
 *     appUrl: 'https://example.com'
 *   }
 * });
 *
 * await trezor.connect();
 *
 * // Get first address
 * const address = await trezor.getAddress("m/44'/60'/0'/0/0");
 *
 * // Sign transaction
 * const signature = await trezor.signTransaction("m/44'/60'/0'/0/0", tx);
 * ```
 */
export class TrezorWallet implements HardwareWallet {
	private _isConnected = false;
	private manifest?: {
		email: string;
		appUrl: string;
	};
	private TrezorConnect?: unknown;

	constructor(options?: { manifest?: { email: string; appUrl: string } }) {
		this.manifest = options?.manifest;
	}

	async connect(): Promise<void> {
		const TrezorConnectModule = await import("@trezor/connect-web");
		const TrezorConnect = (
			TrezorConnectModule as unknown as {
				default: { init: (config: unknown) => Promise<void> };
			}
		).default;
		this.TrezorConnect = TrezorConnect;

		await (TrezorConnect as { init: (config: unknown) => Promise<void> }).init({
			manifest: this.manifest || {
				email: "unknown@localhost.local",
				appUrl: "http://localhost",
			},
		});

		this._isConnected = true;
	}

	async disconnect(): Promise<void> {
		if (this.TrezorConnect) {
			// @ts-expect-error - Optional dependency, dispose() exists at runtime
			this.TrezorConnect.dispose();
			this._isConnected = false;
		}
	}

	isConnected(): boolean {
		return this._isConnected;
	}

	async getAddress(path: string): Promise<AddressType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Address } = await import(
			"../../primitives/Address/index.js"
		);

		// @ts-expect-error - Optional dependency, ethereumGetAddress() exists at runtime
		const result = await this.TrezorConnect.ethereumGetAddress({ path });

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		return Address.from(result.payload.address);
	}

	async getAddresses(basePath: string, count: number): Promise<AddressType[]> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Address } = await import(
			"../../primitives/Address/index.js"
		);

		// Trezor Connect supports batch address retrieval
		const bundle = Array.from({ length: count }, (_, i) => ({
			path: `${basePath}/${i}`,
			showOnTrezor: false,
		}));

		// @ts-expect-error - Optional dependency, ethereumGetAddress() exists at runtime
		const result = await this.TrezorConnect.ethereumGetAddress({ bundle });

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		return result.payload.map((item: { address: string }) =>
			Address.from(item.address),
		);
	}

	async signTransaction(
		path: string,
		tx: TransactionType,
	): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const { Hex } = await import("../../primitives/Hex/index.js");
		const Hash = await import("../../primitives/Hash/index.js");

		// Convert Transaction to Trezor format
		const trezorTx: Record<string, unknown> = {
			to: tx.to ? Hex.fromBytes(tx.to) : undefined,
			value: tx.value ? Hex.fromBigInt(tx.value) : "0x0",
			gasPrice:
				"gasPrice" in tx && tx.gasPrice
					? Hex.fromBigInt(tx.gasPrice)
					: undefined,
			gasLimit: tx.gasLimit ? Hex.fromBigInt(tx.gasLimit) : undefined,
			nonce: tx.nonce ? Hex.fromBigInt(tx.nonce) : undefined,
			data: tx.data ? Hex.fromBytes(tx.data) : undefined,
			chainId: "chainId" in tx ? tx.chainId : 1,
		};

		// EIP-1559 fields
		if ("maxFeePerGas" in tx && tx.maxFeePerGas) {
			trezorTx.maxFeePerGas = Hex.fromBigInt(tx.maxFeePerGas);
		}
		if ("maxPriorityFeePerGas" in tx && tx.maxPriorityFeePerGas) {
			trezorTx.maxPriorityFeePerGas = Hex.fromBigInt(tx.maxPriorityFeePerGas);
		}

		// @ts-expect-error - Optional dependency, ethereumSignTransaction() exists at runtime
		const result = await this.TrezorConnect.ethereumSignTransaction({
			path,
			transaction: trezorTx,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const { v, r, s } = result.payload;
		return Signature.from({
			r: Hash.fromHex(r),
			s: Hash.fromHex(s),
			v: Number.parseInt(v, 16),
		});
	}

	async signTypedData(
		path: string,
		typedData: EIP712TypedData,
	): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const Hash = await import("../../primitives/Hash/index.js");
		const Hex = await import("../../primitives/Hex/index.js");

		// @ts-expect-error - Optional dependency, ethereumSignTypedData() exists at runtime
		const result = await this.TrezorConnect.ethereumSignTypedData({
			path,
			data: typedData,
			metamask_v4_compat: true,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const sigBytes = Hex.toBytes(result.payload.signature as string);
		const r = Hash.fromBytes(sigBytes.slice(0, 32));
		const s = Hash.fromBytes(sigBytes.slice(32, 64));
		const v = sigBytes[64];

		return Signature.from({ r, s, v });
	}

	async signMessage(path: string, message: Uint8Array): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const Hash = await import("../../primitives/Hash/index.js");
		const Hex = await import("../../primitives/Hex/index.js");

		// @ts-expect-error - Optional dependency, ethereumSignMessage() exists at runtime
		const result = await this.TrezorConnect.ethereumSignMessage({
			path,
			message: Hex.fromBytes(message).slice(2),
			hex: true,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const sigBytes = Hex.toBytes(result.payload.signature as string);
		const r = Hash.fromBytes(sigBytes.slice(0, 32));
		const s = Hash.fromBytes(sigBytes.slice(32, 64));
		const v = sigBytes[64];

		return Signature.from({ r, s, v });
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		// @ts-expect-error - Optional dependency, getFeatures() exists at runtime
		const result = await this.TrezorConnect.getFeatures();

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const features = result.payload;

		return {
			manufacturer: "Trezor",
			model: features.model || "Unknown",
			version: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
		};
	}
}
