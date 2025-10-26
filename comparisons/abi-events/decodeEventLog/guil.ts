// Guil does not implement event/error encoding utilities
// Use viem as fallback
import { decodeEventLog } from "viem";

const abi = [
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

const data =
	"0x0000000000000000000000000000000000000000000000000000000000000064";
const topics = [
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	"0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
	"0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
] as const;

export function main(): void {
	const decoded = decodeEventLog({ abi, data, topics });
}
