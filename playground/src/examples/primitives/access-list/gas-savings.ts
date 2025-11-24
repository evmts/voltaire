import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Gas savings analysis: with vs without access list
// Shows EIP-2930 optimization benefits

console.log("Gas Savings Analysis: EIP-2930 Access Lists\n");

// Example: Uniswap V2 swap (USDC -> WETH)
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const uniswapRouter = Address.from(
	"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
);
const pair = Address.from("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"); // USDC-WETH pair

// Storage slots accessed during swap
const reserve0 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);
const reserve1 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000009",
);
const balance = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const allowance = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Create access list
const accessList = AccessList.from([
	{ address: usdc, storageKeys: [balance, allowance] },
	{ address: weth, storageKeys: [balance] },
	{ address: uniswapRouter, storageKeys: [] },
	{ address: pair, storageKeys: [reserve0, reserve1] },
]);

console.log("Scenario: Uniswap V2 USDC -> WETH swap");
console.log("Contracts accessed:", AccessList.addressCount(accessList));
console.log("Storage slots accessed:", AccessList.storageKeyCount(accessList));

// Without access list (cold access)
const coldAccountCost = AccessList.COLD_ACCOUNT_ACCESS_COST;
const coldStorageCost = AccessList.COLD_STORAGE_ACCESS_COST;
const withoutAccessList =
	BigInt(AccessList.addressCount(accessList)) * coldAccountCost +
	BigInt(AccessList.storageKeyCount(accessList)) * coldStorageCost;

console.log("\nWithout access list (cold access):");
console.log(
	"Account access:",
	AccessList.addressCount(accessList),
	"x",
	coldAccountCost,
	"=",
	BigInt(AccessList.addressCount(accessList)) * coldAccountCost,
);
console.log(
	"Storage access:",
	AccessList.storageKeyCount(accessList),
	"x",
	coldStorageCost,
	"=",
	BigInt(AccessList.storageKeyCount(accessList)) * coldStorageCost,
);
console.log("Total:", withoutAccessList, "gas");

// With access list (warm access)
const addressCost = AccessList.ADDRESS_COST;
const storageCost = AccessList.STORAGE_KEY_COST;
const warmCost = AccessList.WARM_STORAGE_ACCESS_COST;
const withAccessList =
	AccessList.gasCost(accessList) +
	BigInt(AccessList.addressCount(accessList)) * warmCost +
	BigInt(AccessList.storageKeyCount(accessList)) * warmCost;

console.log("\nWith access list (warm access):");
console.log("Access list cost:", AccessList.gasCost(accessList), "gas");
console.log(
	"Account access:",
	AccessList.addressCount(accessList),
	"x",
	warmCost,
	"=",
	BigInt(AccessList.addressCount(accessList)) * warmCost,
);
console.log(
	"Storage access:",
	AccessList.storageKeyCount(accessList),
	"x",
	warmCost,
	"=",
	BigInt(AccessList.storageKeyCount(accessList)) * warmCost,
);
console.log("Total:", withAccessList, "gas");

// Calculate savings
const savings = AccessList.gasSavings(accessList);
console.log("\nGas savings:", savings, "gas");
console.log(
	"Percentage saved:",
	((Number(savings) / Number(withoutAccessList)) * 100).toFixed(2),
	"%",
);
console.log("Worth using?", AccessList.hasSavings(accessList) ? "YES" : "NO");

// Break-even analysis
console.log("\nBreak-even analysis:");
console.log("Cost per address:", addressCost, "gas");
console.log("Savings per address:", coldAccountCost - addressCost, "gas");
console.log("Cost per storage key:", storageCost, "gas");
console.log("Savings per storage key:", coldStorageCost - storageCost, "gas");
console.log("\nAccess lists beneficial when:");
console.log("- Multiple storage slots accessed per address");
console.log("- Multiple addresses accessed in transaction");
