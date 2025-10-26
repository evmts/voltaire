/**
 * HD Wallet Signer Implementation
 *
 * Signs transactions and messages using BIP-32/39/44 hierarchical deterministic wallets.
 * Uses @scure/bip32 and @scure/bip39 for key derivation (well-audited implementations).
 */

import { HDKey } from "@scure/bip32";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { PrivateKeySignerImpl } from "./private-key-signer.ts";
import type { Transaction } from "../../primitives/transaction.ts";
import type { TypedMessage } from "../eip712.ts";
import type { HDWalletSigner, HDWalletSignerOptions } from "./types.ts";

/**
 * HD Wallet signer implementation
 * Derives keys from a mnemonic phrase using BIP-44 standard
 */
export class HDWalletSignerImpl implements HDWalletSigner {
	readonly type = "hdWallet" as const;
	private readonly mnemonic: string;
	private readonly passphrase: string;
	readonly path: string;
	readonly index: number;
	private readonly signer: PrivateKeySignerImpl;
	readonly address: string;

	private constructor(
		mnemonic: string,
		passphrase: string,
		path: string,
		index: number,
	) {
		this.mnemonic = mnemonic;
		this.passphrase = passphrase;
		this.path = path;
		this.index = index;

		// Derive the private key at the specified path
		const privateKey = this.derivePrivateKey(path, index);
		this.signer = PrivateKeySignerImpl.fromPrivateKey({ privateKey });
		this.address = this.signer.address;
	}

	/**
	 * Create a signer from a mnemonic phrase
	 * @param options - HD wallet options
	 * @returns HD wallet signer instance
	 */
	static fromMnemonic(options: HDWalletSignerOptions): HDWalletSignerImpl {
		// Validate mnemonic
		const mnemonic = options.mnemonic.trim();
		if (!bip39.validateMnemonic(mnemonic, wordlist)) {
			throw new Error("Invalid mnemonic phrase");
		}

		// Default path: m/44'/60'/0'/0 (BIP-44 Ethereum path)
		const basePath = options.path || "m/44'/60'/0'/0";
		const index = options.index ?? 0;
		const passphrase = options.passphrase || "";

		return new HDWalletSignerImpl(mnemonic, passphrase, basePath, index);
	}

	/**
	 * Generate a random mnemonic and create a signer
	 * @param wordCount - Number of words (12, 15, 18, 21, or 24)
	 * @param options - Optional derivation options
	 * @returns HD wallet signer instance
	 */
	static generate(
		wordCount: 12 | 15 | 18 | 21 | 24 = 12,
		options?: Omit<HDWalletSignerOptions, "mnemonic">,
	): HDWalletSignerImpl {
		// Calculate entropy bits: 12 words = 128 bits, 24 words = 256 bits
		const entropyBits = wordCount * 11 - wordCount / 3;
		const entropy = new Uint8Array(entropyBits / 8);
		crypto.getRandomValues(entropy);

		const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

		return HDWalletSignerImpl.fromMnemonic({
			mnemonic,
			...options,
		});
	}

	/**
	 * Derive a private key from the mnemonic at a specific path
	 * @param basePath - Base derivation path
	 * @param index - Account index
	 * @returns Private key as hex string
	 */
	private derivePrivateKey(basePath: string, index: number): string {
		// Convert mnemonic to seed
		const seed = bip39.mnemonicToSeedSync(this.mnemonic, this.passphrase);

		// Create HD key from seed
		const hdKey = HDKey.fromMasterSeed(seed);

		// Derive at path: basePath/index
		const fullPath = `${basePath}/${index}`;
		const derived = hdKey.derive(fullPath);

		if (!derived.privateKey) {
			throw new Error(`Failed to derive private key at path: ${fullPath}`);
		}

		return `0x${Buffer.from(derived.privateKey).toString("hex")}`;
	}

	/**
	 * Get the mnemonic phrase (use with caution!)
	 * @returns Mnemonic phrase as string
	 */
	getMnemonic(): string {
		return this.mnemonic;
	}

	/**
	 * Derive a new signer at a different index
	 * @param index - Account index
	 * @returns New signer at the specified index
	 */
	async deriveIndex(index: number): Promise<HDWalletSigner> {
		if (index < 0) {
			throw new Error("Index must be non-negative");
		}

		return new HDWalletSignerImpl(
			this.mnemonic,
			this.passphrase,
			this.path,
			index,
		);
	}

	/**
	 * Derive a new signer at a custom path
	 * @param path - Custom BIP-44 path
	 * @returns New signer at the specified path
	 */
	async derivePath(path: string): Promise<HDWalletSigner> {
		if (!path.startsWith("m/")) {
			throw new Error("Path must start with 'm/'");
		}

		// Extract index from path if present
		const pathParts = path.split("/");
		const lastPart = pathParts[pathParts.length - 1];
		const index =
			lastPart && !lastPart.includes("'") ? Number.parseInt(lastPart, 10) : 0;

		// Remove index from path to get base path
		const basePath = index > 0 ? pathParts.slice(0, -1).join("/") : path;

		return new HDWalletSignerImpl(
			this.mnemonic,
			this.passphrase,
			basePath,
			index,
		);
	}

	/**
	 * Sign a transaction
	 * @param transaction - Unsigned or partially signed transaction
	 * @returns Fully signed transaction
	 */
	async signTransaction(transaction: Transaction): Promise<Transaction> {
		return this.signer.signTransaction(transaction);
	}

	/**
	 * Sign a message using EIP-191 personal message format
	 * @param message - Message to sign
	 * @returns Signature as 65-byte hex string
	 */
	async signMessage(message: Uint8Array | string): Promise<string> {
		return this.signer.signMessage(message);
	}

	/**
	 * Sign typed data using EIP-712
	 * @param typedData - Structured data to sign
	 * @returns Signature as 65-byte hex string
	 */
	async signTypedData(typedData: TypedMessage): Promise<string> {
		return this.signer.signTypedData(typedData);
	}
}
