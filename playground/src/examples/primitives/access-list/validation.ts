import { AccessList, Address, Hash } from "@tevm/voltaire";

// Valid access list
const validList = AccessList([
	{
		address: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
]);
const item = validList[0];
const empty = AccessList.create();
const noKeys = AccessList([
	{
		address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [],
	},
]);
const multiple = AccessList([
	{
		address: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
	{
		address: Address("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
		storageKeys: [],
	},
]);
try {
	AccessList.assertValid(validList);
} catch (error) {}
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const weth = Address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

const list = AccessList([
	{ address: usdc, storageKeys: [] },
	{ address: dai, storageKeys: [] },
]);
const slot1 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const slot3 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

const listWithKeys = AccessList([
	{ address: usdc, storageKeys: [slot1, slot2] },
]);
const original = AccessList([{ address: usdc, storageKeys: [slot1] }]);
const modified = AccessList.withStorageKey(original, usdc, slot2);
