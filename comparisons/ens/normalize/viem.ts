import { normalize } from "viem/ens";

const testData = "Vitalik.eth";

export function main(): void {
	normalize(testData);
}
