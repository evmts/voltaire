import { AccessList, Address, Hash } from "@tevm/voltaire";

// Common ERC-20 tokens
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdt = Address("0xdAC17F958D2ee523a2206206994597C13D831ec7");

// ERC-20 storage layout (simplified)
const BALANCE_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const TOTAL_SUPPLY_SLOT = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);
const transferList = AccessList([
	{
		address: usdc,
		storageKeys: [BALANCE_SLOT], // Sender & recipient balances
	},
]);
const transferFromList = AccessList([
	{
		address: dai,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT],
	},
]);
const approveList = AccessList([
	{
		address: usdt,
		storageKeys: [ALLOWANCE_SLOT],
	},
]);
const swapList = AccessList([
	{ address: usdc, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
	{ address: dai, storageKeys: [BALANCE_SLOT] },
]);
const tokens = [usdc, dai, usdt];
const multiTokenList = AccessList(
	tokens.map((token) => ({
		address: token,
		storageKeys: [BALANCE_SLOT],
	})),
);
let evolving = AccessList([{ address: usdc, storageKeys: [] }]);

evolving = AccessList.withStorageKey(evolving, usdc, BALANCE_SLOT);

evolving = AccessList.withStorageKey(evolving, usdc, ALLOWANCE_SLOT);
