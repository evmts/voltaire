import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Uniswap V2 swap access list optimization
// Complex multi-contract interaction example

console.log("Uniswap V2 Swap Access List\n");

// Uniswap V2 contracts
const router = Address.from("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
const factory = Address.from("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const pair = Address.from("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"); // USDC-WETH

// Storage slots for Uniswap V2
const BALANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const RESERVE0_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);
const RESERVE1_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000009",
);
const TOTAL_SUPPLY_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

// swapExactTokensForTokens: USDC -> WETH
console.log("Operation: swapExactTokensForTokens");
console.log("Path: USDC -> WETH\n");

// Build comprehensive access list
const swapAccessList = AccessList.from([
	// Router: orchestrates swap
	{
		address: router,
		storageKeys: [],
	},
	// USDC: transfer from user to pair
	{
		address: usdc,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT],
	},
	// WETH: transfer from pair to user
	{
		address: weth,
		storageKeys: [BALANCE_SLOT],
	},
	// Pair: reserves + swap logic
	{
		address: pair,
		storageKeys: [RESERVE0_SLOT, RESERVE1_SLOT, BALANCE_SLOT],
	},
]);

console.log("Access list summary:");
console.log("Contracts:", AccessList.addressCount(swapAccessList));
console.log("Storage slots:", AccessList.storageKeyCount(swapAccessList));

// Verify all contracts included
console.log("\nContract inclusion:");
console.log("Router:", AccessList.includesAddress(swapAccessList, router));
console.log("USDC:", AccessList.includesAddress(swapAccessList, usdc));
console.log("WETH:", AccessList.includesAddress(swapAccessList, weth));
console.log("Pair:", AccessList.includesAddress(swapAccessList, pair));

// Show storage keys per contract
console.log("\nStorage keys per contract:");
console.log("Router:", AccessList.keysFor(swapAccessList, router).length);
console.log("USDC:", AccessList.keysFor(swapAccessList, usdc).length);
console.log("WETH:", AccessList.keysFor(swapAccessList, weth).length);
console.log("Pair:", AccessList.keysFor(swapAccessList, pair).length);

// Gas analysis
console.log("\nGas analysis:");
console.log("Access list cost:", AccessList.gasCost(swapAccessList), "gas");
console.log("Expected savings:", AccessList.gasSavings(swapAccessList), "gas");
console.log(
	"Net benefit:",
	AccessList.gasSavings(swapAccessList) - AccessList.gasCost(swapAccessList),
	"gas",
);

// Compare to simple token transfer
const simpleTransfer = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE_SLOT] },
]);

console.log("\nComplexity comparison:");
console.log(
	"Simple transfer:",
	AccessList.addressCount(simpleTransfer),
	"contracts,",
	AccessList.storageKeyCount(simpleTransfer),
	"slots",
);
console.log(
	"Uniswap swap:",
	AccessList.addressCount(swapAccessList),
	"contracts,",
	AccessList.storageKeyCount(swapAccessList),
	"slots",
);
console.log(
	"Savings multiplier:",
	(
		Number(AccessList.gasSavings(swapAccessList)) /
		Number(AccessList.gasSavings(simpleTransfer))
	).toFixed(2) + "x",
);

// Build incrementally
console.log("\n7. Incremental access list building:");
let incrementalList = AccessList.create();
console.log("Start empty:", AccessList.isEmpty(incrementalList));

incrementalList = AccessList.withAddress(incrementalList, router, []);
console.log("Added router");

incrementalList = AccessList.withAddress(incrementalList, usdc, [
	BALANCE_SLOT,
	ALLOWANCE_SLOT,
]);
console.log("Added USDC");

incrementalList = AccessList.withAddress(incrementalList, weth, [BALANCE_SLOT]);
console.log("Added WETH");

incrementalList = AccessList.withAddress(incrementalList, pair, [
	RESERVE0_SLOT,
	RESERVE1_SLOT,
]);
console.log("Added pair");

console.log("Final:", incrementalList);
console.log(
	"Matches target?",
	JSON.stringify(incrementalList) === JSON.stringify(swapAccessList),
);
