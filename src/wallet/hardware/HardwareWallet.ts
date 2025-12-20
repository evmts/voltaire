import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { SignatureType } from "../../primitives/Signature/SignatureType.js";
import type { Any as TransactionType } from "../../primitives/Transaction/types.js";

/**
 * EIP-712 TypedData structure
 */
export interface EIP712TypedData {
	types: {
		EIP712Domain: Array<{ name: string; type: string }>;
		[key: string]: Array<{ name: string; type: string }>;
	};
	primaryType: string;
	domain: {
		name?: string;
		version?: string;
		chainId?: number;
		verifyingContract?: string;
		salt?: string;
	};
	message: Record<string, any>;
}

/**
 * Device information
 */
export interface DeviceInfo {
	manufacturer: string;
	model: string;
	version: string;
}

/**
 * Hardware wallet interface
 *
 * Abstract interface for hardware wallet implementations (Ledger, Trezor, etc.)
 * Provides secure key management and transaction signing via physical devices.
 */
export interface HardwareWallet {
	/**
	 * Connect to the hardware device
	 * @throws If device not found or connection fails
	 */
	connect(): Promise<void>;

	/**
	 * Disconnect from the hardware device
	 */
	disconnect(): Promise<void>;

	/**
	 * Check if device is connected
	 */
	isConnected(): boolean;

	/**
	 * Get Ethereum address at specified derivation path
	 * @param path - BIP-32/44 derivation path (e.g., "m/44'/60'/0'/0/0")
	 * @returns Ethereum address
	 */
	getAddress(path: string): Promise<AddressType>;

	/**
	 * Get multiple addresses from a base path
	 * @param basePath - Base derivation path (e.g., "m/44'/60'/0'/0")
	 * @param count - Number of addresses to retrieve
	 * @returns Array of Ethereum addresses
	 */
	getAddresses(basePath: string, count: number): Promise<AddressType[]>;

	/**
	 * Sign transaction with hardware device
	 * @param path - BIP-32/44 derivation path
	 * @param tx - Transaction to sign
	 * @returns Transaction signature
	 */
	signTransaction(path: string, tx: TransactionType): Promise<SignatureType>;

	/**
	 * Sign EIP-712 typed data
	 * @param path - BIP-32/44 derivation path
	 * @param typedData - EIP-712 structured data
	 * @returns Signature
	 */
	signTypedData(
		path: string,
		typedData: EIP712TypedData,
	): Promise<SignatureType>;

	/**
	 * Sign personal message
	 * @param path - BIP-32/44 derivation path
	 * @param message - Message bytes to sign
	 * @returns Signature
	 */
	signMessage(path: string, message: Uint8Array): Promise<SignatureType>;

	/**
	 * Get hardware device information
	 * @returns Device manufacturer, model, and firmware version
	 */
	getDeviceInfo(): Promise<DeviceInfo>;
}
