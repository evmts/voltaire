import { TypedDataEncoder } from "ethers";

const domain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

const types = {
	Person: [
		{ name: "name", type: "string" },
		{ name: "wallet", type: "address" },
	],
};

const message = {
	name: "Alice",
	wallet: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

export function main(): void {
	TypedDataEncoder.hash(domain, types, message);
}
