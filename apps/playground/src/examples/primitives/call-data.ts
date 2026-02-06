import { CallData, Selector } from "@tevm/voltaire";

// CallData: Transaction input data encoding/decoding
// Used for contract interactions and function calls

// Create from hex string (ERC20 transfer)
const transferData = CallData(
	"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000",
);
console.log("CallData hex:", CallData.toHex(transferData));

// Get function selector (first 4 bytes)
const selector = CallData.getSelector(transferData);
console.log("Selector:", Buffer.from(selector).toString("hex")); // a9059cbb

// Check if calldata matches a selector
const isTransfer = CallData.hasSelector(transferData, "0xa9059cbb");
console.log("Is transfer call:", isTransfer);

// Encode calldata from function signature and params
const encoded = CallData.encode("transfer(address,uint256)", [
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	BigInt("1000000000000000000"), // 1 ETH in wei
]);
console.log("Encoded transfer:", CallData.toHex(encoded));

// Decode calldata back to params
const decoded = CallData.decode(transferData, "transfer(address,uint256)");
console.log("Decoded params:", decoded);

// Validate calldata
console.log("Is valid:", CallData.isValid(transferData));

// Create from bytes
const rawBytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
const fromBytes = CallData.fromBytes(rawBytes);
console.log("From bytes:", CallData.toHex(fromBytes));

// Comparison
const data1 = CallData("0xa9059cbb");
const data2 = CallData("0xa9059cbb");
console.log("CallData equals:", CallData.equals(data1, data2));

// Example: Multicall encoding
const multicallData = CallData.encode(
	"multicall(bytes[])",
	[[
		CallData.encode("approve(address,uint256)", [
			"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
			BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
		]),
		CallData.encode("transfer(address,uint256)", [
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			BigInt("1000000000000000000"),
		]),
	]],
);
console.log("Multicall encoded");
