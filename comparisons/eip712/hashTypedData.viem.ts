import { hashTypedData } from "viem";

const domain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
} as const;

const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
} as const;

const message = {
	name: "Alice",
	wallet: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
} as const;

export function main(): void {
	hashTypedData({
		domain,
		types,
		primaryType: "Person",
		message,
	});
}
