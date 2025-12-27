import type { AddressType } from "../../primitives/Address/AddressType.js";
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
	private transport?: any; // TransportWebUSB
	private eth?: any; // Eth app instance
	private _isConnected = false;

	async connect(): Promise<void> {
		const TransportModule = await import("@ledgerhq/hw-transport-webusb");
		// @ts-ignore - Optional dependency, default export is TransportWebUSB class
		const TransportWebUSB = TransportModule.default;
		const EthModule = await import("@ledgerhq/hw-app-eth");
		// @ts-ignore - Optional dependency, default export is Eth class
		const Eth = EthModule.default;

		// @ts-ignore - request() is a static method on TransportWebUSB
		this.transport = await TransportWebUSB.request();
		// @ts-ignore - Eth is constructable
		this.eth = new Eth(this.transport);
		this._isConnected = true;
	}

	async disconnect(): Promise<void> {
		if (this.transport) {
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
		const hexString = Buffer.from(serialized).toString("hex");

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

		const hexMessage = Buffer.from(message).toString("hex");
		const result = await this.eth.signPersonalMessage(path, hexMessage);

		return Signature.from({
			r: Hash.fromHex(result.r),
			s: Hash.fromHex(result.s),
			v: Number.parseInt(result.v, 16),
		});
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		if (!this.eth) throw new Error("Ledger not connected");

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
		return `0x${Buffer.from(JSON.stringify(domain)).toString("hex")}`;
	}

	private hashMessage(typedData: EIP712TypedData): string {
		// Simplified - real implementation would use proper EIP-712 encoding
		return `0x${Buffer.from(JSON.stringify(typedData.message)).toString("hex")}`;
	}
}
