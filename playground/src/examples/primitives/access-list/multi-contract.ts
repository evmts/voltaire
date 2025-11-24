import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Multi-contract interaction access list
// Shows complex DeFi scenarios with multiple protocols

console.log("Multi-Contract Access List Example\n");

// DeFi protocols
const aavePool = Address.from("0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9");
const uniswapRouter = Address.from(
	"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
);
const curvePool = Address.from("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7");
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdt = Address.from("0xdAC17F958D2ee523a2206206994597C13D831ec7");

// Storage slots
const BALANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const RESERVES = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);

// Scenario 1: Flash loan + DEX arbitrage
console.log("Scenario 1: Flash loan arbitrage");
const flashLoanArbitrage = AccessList.from([
	{ address: aavePool, storageKeys: [BALANCE] },
	{ address: uniswapRouter, storageKeys: [] },
	{ address: curvePool, storageKeys: [RESERVES] },
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE, ALLOWANCE] },
]);

console.log("Contracts involved:", AccessList.addressCount(flashLoanArbitrage));
console.log("Storage slots:", AccessList.storageKeyCount(flashLoanArbitrage));
console.log("Gas cost:", AccessList.gasCost(flashLoanArbitrage));
console.log("Gas savings:", AccessList.gasSavings(flashLoanArbitrage));

// Scenario 2: Multi-hop swap
console.log("\nScenario 2: Multi-hop swap (USDC -> DAI -> USDT)");
const multiHopSwap = AccessList.from([
	{ address: uniswapRouter, storageKeys: [] },
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
]);

console.log("Hop count: 2");
console.log("Contracts:", AccessList.addressCount(multiHopSwap));
console.log("Gas cost:", AccessList.gasCost(multiHopSwap));

// Merge multiple access lists
console.log("\nScenario 3: Merging access lists");
const list1 = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE] },
	{ address: dai, storageKeys: [BALANCE] },
]);

const list2 = AccessList.from([
	{ address: usdc, storageKeys: [ALLOWANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
]);

const merged = AccessList.merge(list1, list2);
console.log("List 1:", list1);
console.log("List 2:", list2);
console.log("Merged:", merged);
console.log("Total addresses:", AccessList.addressCount(merged));
console.log("Total storage keys:", AccessList.storageKeyCount(merged));

// Deduplicate access list
console.log("\nScenario 4: Deduplication");
const withDuplicates = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE, BALANCE] }, // Duplicate key
	{ address: usdc, storageKeys: [ALLOWANCE] }, // Duplicate address
	{ address: dai, storageKeys: [BALANCE] },
]);

console.log("With duplicates:", withDuplicates);
console.log("Storage keys before:", AccessList.storageKeyCount(withDuplicates));

const deduplicated = AccessList.deduplicate(withDuplicates);
console.log("Deduplicated:", deduplicated);
console.log("Storage keys after:", AccessList.storageKeyCount(deduplicated));

// Complex aggregation scenario
console.log("\nScenario 5: DEX aggregator (1inch style)");
const protocols = [
	{ address: uniswapRouter, storageKeys: [] },
	{ address: curvePool, storageKeys: [RESERVES] },
	{ address: aavePool, storageKeys: [] },
];

const tokens = [
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
];

const aggregatorList = AccessList.from([...protocols, ...tokens]);
console.log("Total contracts:", AccessList.addressCount(aggregatorList));
console.log("Protocol contracts:", protocols.length);
console.log("Token contracts:", tokens.length);
console.log("Total storage keys:", AccessList.storageKeyCount(aggregatorList));
console.log("Gas cost:", AccessList.gasCost(aggregatorList));
console.log("Gas savings:", AccessList.gasSavings(aggregatorList));
console.log(
	"Net benefit:",
	AccessList.gasSavings(aggregatorList) - AccessList.gasCost(aggregatorList),
);
