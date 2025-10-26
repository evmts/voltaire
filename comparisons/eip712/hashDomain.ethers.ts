import { TypedDataEncoder } from "ethers";

const domain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

export function main(): void {
	TypedDataEncoder.hashDomain(domain);
}
