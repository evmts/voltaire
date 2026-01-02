import type { AddressType } from "../../primitives/Address/AddressType.js";
import * as Hex from "../../primitives/Hex/index.js";
import type { SignatureType } from "../../primitives/Signature/SignatureType.js";
import type { Any as TransactionType } from "../../primitives/Transaction/types.js";
import type {
	DeviceInfo,
	EIP712TypedData,
	HardwareWallet,
} from "./HardwareWallet.js";

/**
 * Ledger hardware wallet implementation
 *
 * Provides integration with Ledger devices via WebUSB.
 * Requires user to have Ledger Live and Ethereum app installed on device.
 *
 * @example
 * ```typescript
 * import { LedgerWallet } from './wallet/hardware'
 *
 * const ledger = new LedgerWallet();
 * await ledger.connect();
 *
 * // Get first address
 * const address = await ledger.getAddress("m/44'/60'/0'/0/0");
 *
 * // Sign transaction
 * const signature = await ledger.signTransaction("m/44'/60'/0'/0/0", tx);
 * ```
 */
export class LedgerWallet implements HardwareWallet {
	private transport?: unknown; // TransportWebUSB
	private eth?: unknown; // Eth app instance
	private _isConnected = false;

	async connect(): Promise<void> {
		const TransportModule = await import("@ledgerhq/hw-transport-webusb");
		const TransportWebUSB = (
			TransportModule as unknown as {
				default: { request: () => Promise<unknown> };
			}
		).default;
		const EthModule = await import("@ledgerhq/hw-app-eth");
		const Eth = (
			EthModule as unknown as { default: new (transport: unknown) => unknown }
		).default;

		this.transport = await TransportWebUSB.request();
		this.eth = new Eth(this.transport);
		this._isConnected = true;
	}

	async disconnect(): Promise<void> {
		if (this.transport) {
			// @ts-expect-error - Optional dependency, close() exists at runtime
			await this.transport.close();
			this.transport = undefined;
			this.eth = undefined;
			this._isConnected = false;
		}
	}

	isConnected(): boolean {
		return this._isConnected;
	}

	async getAddress(path: string): Promise<AddressType> {
		if (!this.eth) throw new Error("Ledger not connected");

		const { default: Address } = await import(
			"../../primitives/Address/index.js"
		);
		// @ts-expect-error - Optional dependency, getAddress() exists at runtime
		const result = await this.eth.getAddress(path);
		return Address.from(result.address);
	}

	async getAddresses(basePath: string, count: number): Promise<AddressType[]> {
		const addresses: AddressType[] = [];
		for (let i = 0; i < count; i++) {
			const path = `${basePath}/${i}`;
			addresses.push(await this.getAddress(path));
		}
		return addresses;
	}

	async signTransaction(
		path: string,
		tx: TransactionType,
	): Promise<SignatureType> {
		if (!this.eth) throw new Error("Ledger not connected");

		const { default: Transaction } = await import(
			"../../primitives/Transaction/index.js"
		);
		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const Hash = await import("../../primitives/Hash/index.js");

		// Serialize transaction for Ledger
		const serialized = Transaction.serialize(tx);
		const hexString = Hex.fromBytes(serialized).slice(2);

		// @ts-expect-error - Optional dependency, signTransaction() exists at runtime
		const result = await this.eth.signTransaction(path, hexString);

		// Combine r, s, v into signature
		const r = result.r;
		const s = result.s;
		const v = result.v;

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
		if (!this.eth) throw new Error("Ledger not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const Hash = await import("../../primitives/Hash/index.js");

		// @ts-expect-error - Optional dependency, signEIP712HashedMessage() exists at runtime
		const result = await this.eth.signEIP712HashedMessage(
			path,
			this.hashDomain(typedData.domain),
			this.hashMessage(typedData),
		);

		return Signature.from({
			r: Hash.fromHex(result.r),
			s: Hash.fromHex(result.s),
			v: Number.parseInt(result.v, 16),
		});
	}

	async signMessage(path: string, message: Uint8Array): Promise<SignatureType> {
		if (!this.eth) throw new Error("Ledger not connected");

		const { default: Signature } = await import(
			"../../primitives/Signature/index.js"
		);
		const Hash = await import("../../primitives/Hash/index.js");

		const hexMessage = Hex.fromBytes(message).slice(2);
		// @ts-expect-error - Optional dependency, signPersonalMessage() exists at runtime
		const result = await this.eth.signPersonalMessage(path, hexMessage);

		return Signature.from({
			r: Hash.fromHex(result.r),
			s: Hash.fromHex(result.s),
			v: Number.parseInt(result.v, 16),
		});
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		if (!this.eth) throw new Error("Ledger not connected");

		// @ts-expect-error - Optional dependency, getAppConfiguration() exists at runtime
		const appConfig = await this.eth.getAppConfiguration();

		return {
			manufacturer: "Ledger",
			model: "Unknown", // Would need additional transport calls
			version: appConfig.version,
		};
	}

	// Helper methods for EIP-712 hashing
	private hashDomain(domain: EIP712TypedData["domain"]): string {
		// Simplified - real implementation would use proper EIP-712 encoding
		const encoder = new TextEncoder();
		const bytes = encoder.encode(JSON.stringify(domain));
		return Hex.fromBytes(bytes);
	}

	private hashMessage(typedData: EIP712TypedData): string {
		// Simplified - real implementation would use proper EIP-712 encoding
		const encoder = new TextEncoder();
		const bytes = encoder.encode(JSON.stringify(typedData.message));
		return Hex.fromBytes(bytes);
	}
}
