import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const BALANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const singleNoKeys = AccessList.from([{ address: usdc, storageKeys: [] }]);
const cost1 = AccessList.gasCost(singleNoKeys);
const savings1 = AccessList.gasSavings(singleNoKeys);
const singleOneKey = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE] },
]);
const cost2 = AccessList.gasCost(singleOneKey);
const savings2 = AccessList.gasSavings(singleOneKey);
const singleTwoKeys = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
]);
const cost3 = AccessList.gasCost(singleTwoKeys);
const savings3 = AccessList.gasSavings(singleTwoKeys);
const dai = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const multiKeys = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE] },
	{ address: weth, storageKeys: [BALANCE] },
]);
const cost4 = AccessList.gasCost(multiKeys);
const savings4 = AccessList.gasSavings(multiKeys);

// Calculate break-even point
const addressOnlyCost = AccessList.ADDRESS_COST;
const addressOnlySavings =
	AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST;
const keyOnlyCost = AccessList.STORAGE_KEY_COST;
const keyOnlySavings =
	AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST;
