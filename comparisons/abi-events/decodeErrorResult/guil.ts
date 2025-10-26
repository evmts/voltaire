// Guil does not implement event/error encoding utilities
// Use viem as fallback
import { decodeErrorResult } from "viem";

const abi = [
	{
		type: "error",
		name: "InsufficientBalance",
		inputs: [
			{ name: "available", type: "uint256" },
			{ name: "required", type: "uint256" },
		],
	},
] as const;

const errorData =
	"0xcf47918100000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000064";

export function main(): void {
	const decoded = decodeErrorResult({
		abi,
		data: errorData,
	});
}
