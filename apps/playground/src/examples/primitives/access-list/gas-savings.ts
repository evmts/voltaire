import { AccessList, Address, Hash } from "@tevm/voltaire";

// Example: Uniswap V2 swap (USDC -> WETH)
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const uniswapRouter = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
const pair = Address("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"); // USDC-WETH pair

// Storage slots accessed during swap
const reserve0 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);
const reserve1 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000009",
);
const balance = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const allowance = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Create access list
const accessList = AccessList([
	{ address: usdc, storageKeys: [balance, allowance] },
	{ address: weth, storageKeys: [balance] },
	{ address: uniswapRouter, storageKeys: [] },
	{ address: pair, storageKeys: [reserve0, reserve1] },
]);

// Without access list (cold access)
const coldAccountCost = AccessList.COLD_ACCOUNT_ACCESS_COST;
const coldStorageCost = AccessList.COLD_STORAGE_ACCESS_COST;
const withoutAccessList =
	BigInt(AccessList.addressCount(accessList)) * coldAccountCost +
	BigInt(AccessList.storageKeyCount(accessList)) * coldStorageCost;

// With access list (warm access)
const addressCost = AccessList.ADDRESS_COST;
const storageCost = AccessList.STORAGE_KEY_COST;
const warmCost = AccessList.WARM_STORAGE_ACCESS_COST;
const withAccessList =
	AccessList.gasCost(accessList) +
	BigInt(AccessList.addressCount(accessList)) * warmCost +
	BigInt(AccessList.storageKeyCount(accessList)) * warmCost;

// Calculate savings
const savings = AccessList.gasSavings(accessList);
