// Legacy Transaction: Create and serialize Legacy (Type 0) transaction
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create a Legacy transaction (original Ethereum transaction type)
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21_000n, // Standard ETH transfer
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH in wei
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("Transaction type:", legacy.type);
console.log("Nonce:", legacy.nonce);
console.log("Gas price:", legacy.gasPrice);
console.log("Gas limit:", legacy.gasLimit);
console.log("To:", Hex.fromBytes(legacy.to!));
console.log("Value (wei):", legacy.value);

// Serialize to bytes
const serialized = Transaction.serialize(legacy);
console.log("Serialized length:", serialized.length, "bytes");
console.log(
	"Serialized:",
	Hex.fromBytes(serialized).toString().slice(0, 40) + "...",
);
