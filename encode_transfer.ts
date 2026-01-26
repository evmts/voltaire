import { Abi, Address, Hex } from "./src/index.js";

// Define ERC20 transfer ABI
const abi = Abi([
	{
		name: "transfer",
		type: "function",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
	},
]);

// Parameters
const recipient = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const amount = 1000000000000000000n;

// Encode the function call
const calldata = abi.encode("transfer", [recipient, amount]);

// Output hex calldata
console.log(Hex.fromBytes(calldata));
