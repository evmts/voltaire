import { hashDomain } from "../../../native/crypto/eip712.js";

type Address = `0x${string}`;

interface TypedDataDomain {
	name?: string;
	version?: string;
	chainId?: number;
	verifyingContract?: Address;
	salt?: `0x${string}`;
}

const domain: TypedDataDomain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
};

export function main(): void {
	hashDomain(domain);
}
