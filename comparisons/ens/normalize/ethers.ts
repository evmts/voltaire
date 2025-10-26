import { ensNormalize } from "ethers";

const testData = "Vitalik.eth";

export function main(): void {
	ensNormalize(testData);
}
