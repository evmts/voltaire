import { encodeEventTopics } from "viem";

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

const from = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const to = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

export function main(): void {
	const topics = encodeEventTopics({
		abi,
		eventName: "Transfer",
		args: { from, to },
	});
}
