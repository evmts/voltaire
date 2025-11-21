import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { SignatureType } from "../../primitives/Signature/SignatureType.js";
import type { TransactionType } from "../../primitives/Transaction/TransactionType.js";
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
 * import { TrezorWallet } from './wallet/hardware'
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
	private TrezorConnect?: any;

	constructor(options?: { manifest?: { email: string; appUrl: string } }) {
		this.manifest = options?.manifest;
	}

	async connect(): Promise<void> {
		const { default: TrezorConnect } = await import("@trezor/connect-web");
		this.TrezorConnect = TrezorConnect;

		await TrezorConnect.init({
			manifest: this.manifest || {
				email: "unknown@localhost.local",
				appUrl: "http://localhost",
			},
		});

		this._isConnected = true;
	}

	async disconnect(): Promise<void> {
		if (this.TrezorConnect) {
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

		const result = await this.TrezorConnect.ethereumGetAddress({ bundle });

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		return result.payload.map((item: any) => Address.from(item.address));
	}

	async signTransaction(
		path: string,
		tx: TransactionType,
	): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const { default: Hex } = await import("../../primitives/Hex/index.js");

		// Convert Transaction to Trezor format
		const trezorTx: any = {
			to: tx.to ? Hex.toString(tx.to) : undefined,
			value: tx.value ? Hex.toString(tx.value) : "0x0",
			gasPrice: tx.gasPrice ? Hex.toString(tx.gasPrice) : undefined,
			gasLimit: tx.gas ? Hex.toString(tx.gas) : undefined,
			nonce: tx.nonce ? Hex.toString(tx.nonce) : undefined,
			data: tx.data ? Hex.toString(tx.data) : undefined,
			chainId: tx.chainId || 1,
		};

		// EIP-1559 fields
		if (tx.maxFeePerGas) {
			trezorTx.maxFeePerGas = Hex.toString(tx.maxFeePerGas);
		}
		if (tx.maxPriorityFeePerGas) {
			trezorTx.maxPriorityFeePerGas = Hex.toString(tx.maxPriorityFeePerGas);
		}

		const result = await this.TrezorConnect.ethereumSignTransaction({
			path,
			transaction: trezorTx,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const { v, r, s } = result.payload;
		return Signature.from({ r, s, v: Number.parseInt(v, 16) });
	}

	async signTypedData(
		path: string,
		typedData: EIP712TypedData,
	): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);

		const result = await this.TrezorConnect.ethereumSignTypedData({
			path,
			data: typedData,
			metamask_v4_compat: true,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const sigBytes = Buffer.from(result.payload.signature.slice(2), "hex");
		const r = `0x${sigBytes.slice(0, 32).toString("hex")}`;
		const s = `0x${sigBytes.slice(32, 64).toString("hex")}`;
		const v = sigBytes[64];

		return Signature.from({ r, s, v });
	}

	async signMessage(path: string, message: Uint8Array): Promise<SignatureType> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);

		const result = await this.TrezorConnect.ethereumSignMessage({
			path,
			message: Buffer.from(message).toString("hex"),
			hex: true,
		});

		if (!result.success) {
			throw new Error(result.payload.error);
		}

		const sigBytes = Buffer.from(result.payload.signature.slice(2), "hex");
		const r = `0x${sigBytes.slice(0, 32).toString("hex")}`;
		const s = `0x${sigBytes.slice(32, 64).toString("hex")}`;
		const v = sigBytes[64];

		return Signature.from({ r, s, v });
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		if (!this.TrezorConnect) throw new Error("Trezor not connected");

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
