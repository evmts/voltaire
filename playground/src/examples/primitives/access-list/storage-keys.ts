import { AccessList, Address, Hash } from "@tevm/voltaire";

const token = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC

// ERC-20 storage layout
const BALANCE_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const TOTAL_SUPPLY_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);
const OWNER_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000004",
);
let list = AccessList([{ address: token, storageKeys: [] }]);
list = AccessList.withStorageKey(list, token, BALANCE_SLOT);
list = AccessList.withStorageKey(list, token, ALLOWANCE_SLOT);
list = AccessList([
	{
		address: token,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT, TOTAL_SUPPLY_SLOT, OWNER_SLOT],
	},
]);

// Non-existent key
const randomSlot = Hash(
	"0x9999999999999999999999999999999999999999999999999999999999999999",
);
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

const multiList = AccessList([
	{ address: usdc, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
	{ address: dai, storageKeys: [BALANCE_SLOT] },
	{ address: weth, storageKeys: [] },
]);
const oneKey = AccessList([{ address: token, storageKeys: [BALANCE_SLOT] }]);
const twoKeys = AccessList([
	{ address: token, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
]);
const threeKeys = AccessList([
	{
		address: token,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT, TOTAL_SUPPLY_SLOT],
	},
]);
