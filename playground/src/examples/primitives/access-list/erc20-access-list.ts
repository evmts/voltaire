import { AccessList, Address, Hash } from "voltaire";

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
const transferList = AccessList.from([
	{
		address: usdc,
		storageKeys: [BALANCE_SLOT], // Sender & recipient balances
	},
]);
const transferFromList = AccessList.from([
	{
		address: dai,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT],
	},
]);
const approveList = AccessList.from([
	{
		address: usdt,
		storageKeys: [ALLOWANCE_SLOT],
	},
]);
const swapList = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT] },
	{ address: dai, storageKeys: [BALANCE_SLOT] },
]);
const tokens = [usdc, dai, usdt];
const multiTokenList = AccessList.from(
	tokens.map((token) => ({
		address: token,
		storageKeys: [BALANCE_SLOT],
	})),
);
let evolving = AccessList.from([{ address: usdc, storageKeys: [] }]);

evolving = AccessList.withStorageKey(evolving, usdc, BALANCE_SLOT);

evolving = AccessList.withStorageKey(evolving, usdc, ALLOWANCE_SLOT);
