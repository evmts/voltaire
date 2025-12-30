import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
	Rlp,
} from "@tevm/voltaire";

// === Transaction Signing Recipe ===
// This recipe demonstrates signing and serializing transactions
// for all major Ethereum transaction types: Legacy, EIP-2930, and EIP-1559

console.log("=== Transaction Signing Recipe ===\n");

// === Step 1: Set up accounts ===
console.log("Step 1: Set up sender and recipient");
console.log("-".repeat(50));

const senderPrivateKey = Secp256k1.randomPrivateKey();
const senderPublicKey = Secp256k1.derivePublicKey(senderPrivateKey);
const senderAddress = Address.fromPublicKey(senderPublicKey);

const recipientAddress = Address.fromHex(
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
);

console.log(`Sender: ${Address.toChecksummed(senderAddress)}`);
console.log(`Recipient: ${Address.toChecksummed(recipientAddress)}`);

// === Step 2: Legacy Transaction (Type 0) ===
console.log("\n\n=== Legacy Transaction (Type 0) ===");
console.log("-".repeat(50));

console.log("Legacy transactions use a fixed gasPrice");
console.log("Signature includes chainId in v (EIP-155)\n");

// Create unsigned legacy transaction
const legacyTx: Transaction.Legacy = {
	type: 0,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21000n, // Standard ETH transfer
	to: recipientAddress,
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: new Uint8Array(0),
	chainId: 1n, // Ethereum Mainnet
};

console.log("Legacy Transaction:");
console.log(`  type: 0 (Legacy)`);
console.log(`  nonce: ${legacyTx.nonce}`);
console.log(`  gasPrice: ${legacyTx.gasPrice / 1_000_000_000n} gwei`);
console.log(`  gasLimit: ${legacyTx.gasLimit}`);
console.log(`  to: ${Address.toChecksummed(recipientAddress)}`);
console.log(`  value: ${legacyTx.value / 1_000_000_000_000_000_000n} ETH`);
console.log(`  chainId: ${legacyTx.chainId}`);

// Get signing hash and sign
const legacySigningHash = Transaction.getSigningHash(legacyTx);
console.log(`\nSigning hash: ${Hex.fromBytes(legacySigningHash)}`);

const legacySignature = Secp256k1.sign(legacySigningHash, senderPrivateKey);

// For legacy EIP-155: v = chainId * 2 + 35 + recoveryId
const legacyV = legacyTx.chainId * 2n + 35n + BigInt(legacySignature.v - 27);

const signedLegacyTx: Transaction.Legacy = {
	...legacyTx,
	r: legacySignature.r,
	s: legacySignature.s,
	v: legacyV,
};

console.log(`\nSignature:`);
console.log(`  r: ${Hex.fromBytes(signedLegacyTx.r)}`);
console.log(`  s: ${Hex.fromBytes(signedLegacyTx.s)}`);
console.log(`  v: ${signedLegacyTx.v}`);

// Serialize
const serializedLegacy = Transaction.serialize(signedLegacyTx);
console.log(`\nSerialized (RLP): ${Hex.fromBytes(serializedLegacy)}`);
console.log(`Length: ${serializedLegacy.length} bytes`);

// Verify
console.log(`\nVerification:`);
console.log(
	`  Signature valid: ${Transaction.verifySignature(signedLegacyTx)}`,
);
const recoveredLegacy = Transaction.getSender(signedLegacyTx);
console.log(`  Recovered sender: ${Address.toChecksummed(recoveredLegacy)}`);

// === Step 3: EIP-2930 Transaction (Type 1) ===
console.log("\n\n=== EIP-2930 Transaction (Type 1) ===");
console.log("-".repeat(50));

console.log("EIP-2930 adds access lists for gas optimization");
console.log("Prefixed with 0x01 type byte\n");

// Access list declares storage slots that will be accessed
const accessList: Transaction.AccessList = [
	{
		address: Address.fromHex("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
		storageKeys: [
			new Uint8Array(32), // Slot 0
		],
	},
];

const eip2930Tx: Transaction.EIP2930 = {
	type: 1,
	chainId: 1n,
	nonce: 1n,
	gasPrice: 20_000_000_000n,
	gasLimit: 50000n,
	to: recipientAddress,
	value: 500_000_000_000_000_000n, // 0.5 ETH
	data: new Uint8Array(0),
	accessList,
};

console.log("EIP-2930 Transaction:");
console.log(`  type: 1 (EIP-2930)`);
console.log(`  chainId: ${eip2930Tx.chainId}`);
console.log(`  nonce: ${eip2930Tx.nonce}`);
console.log(`  gasPrice: ${eip2930Tx.gasPrice / 1_000_000_000n} gwei`);
console.log(`  gasLimit: ${eip2930Tx.gasLimit}`);
console.log(`  accessList: ${accessList.length} entries`);

// Sign EIP-2930 transaction
const eip2930SigningHash = Transaction.getSigningHash(eip2930Tx);
const eip2930Signature = Secp256k1.sign(eip2930SigningHash, senderPrivateKey);

// EIP-2930/1559/4844: v is yParity (0 or 1)
const signedEip2930Tx: Transaction.EIP2930 = {
	...eip2930Tx,
	r: eip2930Signature.r,
	s: eip2930Signature.s,
	v: BigInt(eip2930Signature.v - 27),
};

console.log(`\nSignature (yParity):`);
console.log(`  r: ${Hex.fromBytes(signedEip2930Tx.r)}`);
console.log(`  s: ${Hex.fromBytes(signedEip2930Tx.s)}`);
console.log(`  yParity: ${signedEip2930Tx.v}`);

const serializedEip2930 = Transaction.serialize(signedEip2930Tx);
console.log(`\nSerialized: ${Hex.fromBytes(serializedEip2930)}`);
console.log(`Length: ${serializedEip2930.length} bytes`);
console.log(
	`Type prefix: 0x${serializedEip2930[0].toString(16).padStart(2, "0")}`,
);

// === Step 4: EIP-1559 Transaction (Type 2) ===
console.log("\n\n=== EIP-1559 Transaction (Type 2) ===");
console.log("-".repeat(50));

console.log("EIP-1559 introduces dynamic base fee + priority fee");
console.log("Most common transaction type on Ethereum today\n");

const eip1559Tx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 2n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 100_000_000_000n, // 100 gwei max
	gasLimit: 21000n,
	to: recipientAddress,
	value: 2_000_000_000_000_000_000n, // 2 ETH
	data: new Uint8Array(0),
	accessList: [],
};

console.log("EIP-1559 Transaction:");
console.log(`  type: 2 (EIP-1559)`);
console.log(`  chainId: ${eip1559Tx.chainId}`);
console.log(`  nonce: ${eip1559Tx.nonce}`);
console.log(
	`  maxPriorityFeePerGas: ${eip1559Tx.maxPriorityFeePerGas / 1_000_000_000n} gwei`,
);
console.log(`  maxFeePerGas: ${eip1559Tx.maxFeePerGas / 1_000_000_000n} gwei`);
console.log(`  gasLimit: ${eip1559Tx.gasLimit}`);
console.log(`  value: ${eip1559Tx.value / 1_000_000_000_000_000_000n} ETH`);

// Sign EIP-1559 transaction
const eip1559SigningHash = Transaction.getSigningHash(eip1559Tx);
const eip1559Signature = Secp256k1.sign(eip1559SigningHash, senderPrivateKey);

const signedEip1559Tx: Transaction.EIP1559 = {
	...eip1559Tx,
	r: eip1559Signature.r,
	s: eip1559Signature.s,
	v: BigInt(eip1559Signature.v - 27),
};

console.log(`\nSignature (yParity):`);
console.log(`  r: ${Hex.fromBytes(signedEip1559Tx.r)}`);
console.log(`  s: ${Hex.fromBytes(signedEip1559Tx.s)}`);
console.log(`  yParity: ${signedEip1559Tx.v}`);

const serializedEip1559 = Transaction.serialize(signedEip1559Tx);
console.log(`\nSerialized: ${Hex.fromBytes(serializedEip1559)}`);
console.log(`Length: ${serializedEip1559.length} bytes`);
console.log(
	`Type prefix: 0x${serializedEip1559[0].toString(16).padStart(2, "0")}`,
);

// Verify EIP-1559
console.log(`\nVerification:`);
console.log(
	`  Signature valid: ${Transaction.verifySignature(signedEip1559Tx)}`,
);
const recoveredEip1559 = Transaction.getSender(signedEip1559Tx);
console.log(`  Recovered sender: ${Address.toChecksummed(recoveredEip1559)}`);

// === Step 5: Transaction with data ===
console.log("\n\n=== Transaction with Contract Call Data ===");
console.log("-".repeat(50));

// Example: Calling a contract function
const functionSelector = Keccak256.selector("transfer(address,uint256)");
const callData = new Uint8Array(4 + 32 + 32);
callData.set(functionSelector, 0);
callData.set(recipientAddress, 4 + 12); // Padded address
callData[4 + 63] = 100; // Transfer 100 tokens

const contractCallTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 3n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 100_000n,
	to: Address.fromHex("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
	value: 0n, // No ETH transfer
	data: callData,
	accessList: [],
};

console.log("Contract call transaction:");
console.log(`  to: USDC contract`);
console.log(`  data: ${Hex.fromBytes(callData)}`);
console.log(`  value: 0 (no ETH, just token transfer)`);

// === Step 6: Transaction hash ===
console.log("\n\n=== Transaction Hashes ===");
console.log("-".repeat(50));

// Get transaction hashes (for tracking on block explorers)
const legacyHash = Transaction.hash(signedLegacyTx);
const eip2930Hash = Transaction.hash(signedEip2930Tx);
const eip1559Hash = Transaction.hash(signedEip1559Tx);

console.log("Transaction hashes:");
console.log(`  Legacy: ${Hex.fromBytes(legacyHash)}`);
console.log(`  EIP-2930: ${Hex.fromBytes(eip2930Hash)}`);
console.log(`  EIP-1559: ${Hex.fromBytes(eip1559Hash)}`);

// === Step 7: Transaction properties ===
console.log("\n\n=== Transaction Utility Functions ===");
console.log("-".repeat(50));

console.log("\nEIP-1559 Transaction Properties:");
console.log(`  Is signed: ${Transaction.isSigned(signedEip1559Tx)}`);
console.log(
	`  Is contract creation: ${Transaction.isContractCreation(signedEip1559Tx)}`,
);
console.log(
	`  Is contract call: ${Transaction.isContractCall(signedEip1559Tx)}`,
);
console.log(`  Has access list: ${Transaction.hasAccessList(signedEip1559Tx)}`);
console.log(`  Chain ID: ${Transaction.getChainId(signedEip1559Tx)}`);

// Calculate effective gas price at a given base fee
const baseFee = 30_000_000_000n; // 30 gwei
const effectiveGasPrice = Transaction.getGasPrice(signedEip1559Tx, baseFee);
console.log(
	`  Effective gas price (at 30 gwei base): ${effectiveGasPrice / 1_000_000_000n} gwei`,
);

// === Step 8: Replacing transactions ===
console.log("\n\n=== Transaction Replacement (Speed Up / Cancel) ===");
console.log("-".repeat(50));

// To replace a pending transaction, send new tx with same nonce and higher fees
const replacementTx = Transaction.replaceWith(signedEip1559Tx, {
	bumpPercent: 10, // Increase fees by 10%
});

console.log("Original fees:");
console.log(
	`  maxPriorityFeePerGas: ${signedEip1559Tx.maxPriorityFeePerGas / 1_000_000_000n} gwei`,
);
console.log(
	`  maxFeePerGas: ${signedEip1559Tx.maxFeePerGas / 1_000_000_000n} gwei`,
);

console.log("\nReplacement fees (+10%):");
console.log(
	`  maxPriorityFeePerGas: ${(replacementTx as Transaction.EIP1559).maxPriorityFeePerGas / 1_000_000_000n} gwei`,
);
console.log(
	`  maxFeePerGas: ${(replacementTx as Transaction.EIP1559).maxFeePerGas / 1_000_000_000n} gwei`,
);

// Cancel transaction (replace with 0 value transfer to self)
const cancelTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: signedEip1559Tx.nonce, // Same nonce!
	maxPriorityFeePerGas: signedEip1559Tx.maxPriorityFeePerGas * 2n, // Higher fees
	maxFeePerGas: signedEip1559Tx.maxFeePerGas * 2n,
	gasLimit: 21000n, // Minimum gas
	to: senderAddress, // Send to self
	value: 0n, // No value
	data: new Uint8Array(0),
	accessList: [],
};

console.log("\nCancel transaction pattern:");
console.log(`  to: self (${Address.toChecksummed(senderAddress)})`);
console.log(`  value: 0`);
console.log(`  nonce: ${cancelTx.nonce} (same as original)`);
console.log(`  fees: 2x original`);

// === Step 9: Format transaction ===
console.log("\n\n=== Formatted Transaction ===");
console.log("-".repeat(50));

const formatted = Transaction.format(signedEip1559Tx);
console.log(formatted);

console.log("\n=== Recipe Complete ===");
console.log("\nTransaction type summary:");
console.log("  Type 0 (Legacy): Fixed gasPrice, v = chainId*2+35+recovery");
console.log("  Type 1 (EIP-2930): Access list, 0x01 prefix, yParity");
console.log("  Type 2 (EIP-1559): Base + priority fee, 0x02 prefix, yParity");
console.log("  Type 3 (EIP-4844): Blob transactions (see blob-transaction.ts)");
