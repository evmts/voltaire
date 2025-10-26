import { formatEther } from "ethers";

// Test data covering various wei amounts
const testWei1 = 1000000000000000000n; // 1 ETH in wei
const testWei2 = 5000000000000000000n; // 5 ETH in wei
const testWei3 = 100000000000000000000n; // 100 ETH in wei
const testWei4 = 1000000000000000000000n; // 1000 ETH in wei
const testWei5 = 1n; // 1 wei (smallest unit)
const testWei6 = 0n; // Zero wei
const testWei7 = 10000000000000000000n; // 10 ETH in wei
const testWei8 = 999999999999999999n; // Just under 1 ETH

// Helper function to convert wei to ether using ethers
// ethers returns string, but for consistency we parse to bigint
function weiToEther(wei: bigint): bigint {
	const ether = formatEther(wei);
	return BigInt(Math.floor(Number.parseFloat(ether)));
}

export function main(): void {
	weiToEther(testWei1);
	weiToEther(testWei2);
	weiToEther(testWei3);
	weiToEther(testWei4);
	weiToEther(testWei5);
	weiToEther(testWei6);
	weiToEther(testWei7);
	weiToEther(testWei8);
}
