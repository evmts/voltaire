import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
// Transaction Type Detection: Identify transaction type from bytes
import * as Transaction from "../../../primitives/Transaction/index.js";

// Create different transaction types and serialize them
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const eip1559: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Serialize transactions
const legacySerialized = Transaction.serialize(legacy);
const eip1559Serialized = Transaction.serialize(eip1559);

const legacyDetected = Transaction.detectType(legacySerialized);

const eip1559Detected = Transaction.detectType(eip1559Serialized);
