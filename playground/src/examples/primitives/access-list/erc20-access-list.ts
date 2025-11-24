import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// ERC-20 token transfer access list optimization
// Shows optimal access list for common token operations

console.log("ERC-20 Access List Optimization\n");

// Common ERC-20 tokens
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdt = Address.from("0xdAC17F958D2ee523a2206206994597C13D831ec7");

// ERC-20 storage layout (simplified)
const BALANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const TOTAL_SUPPLY_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

// Simple transfer: A -> B
console.log("1. Simple transfer(address to, uint256 amount)");
const transferList = AccessList.from([
	{
		address: usdc,
		storageKeys: [BALANCE_SLOT], // Sender & recipient balances
	},
]);
console.log("Access list:", transferList);
console.log("Gas cost:", AccessList.gasCost(transferList));
console.log("Gas savings:", AccessList.gasSavings(transferList));

// transferFrom: requires allowance check
console.log("\n2. transferFrom(address from, address to, uint256 amount)");
const transferFromList = AccessList.from([
	{
		address: dai,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT],
	},
]);
console.log("Access list:", transferFromList);
console.log("Gas cost:", AccessList.gasCost(transferFromList));
console.log("Gas savings:", AccessList.gasSavings(transferFromList));

// approve: set allowance
console.log("\n3. approve(address spender, uint256 amount)");
const approveList = AccessList.from([
	{
		address: usdt,
		storageKeys: [ALLOWANCE_SLOT],
	},
]);
console.log("Access list:", approveList);
console.log("Gas cost:", AccessList.gasCost(approveList));
console.log("Gas savings:", AccessList.gasSavings(approveList));

// Multi-token operation (e.g., DEX aggregator)
console.log("\n4. Multi-token swap (USDC -> DAI)");
const swapList = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
	{ address: dai, storageKeys: [BALANCE_SLOT] },
]);
console.log("Access list:", swapList);
console.log("Gas cost:", AccessList.gasCost(swapList));
console.log("Gas savings:", AccessList.gasSavings(swapList));

// Build dynamically
console.log("\n5. Dynamic access list builder");
const tokens = [usdc, dai, usdt];
const multiTokenList = AccessList.from(
	tokens.map((token) => ({
		address: token,
		storageKeys: [BALANCE_SLOT],
	})),
);
console.log("Tokens:", AccessList.addressCount(multiTokenList));
console.log("Total gas cost:", AccessList.gasCost(multiTokenList));
console.log("Total savings:", AccessList.gasSavings(multiTokenList));
console.log("Beneficial?", AccessList.hasSavings(multiTokenList));

// Add storage key to existing list
console.log("\n6. Adding storage keys");
let evolving = AccessList.from([{ address: usdc, storageKeys: [] }]);
console.log("Initial:", evolving);

evolving = AccessList.withStorageKey(evolving, usdc, BALANCE_SLOT);
console.log("Added balance slot:", evolving);

evolving = AccessList.withStorageKey(evolving, usdc, ALLOWANCE_SLOT);
console.log("Added allowance slot:", evolving);
console.log("Final gas cost:", AccessList.gasCost(evolving));
