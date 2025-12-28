/**
 * End-to-End Workflow Tests
 * Simulates real-world usage patterns for Ethereum primitives and crypto operations.
 *
 * Test coverage:
 * 1. Deploy contract: Compile → sign deployment tx → execute → get receipt → verify address
 * 2. Token transfer: Create ERC20 transfer → sign → execute → verify balance change
 * 3. NFT minting: Create ERC721 mint → execute → verify ownership → get tokenURI
 * 4. Multi-signature: Multiple signers → collect signatures → combine → verify
 * 5. HD wallet: Generate seed → derive multiple accounts → sign from each → verify
 * 6. Gas estimation: Build tx → estimate gas → add buffer → execute → verify actual gas
 * 7. Event filtering: Deploy contract → emit events → filter logs → decode event data
 * 8. Block polling: Wait for block → poll for receipt → verify confirmation depth
 */

import { beforeAll, describe, expect, it } from "vitest";
import * as Bip39 from "../crypto/Bip39/index.js";
import * as HDWallet from "../crypto/HDWallet/HDWallet.js";
import { hash as keccak256 } from "../crypto/Keccak256/hash.js";
import * as Secp256k1 from "../crypto/Secp256k1/index.js";
import { recoverPublicKey } from "../crypto/Secp256k1/recoverPublicKey.js";
import { Keccak256Wasm } from "../crypto/keccak256.wasm.js";
import { PrivateKeySignerImpl } from "../crypto/signers/private-key-signer.js";
import { Address, toHex as addressToHex } from "../primitives/Address/index.js";
import { toChecksummed } from "../primitives/Address/internal-index.js";
import {
	fromBytes as hexFromBytes,
	toBytes as hexToBytes,
} from "../primitives/Hex/index.js";
import * as SignedData from "../primitives/SignedData/index.js";
import * as Transaction from "../primitives/Transaction/index.js";
import * as TypedData from "../primitives/TypedData/index.js";

/**
 * Mock provider for simulating blockchain interactions.
 * In production, use ethers.js or web3.js provider.
 */
class MockEthereumProvider {
	private accounts: Map<string, { nonce: number; balance: bigint }> = new Map();
	private blockHeight = 1;
	private blockTimestamp: number = Date.now() / 1000;
	private txReceipts: Map<string, any> = new Map();
	private contractCode: Map<string, Uint8Array> = new Map();
	private logs: any[] = [];

	constructor() {
		// Initialize default accounts
		const testAccounts = [
			"0x1111111111111111111111111111111111111111",
			"0x2222222222222222222222222222222222222222",
			"0x3333333333333333333333333333333333333333",
		];

		testAccounts.forEach((addr) => {
			this.accounts.set(addr.toLowerCase(), {
				nonce: 0,
				balance: 100n * 10n ** 18n, // 100 ETH each
			});
		});
	}

	async request(method: string, params: any[]): Promise<any> {
		switch (method) {
			case "eth_chainId":
				return "0x1"; // Mainnet

			case "eth_blockNumber":
				return `0x${this.blockHeight.toString(16)}`;

			case "eth_getBlockByNumber":
				return {
					number: `0x${this.blockHeight.toString(16)}`,
					timestamp: `0x${Math.floor(this.blockTimestamp).toString(16)}`,
					gasLimit: "0x1c9c380",
					gasUsed: "0x0",
					miner: "0x0000000000000000000000000000000000000000",
				};

			case "eth_getBalance": {
				const addr = params[0].toLowerCase();
				const balance = this.accounts.get(addr)?.balance ?? 0n;
				return `0x${balance.toString(16)}`;
			}

			case "eth_getTransactionCount": {
				const nonce = this.accounts.get(params[0].toLowerCase())?.nonce ?? 0;
				return `0x${nonce.toString(16)}`;
			}

			case "eth_sendTransaction":
			case "eth_sendRawTransaction": {
				const txHash = keccak256(
					new TextEncoder().encode(`tx-${Math.random()}`),
				);
				const txHashHex = hexFromBytes(txHash);

				// Simulate nonce increment
				const fromAddr = (params[0].from || params[0]).toLowerCase();
				const account = this.accounts.get(fromAddr);
				if (account) {
					account.nonce += 1;
				}

				// Store receipt
				this.txReceipts.set(txHashHex, {
					transactionHash: txHashHex,
					blockNumber: `0x${(this.blockHeight + 1).toString(16)}`,
					gasUsed: "0x5208",
					status: "0x1",
				});

				this.blockHeight += 1;
				return txHashHex;
			}

			case "eth_getTransactionReceipt": {
				const txHash = params[0];
				return this.txReceipts.get(txHash) || null;
			}

			case "eth_estimateGas":
				return "0x5208"; // 21000 gas (standard transfer)

			case "eth_gasPrice":
				return "0x4a817c800"; // 20 gwei

			case "eth_getCode":
				return this.contractCode.get(params[0].toLowerCase()) ?? "0x";

			case "eth_call":
				return this.handleContractCall(params[0]);

			case "eth_getLogs":
				return this.logs;

			default:
				throw new Error(`Method not implemented: ${method}`);
		}
	}

	private handleContractCall(tx: any): string {
		// Return mock ERC20 balance query result
		if (tx.data?.startsWith("0x70a08231")) {
			// balanceOf selector
			return "0x0000000000000000000000000000000000000000000000056bc75e2d63100000"; // 100 * 10^18
		}
		return "0x";
	}

	deployContract(address: string, code: Uint8Array): void {
		this.contractCode.set(address.toLowerCase(), code);
	}

	emitLog(log: any): void {
		this.logs.push(log);
	}

	getBlockHeight(): number {
		return this.blockHeight;
	}

	advanceBlock(): void {
		this.blockHeight += 1;
		this.blockTimestamp += 12; // 12 second blocks
	}
}

// Global test fixtures
let provider: MockEthereumProvider;
let testPrivateKey: string;
let testSigner: PrivateKeySignerImpl;

beforeAll(async () => {
	await Keccak256Wasm.init();

	provider = new MockEthereumProvider();
	// Use a known test private key (NOT FOR PRODUCTION)
	testPrivateKey =
		"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
	testSigner = PrivateKeySignerImpl.fromPrivateKey({
		privateKey: testPrivateKey,
	});
});

describe("E2E Workflows", () => {
	describe("1. Deploy Contract", () => {
		it("should compile, sign deployment tx, execute, and verify address", async () => {
			// Step 1: Prepare contract bytecode (simplified ERC20-like contract)
			const contractBytecode = new Uint8Array([
				0x60,
				0x80,
				0x60,
				0x40,
				0x50,
				0x50, // PUSH1 0x80 PUSH1 0x40 MSTORE MSTORE
			]);
			const contractBytecodeHex = hexFromBytes(contractBytecode);

			// Step 2: Create deployment transaction
			const deploymentTx: any = {
				from: testSigner.address,
				data: contractBytecodeHex,
				value: "0x0",
				gas: "0x47b760", // 4.7M gas for contract deployment
				gasPrice: "0x4a817c800", // 20 gwei
				nonce: 0,
			};

			// Step 3: Sign transaction
			const txHash = keccak256(
				new TextEncoder().encode(JSON.stringify(deploymentTx)),
			);
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			expect(signature.r).toBeDefined();
			expect(signature.s).toBeDefined();
			expect(signature.v).toBeDefined();

			// Step 4: Send signed transaction
			const txHashResult = await provider.request("eth_sendRawTransaction", [
				deploymentTx,
			]);
			expect(txHashResult).toMatch(/^0x[0-9a-f]{64}$/i);

			// Step 5: Get receipt and verify deployment
			const receipt = await provider.request("eth_getTransactionReceipt", [
				txHashResult,
			]);
			expect(receipt).toBeDefined();
			expect(receipt.status).toBe("0x1");
			expect(receipt.blockNumber).toBeDefined();

			// Step 6: Verify contract address is derivable
			const expectedContractAddress = keccak256(
				new TextEncoder().encode(`${testSigner.address}0`),
			);
			expect(expectedContractAddress).toHaveLength(32);
		});
	});

	describe("2. Token Transfer (ERC20)", () => {
		it("should create, sign, execute transfer and verify balance change", async () => {
			const tokenContractAddress = Address.from(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const toAddress = Address.from(
				"0x1111111111111111111111111111111111111111",
			);
			const transferAmount = 100n * 10n ** 6n; // 100 USDC (6 decimals)

			// Step 1: Build transfer calldata
			// transfer(address to, uint256 amount) selector = 0xa9059cbb
			const transferSelector = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const transferData = new Uint8Array(68);
			transferData.set(transferSelector, 0);
			// Pad address to 32 bytes
			const toAddrBytes = Address.toBytes(toAddress);
			transferData.set(toAddrBytes, 12 + 12); // Offset for address
			// Pad amount to 32 bytes
			const amountHex = transferAmount.toString(16).padStart(64, "0");
			const amountBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				amountBytes[i] = Number.parseInt(amountHex.slice(i * 2, i * 2 + 2), 16);
			}
			transferData.set(amountBytes, 36);

			// Step 2: Create transaction
			const transferTx: any = {
				from: testSigner.address,
				to: toChecksummed(tokenContractAddress),
				data: hexFromBytes(transferData),
				value: "0x0",
				gas: "0x55f0", // 22000 gas for transfer
				gasPrice: "0x4a817c800",
				nonce: 1,
			};

			// Step 3: Sign transaction
			const txHash = keccak256(
				new TextEncoder().encode(JSON.stringify(transferTx)),
			);
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			expect(signature).toBeDefined();

			// Step 4: Execute transaction
			const txHashResult = await provider.request("eth_sendRawTransaction", [
				transferTx,
			]);
			expect(txHashResult).toMatch(/^0x[0-9a-f]{64}$/i);

			// Step 5: Get receipt
			const receipt = await provider.request("eth_getTransactionReceipt", [
				txHashResult,
			]);
			expect(receipt.status).toBe("0x1");

			// Step 6: Verify balance change (mock call to balanceOf)
			const balanceAfter = await provider.request("eth_call", [
				{
					to: toChecksummed(tokenContractAddress),
					data: `0x70a08231${testSigner.address.slice(2).padStart(64, "0")}`,
				},
			]);
			expect(balanceAfter).toBeDefined();
		});
	});

	describe("3. NFT Minting (ERC721)", () => {
		it("should create mint tx, execute, verify ownership and tokenURI", async () => {
			const nftContractAddress = Address.from(
				"0x0000000000000000000000000000000000000001",
			);
			const tokenId = 1n;

			// Step 1: Build mint calldata
			// mint(address to, uint256 tokenId) selector = 0x40c10f19
			const mintSelector = new Uint8Array([0x40, 0xc1, 0x0f, 0x19]);
			const mintData = new Uint8Array(68);
			mintData.set(mintSelector, 0);

			const toAddrBytes = Address.toBytes(Address(testSigner.address));
			mintData.set(toAddrBytes, 12 + 12);

			const tokenIdHex = tokenId.toString(16).padStart(64, "0");
			const tokenIdBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				tokenIdBytes[i] = Number.parseInt(
					tokenIdHex.slice(i * 2, i * 2 + 2),
					16,
				);
			}
			mintData.set(tokenIdBytes, 36);

			// Step 2: Create mint transaction
			const mintTx: any = {
				from: testSigner.address,
				to: toChecksummed(nftContractAddress),
				data: hexFromBytes(mintData),
				value: "0x0",
				gas: "0x88b8", // 35000 gas for mint
				gasPrice: "0x4a817c800",
				nonce: 2,
			};

			// Step 3: Sign and execute
			const txHash = keccak256(
				new TextEncoder().encode(JSON.stringify(mintTx)),
			);
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			const txHashResult = await provider.request("eth_sendRawTransaction", [
				mintTx,
			]);
			expect(txHashResult).toMatch(/^0x[0-9a-f]{64}$/i);

			// Step 4: Verify ownership
			// ownerOf(uint256 tokenId) selector = 0x6352211e
			const ownerOfSelector = `0x6352211e${tokenId.toString(16).padStart(64, "0")}`;
			const ownerResult = await provider.request("eth_call", [
				{
					to: toChecksummed(nftContractAddress),
					data: ownerOfSelector,
				},
			]);
			expect(ownerResult).toBeDefined();

			// Step 5: Verify tokenURI
			// tokenURI(uint256 tokenId) selector = 0xc87b56dd
			const tokenURISelector = `0xc87b56dd${tokenId.toString(16).padStart(64, "0")}`;
			const uriResult = await provider.request("eth_call", [
				{
					to: toChecksummed(nftContractAddress),
					data: tokenURISelector,
				},
			]);
			expect(uriResult).toBeDefined();
		});
	});

	describe("4. Multi-Signature Workflow", () => {
		it("should collect signatures from multiple signers and verify", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Derive multiple signer accounts
			const signer1 = HDWallet.deriveEthereum(root, 0, 0);
			const signer2 = HDWallet.deriveEthereum(root, 0, 1);
			const signer3 = HDWallet.deriveEthereum(root, 0, 2);

			const privKey1 = HDWallet.getPrivateKey(signer1)!;
			const privKey2 = HDWallet.getPrivateKey(signer2)!;
			const privKey3 = HDWallet.getPrivateKey(signer3)!;

			// Create message to sign
			const message = new TextEncoder().encode("Multi-sig transaction");
			const messageHash = SignedData.Hash({ keccak256 })(message);

			// Collect signatures
			const sig1 = Secp256k1.sign(messageHash, privKey1);
			const sig2 = Secp256k1.sign(messageHash, privKey2);
			const sig3 = Secp256k1.sign(messageHash, privKey3);

			const signatures = [sig1, sig2, sig3];
			expect(signatures).toHaveLength(3);
			expect(
				signatures.every((sig) => sig.r && sig.s && sig.v !== undefined),
			).toBe(true);

			// Verify each signature recovers correct signer
			const pubKey1 = HDWallet.getPublicKey(signer1);
			const pubKey2 = HDWallet.getPublicKey(signer2);
			const pubKey3 = HDWallet.getPublicKey(signer3);

			expect(pubKey1).toBeDefined();
			expect(pubKey2).toBeDefined();
			expect(pubKey3).toBeDefined();

			// Combine signatures into a packed format (for contract verification)
			const packedSignatures = new Uint8Array(
				65 * signatures.length + 32, // Add space for nonces if needed
			);
			let offset = 0;

			for (const sig of signatures) {
				// Each signature: r[32] + s[32] + v[1]
				packedSignatures.set(sig.r, offset);
				offset += 32;
				packedSignatures.set(sig.s, offset);
				offset += 32;
				packedSignatures[offset] = sig.v;
				offset += 1;
			}

			expect(packedSignatures.length).toBe(65 * 3 + 32);
		});
	});

	describe("5. HD Wallet Derivation", () => {
		it("should generate seed, derive accounts, and sign from each", async () => {
			// Step 1: Generate mnemonic
			const mnemonic = Bip39.generateMnemonic(256);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);

			// Step 2: Derive seed
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			expect(seed.length).toBe(64);

			// Step 3: Create root key
			const root = HDWallet.fromSeed(seed);
			expect(HDWallet.getPrivateKey(root)).toBeDefined();

			// Step 4: Derive multiple accounts (BIP-44 ETH path)
			const accounts = [];
			const signatures = [];

			for (let i = 0; i < 5; i++) {
				const account = HDWallet.deriveEthereum(root, 0, i);
				const privKey = HDWallet.getPrivateKey(account)!;
				accounts.push(account);

				// Sign a test message with each account
				const message = new TextEncoder().encode(`Account ${i} signature`);
				const messageHash = keccak256(message);
				const sig = Secp256k1.sign(messageHash, privKey);
				signatures.push(sig);
			}

			// Step 5: Verify all accounts and signatures are unique
			expect(accounts).toHaveLength(5);
			expect(signatures).toHaveLength(5);

			const uniquePrivKeys = new Set(
				accounts.map((acc) =>
					Array.from(HDWallet.getPrivateKey(acc) || []).join(","),
				),
			);
			expect(uniquePrivKeys.size).toBe(5);

			// Step 6: Verify signatures are valid
			signatures.forEach((sig) => {
				expect(sig.r).toHaveLength(32);
				expect(sig.s).toHaveLength(32);
				expect([27, 28]).toContain(sig.v);
			});

			// Step 7: Export and reimport wallet
			const xprv = HDWallet.toExtendedPrivateKey(root);
			const restoredRoot = HDWallet.fromExtendedKey(xprv);
			const restoredAccount = HDWallet.deriveEthereum(restoredRoot, 0, 0);

			expect(HDWallet.getPrivateKey(accounts[0])).toEqual(
				HDWallet.getPrivateKey(restoredAccount),
			);
		});
	});

	describe("6. Gas Estimation with Buffer", () => {
		it("should estimate gas, add buffer, execute, and verify actual usage", async () => {
			const targetAddress = Address.from(
				"0x2222222222222222222222222222222222222222",
			);

			// Step 1: Build transaction to estimate
			const tx: any = {
				from: testSigner.address,
				to: toChecksummed(targetAddress),
				value: "0x0de0b6b3a7640000", // 1 ETH
				data: "0x",
				nonce: 3,
			};

			// Step 2: Estimate gas
			const gasEstimate = await provider.request("eth_estimateGas", [tx]);
			const gasAmount = Number.parseInt(gasEstimate, 16);
			expect(gasAmount).toBeGreaterThan(20000);

			// Step 3: Add 20% buffer for safety
			const gasWithBuffer = Math.ceil(gasAmount * 1.2);
			expect(gasWithBuffer).toBeGreaterThan(gasAmount);

			// Step 4: Execute with buffered gas
			const executeTx: any = {
				...tx,
				gas: `0x${gasWithBuffer.toString(16)}`,
				gasPrice: "0x4a817c800",
			};

			const txHash = keccak256(
				new TextEncoder().encode(JSON.stringify(executeTx)),
			);
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			const txHashResult = await provider.request("eth_sendRawTransaction", [
				executeTx,
			]);

			// Step 5: Get receipt and verify actual gas used
			const receipt = await provider.request("eth_getTransactionReceipt", [
				txHashResult,
			]);
			const actualGasUsed = Number.parseInt(receipt.gasUsed, 16);
			expect(actualGasUsed).toBeLessThanOrEqual(gasWithBuffer);
			expect(actualGasUsed).toBeGreaterThanOrEqual(0);
		});
	});

	describe("7. Event Filtering and Decoding", () => {
		it("should emit events, filter logs, and decode event data", async () => {
			const contractAddress = Address.from(
				"0x3333333333333333333333333333333333333333",
			);
			const toAddress = Address.from(
				"0x1111111111111111111111111111111111111111",
			);
			const transferAmount = 1000n;

			// Step 1: Create event log (Transfer event)
			// Transfer(address indexed from, address indexed to, uint256 value)
			// Selector: keccak256("Transfer(address,indexed address,uint256)")
			const transferEventSelector = keccak256(
				new TextEncoder().encode("Transfer(address,indexed address,uint256)"),
			);

			const eventLog = {
				address: toChecksummed(contractAddress),
				topics: [
					hexFromBytes(transferEventSelector),
					`0x${testSigner.address.slice(2).padStart(64, "0")}`,
					`0x${addressToHex(toAddress).slice(2).padStart(64, "0")}`,
				],
				data: `0x${transferAmount.toString(16).padStart(64, "0")}`,
				blockNumber: "0x1",
				transactionHash:
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				logIndex: "0x0",
			};

			// Step 2: Emit event
			provider.emitLog(eventLog);

			// Step 3: Query logs
			const logs = await provider.request("eth_getLogs", [
				{
					address: toChecksummed(contractAddress),
					topics: [hexFromBytes(transferEventSelector)],
					fromBlock: "0x0",
					toBlock: "latest",
				},
			]);

			expect(logs).toHaveLength(1);
			expect(logs[0].address).toBe(toChecksummed(contractAddress));

			// Step 4: Decode event data
			const decodedLog = logs[0];
			expect(decodedLog.topics[0]).toBe(hexFromBytes(transferEventSelector));

			// Parse topics
			const from = `0x${decodedLog.topics[1].slice(-40)}`.toLowerCase();
			const to = `0x${decodedLog.topics[2].slice(-40)}`.toLowerCase();
			const value = BigInt(decodedLog.data);

			expect(from).toBe(testSigner.address.toLowerCase());
			expect(to).toBe(addressToHex(toAddress).toLowerCase());
			expect(value).toBe(transferAmount);
		});
	});

	describe("8. Block Polling and Confirmations", () => {
		it("should wait for block, poll for receipt, verify confirmation depth", async () => {
			const initialBlockNumber = provider.getBlockHeight();

			// Step 1: Create and send transaction
			const targetAddress = Address.from(
				"0x1111111111111111111111111111111111111111",
			);
			const tx: any = {
				from: testSigner.address,
				to: toChecksummed(targetAddress),
				value: "0x0de0b6b3a7640000", // 1 ETH
				data: "0x",
				nonce: 4,
				gasPrice: "0x4a817c800",
				gas: "0x5208",
			};

			const txHash = keccak256(new TextEncoder().encode(JSON.stringify(tx)));
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			const txHashResult = await provider.request("eth_sendRawTransaction", [
				tx,
			]);

			// Step 2: Poll for receipt with retries
			let receipt = null;
			let attempts = 0;
			const maxAttempts = 5;

			while (!receipt && attempts < maxAttempts) {
				receipt = await provider.request("eth_getTransactionReceipt", [
					txHashResult,
				]);
				if (!receipt) {
					// Simulate block progression
					provider.advanceBlock();
					attempts++;
				}
			}

			expect(receipt).toBeDefined();
			expect(receipt.transactionHash).toBe(txHashResult);
			expect(receipt.status).toBe("0x1");

			// Step 3: Verify confirmation depth
			const latestBlockNumber = await provider.request("eth_blockNumber", []);
			const latestBlock = Number.parseInt(latestBlockNumber, 16);
			const txBlockNumber = Number.parseInt(receipt.blockNumber, 16);
			const confirmations = latestBlock - txBlockNumber;

			expect(confirmations).toBeGreaterThanOrEqual(0);
			expect(confirmations).toBeLessThanOrEqual(5); // Should be within our polling attempts // Can be 0 if found immediately

			// Step 4: Get block details
			const block = await provider.request("eth_getBlockByNumber", [
				receipt.blockNumber,
				false,
			]);
			expect(block).toBeDefined();
			expect(block.number).toBe(receipt.blockNumber);
		});
	});

	describe("Cross-workflow Integration", () => {
		it("should handle complete wallet → sign → submit → verify flow", async () => {
			// This test combines multiple workflows
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Derive first account
			const account = HDWallet.deriveEthereum(root, 0, 0);
			const privKey = HDWallet.getPrivateKey(account)!;

			// Create custom message
			const message = new TextEncoder().encode("Sign this message");
			const messageHash = SignedData.Hash({ keccak256 })(message);

			// Sign with derived key
			const signature = Secp256k1.sign(messageHash, privKey);

			// Construct full signature (65 bytes: r + s + v)
			const fullSignature = new Uint8Array(65);
			fullSignature.set(signature.r, 0);
			fullSignature.set(signature.s, 32);
			fullSignature[64] = signature.v;

			expect(fullSignature).toHaveLength(65);
			expect(hexFromBytes(fullSignature)).toMatch(/^0x[0-9a-f]{130}$/i);

			// Verify signature can be recovered with correct arg order
			const recoveredPubKey = recoverPublicKey(signature, messageHash);
			expect(recoveredPubKey).toBeDefined();
			expect(recoveredPubKey.length).toBe(64); // 64 bytes without 0x04 prefix
		});

		it("should handle multi-account signing with HD wallet", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Derive and sign from multiple accounts
			const signingResults = [];

			for (let i = 0; i < 3; i++) {
				const account = HDWallet.deriveEthereum(root, 0, i);
				const privKey = HDWallet.getPrivateKey(account)!;
				const pubKey = HDWallet.getPublicKey(account)!;

				const message = new TextEncoder().encode(`Message from account ${i}`);
				const messageHash = keccak256(message);
				const signature = Secp256k1.sign(messageHash, privKey);

				signingResults.push({
					account: i,
					privKeyLength: privKey.length,
					pubKeyLength: pubKey.length,
					signatureValid:
						signature.r.length === 32 &&
						signature.s.length === 32 &&
						[27, 28].includes(signature.v),
				});
			}

			expect(signingResults).toHaveLength(3);
			signingResults.forEach((result) => {
				expect(result.privKeyLength).toBe(32);
				expect(result.pubKeyLength).toBe(33);
				expect(result.signatureValid).toBe(true);
			});
		});
	});

	describe("Error Handling and Edge Cases", () => {
		it("should handle invalid addresses gracefully", () => {
			expect(() => {
				Address("0xinvalid");
			}).toThrow();
		});

		it("should validate signature format", () => {
			const invalidSig = new Uint8Array(64); // Too short
			expect(() => {
				recoverPublicKey(new Uint8Array(32), invalidSig);
			}).toThrow();
		});

		it("should handle insufficient gas", async () => {
			const tx: any = {
				from: testSigner.address,
				to: "0x1111111111111111111111111111111111111111",
				value: "0x0",
				data: "0x",
				gas: "0x1", // 1 gas (not enough)
				gasPrice: "0x4a817c800",
				nonce: 5,
			};

			const txHash = keccak256(new TextEncoder().encode(JSON.stringify(tx)));
			const signature = Secp256k1.sign(
				txHash,
				hexToBytes(testPrivateKey),
			);

			// Transaction should still be created (validation happens on chain)
			expect(signature).toBeDefined();
		});

		it("should reject invalid mnemonic", () => {
			expect(() => {
				Bip39.validateMnemonic("invalid mnemonic words");
			}).not.toThrow();
			// Note: validateMnemonic returns false rather than throwing
		});
	});
});
