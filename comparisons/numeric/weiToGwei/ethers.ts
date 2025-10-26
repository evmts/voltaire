import { formatUnits } from "ethers";

// Test data covering various wei amounts
const testWei1 = 1000000000n; // 1 Gwei in wei
const testWei2 = 50000000000n; // 50 Gwei in wei (common gas price)
const testWei3 = 100000000000n; // 100 Gwei in wei
const testWei4 = 1000000000000n; // 1000 Gwei in wei (high gas)
const testWei5 = 1000000000000000000n; // 1 ether in wei
const testWei6 = 25000000000n; // 25 Gwei in wei
const testWei7 = 200000000000n; // 200 Gwei in wei
const testWei8 = 0n; // Zero wei

// Helper function to convert wei to gwei using ethers
// ethers returns string, but for consistency we parse to bigint
function weiToGwei(wei: bigint): bigint {
	const gwei = formatUnits(wei, "gwei");
	return BigInt(Math.floor(parseFloat(gwei)));
}

export function main(): void {
	weiToGwei(testWei1);
	weiToGwei(testWei2);
	weiToGwei(testWei3);
	weiToGwei(testWei4);
	weiToGwei(testWei5);
	weiToGwei(testWei6);
	weiToGwei(testWei7);
	weiToGwei(testWei8);
}
