import { Address, Bytes, Bytes32, Hex, Transaction } from "@tevm/voltaire";

// === Legacy Transaction (Type 0) ===
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: Bytes.zero(0),
	v: 27n,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// === EIP-2930 Transaction (Type 1) - Access List ===
const eip2930: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 1n,
	gasPrice: 25_000_000_000n,
	gasLimit: 50_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: Hex.toBytes("0xa9059cbb"), // transfer selector
	accessList: [
		{
			address: Address("0xdead000000000000000000000000000000000001"),
			storageKeys: [],
		},
	],
	yParity: 0,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// === EIP-1559 Transaction (Type 2) - Dynamic Fees ===
const eip1559: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 2n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 100_000_000_000n, // 100 gwei max
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 500_000_000_000_000_000n, // 0.5 ETH
	data: Bytes.zero(0),
	accessList: [],
	yParity: 1,
	r: Bytes32.zero(),
	s: Bytes32.zero(),
};

// === Serialization ===
const serializedLegacy = Transaction.serialize(legacy);
const serializedEip1559 = Transaction.serialize(eip1559);

// === Type Detection ===
const detectedLegacy = Transaction.detectType(serializedLegacy);
const detectedEip1559 = Transaction.detectType(serializedEip1559);

// === Deserialization ===
const parsedLegacy = Transaction.deserialize(serializedLegacy);
const parsedEip1559 = Transaction.deserialize(serializedEip1559);

// === Contract Creation (to = null) ===
const deployment: Transaction.EIP1559 = {
	...eip1559,
	to: null, // Contract creation
	data: Hex.toBytes("0x6080604052"), // Contract bytecode
	gasLimit: 1_000_000n,
};
