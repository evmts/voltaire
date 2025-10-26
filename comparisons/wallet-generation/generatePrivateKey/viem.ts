import { generatePrivateKey } from "viem/accounts";

export function main(): string {
	return generatePrivateKey();
}
