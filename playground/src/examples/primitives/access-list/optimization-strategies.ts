import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Access list optimization strategies
// When access lists save gas vs add overhead

console.log("Access List Optimization Strategies\n");

const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const BALANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Strategy 1: Single address, no storage keys (NOT beneficial)
console.log("Strategy 1: Single address, no storage keys");
const singleNoKeys = AccessList.from([{ address: usdc, storageKeys: [] }]);
const cost1 = AccessList.gasCost(singleNoKeys);
const savings1 = AccessList.gasSavings(singleNoKeys);
console.log("Cost:", cost1);
console.log("Savings:", savings1);
console.log("Net:", savings1 - cost1);
console.log(
	"Beneficial?",
	AccessList.hasSavings(singleNoKeys) && savings1 > cost1 ? "YES" : "NO",
);

// Strategy 2: Single address, one storage key
console.log("\nStrategy 2: Single address, one storage key");
const singleOneKey = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE] },
]);
const cost2 = AccessList.gasCost(singleOneKey);
const savings2 = AccessList.gasSavings(singleOneKey);
console.log("Cost:", cost2);
console.log("Savings:", savings2);
console.log("Net:", savings2 - cost2);
console.log("Beneficial?", savings2 > cost2 ? "YES" : "NO");

// Strategy 3: Single address, two storage keys (BENEFICIAL)
console.log("\nStrategy 3: Single address, two storage keys");
const singleTwoKeys = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
]);
const cost3 = AccessList.gasCost(singleTwoKeys);
const savings3 = AccessList.gasSavings(singleTwoKeys);
console.log("Cost:", cost3);
console.log("Savings:", savings3);
console.log("Net:", savings3 - cost3);
console.log("Beneficial?", savings3 > cost3 ? "YES" : "NO");

// Strategy 4: Multiple addresses with keys (HIGHLY BENEFICIAL)
console.log("\nStrategy 4: Multiple addresses with storage keys");
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const multiKeys = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE] },
	{ address: weth, storageKeys: [BALANCE] },
]);
const cost4 = AccessList.gasCost(multiKeys);
const savings4 = AccessList.gasSavings(multiKeys);
console.log("Cost:", cost4);
console.log("Savings:", savings4);
console.log("Net:", savings4 - cost4);
console.log("Beneficial?", savings4 > cost4 ? "YES" : "NO");

// Break-even analysis
console.log("\n--- Break-Even Analysis ---");
console.log("\nPer address:");
console.log("Cost:", AccessList.ADDRESS_COST);
console.log("Cold access cost:", AccessList.COLD_ACCOUNT_ACCESS_COST);
console.log(
	"Savings:",
	AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST,
);
console.log(
	"Worth it?",
	AccessList.COLD_ACCOUNT_ACCESS_COST > AccessList.ADDRESS_COST ? "YES" : "NO",
);

console.log("\nPer storage key:");
console.log("Cost:", AccessList.STORAGE_KEY_COST);
console.log("Cold access cost:", AccessList.COLD_STORAGE_ACCESS_COST);
console.log(
	"Savings:",
	AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST,
);
console.log(
	"Worth it?",
	AccessList.COLD_STORAGE_ACCESS_COST > AccessList.STORAGE_KEY_COST
		? "YES"
		: "NO",
);

// Optimization rules
console.log("\n--- Optimization Rules ---");
console.log("1. Always beneficial: 2+ storage keys per address");
console.log("2. Marginal: 1 storage key (small net gain)");
console.log("3. Never beneficial: 0 storage keys (net loss)");
console.log("4. Best case: Multiple addresses with multiple keys");
console.log("5. Complex transactions (DeFi): Almost always beneficial");
console.log("6. Simple transfers: Usually not worth it");

// Real-world examples
console.log("\n--- Real-World Recommendations ---");
console.log("\nUSE ACCESS LIST:");
console.log("- Uniswap/Sushiswap swaps (4+ addresses, 5+ keys)");
console.log("- Multi-step DeFi operations");
console.log("- Flash loans with arbitrage");
console.log("- Batch token transfers");
console.log("- Complex contract interactions");

console.log("\nDON'T USE ACCESS LIST:");
console.log("- Simple ETH transfers");
console.log("- Single ERC-20 transfer with no state reads");
console.log("- Contract creation (no prior state)");
console.log("- Single contract call with minimal storage access");

// Calculate break-even point
const addressOnlyCost = AccessList.ADDRESS_COST;
const addressOnlySavings =
	AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST;
const keyOnlyCost = AccessList.STORAGE_KEY_COST;
const keyOnlySavings =
	AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST;

console.log("\n--- Break-Even Calculations ---");
console.log("Address net benefit:", addressOnlySavings, "gas");
console.log("Storage key net benefit:", keyOnlySavings, "gas");
console.log("\nFor single address:");
console.log("- 0 keys: -" + addressOnlyCost + " gas (loss)");
console.log(
	"- 1 key: +" + (addressOnlySavings + keyOnlySavings) + " gas (small gain)",
);
console.log(
	"- 2 keys: +" +
		(addressOnlySavings + keyOnlySavings * 2n) +
		" gas (good gain)",
);
console.log(
	"- 3 keys: +" +
		(addressOnlySavings + keyOnlySavings * 3n) +
		" gas (excellent)",
);
