import {
	Address,
	Hex,
	Keccak256,
	Rlp,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

const senderPrivateKey = Secp256k1.randomPrivateKey();
const senderPublicKey = Secp256k1.derivePublicKey(senderPrivateKey);
const senderAddress = Address.fromPublicKey(senderPublicKey);

const recipientAddress = Address.fromHex(
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
);

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

// Get signing hash and sign
const legacySigningHash = Transaction.getSigningHash(legacyTx);

const legacySignature = Secp256k1.sign(legacySigningHash, senderPrivateKey);

// For legacy EIP-155: v = chainId * 2 + 35 + recoveryId
const legacyV = legacyTx.chainId * 2n + 35n + BigInt(legacySignature.v - 27);

const signedLegacyTx: Transaction.Legacy = {
	...legacyTx,
	r: legacySignature.r,
	s: legacySignature.s,
	v: legacyV,
};

// Serialize
const serializedLegacy = Transaction.serialize(signedLegacyTx);
const recoveredLegacy = Transaction.getSender(signedLegacyTx);

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

const serializedEip2930 = Transaction.serialize(signedEip2930Tx);

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

// Sign EIP-1559 transaction
const eip1559SigningHash = Transaction.getSigningHash(eip1559Tx);
const eip1559Signature = Secp256k1.sign(eip1559SigningHash, senderPrivateKey);

const signedEip1559Tx: Transaction.EIP1559 = {
	...eip1559Tx,
	r: eip1559Signature.r,
	s: eip1559Signature.s,
	v: BigInt(eip1559Signature.v - 27),
};

const serializedEip1559 = Transaction.serialize(signedEip1559Tx);
const recoveredEip1559 = Transaction.getSender(signedEip1559Tx);

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

// Get transaction hashes (for tracking on block explorers)
const legacyHash = Transaction.hash(signedLegacyTx);
const eip2930Hash = Transaction.hash(signedEip2930Tx);
const eip1559Hash = Transaction.hash(signedEip1559Tx);

// Calculate effective gas price at a given base fee
const baseFee = 30_000_000_000n; // 30 gwei
const effectiveGasPrice = Transaction.getGasPrice(signedEip1559Tx, baseFee);

// To replace a pending transaction, send new tx with same nonce and higher fees
const replacementTx = Transaction.replaceWith(signedEip1559Tx, {
	bumpPercent: 10, // Increase fees by 10%
});

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

const formatted = Transaction.format(signedEip1559Tx);
