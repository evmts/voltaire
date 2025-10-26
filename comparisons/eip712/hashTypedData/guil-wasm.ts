import { hashTypedData } from "../../../wasm/crypto/eip712.js";

type Hex = `0x${string}`;
type Address = `0x${string}`;

interface TypedDataDomain {
	name?: string;
	version?: string;
	chainId?: number;
	verifyingContract?: Address;
	salt?: Hex;
}

interface TypedDataField {
	name: string;
	type: string;
}

interface TypedData {
	types: Record<string, TypedDataField[]>;
	primaryType: string;
	domain: TypedDataDomain;
	message: Record<string, unknown>;
}

const domain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
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

const typedData: TypedData = {
	types,
	primaryType: "Person",
	domain,
	message,
};

export function main(): void {
	hashTypedData(typedData);
}
