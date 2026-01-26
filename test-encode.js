import { encode } from './src/primitives/Abi/encode.js';

const testAbi = [
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool" }],
	},
];

const to = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const amount = 1000000000000000000n;

const encoded = encode.call(testAbi, "transfer", [to, amount]);

// Convert to hex string
const hex = '0x' + Array.from(encoded).map(b => b.toString(16).padStart(2, '0')).join('');

console.log(hex);
