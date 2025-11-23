// Transaction Serialization: RLP encode/decode transactions
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create EIP-1559 transaction
const tx: Transaction.EIP1559 = {
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

console.log("Original transaction type:", tx.type);
console.log("Original nonce:", tx.nonce);

// Serialize to RLP encoded bytes
const serialized = Transaction.serialize(tx);
console.log("Serialized length:", serialized.length, "bytes");
console.log(
	"Serialized (hex):",
	Hex.fromBytes(serialized).toString().slice(0, 60) + "...",
);

// For typed transactions (EIP-2718), format is: [type_byte] + RLP(fields)
console.log("Type byte:", serialized[0]); // Should be 0x02 for EIP-1559

// Deserialize back to transaction
const deserialized = Transaction.deserialize(serialized);
console.log("Deserialized type:", deserialized.type);
console.log("Deserialized nonce:", deserialized.nonce);
console.log("Type matches:", deserialized.type === tx.type);

// Detect transaction type from serialized bytes
const detectedType = Transaction.detectType(serialized);
console.log("Detected type:", detectedType);
