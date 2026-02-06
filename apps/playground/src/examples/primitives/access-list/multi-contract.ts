import { AccessList, Address, Hash } from "@tevm/voltaire";

// DeFi protocols
const aavePool = Address("0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9");
const uniswapRouter = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
const curvePool = Address("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7");
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const dai = Address("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdt = Address("0xdAC17F958D2ee523a2206206994597C13D831ec7");

// Storage slots
const BALANCE = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const RESERVES = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);
const flashLoanArbitrage = AccessList([
	{ address: aavePool, storageKeys: [BALANCE] },
	{ address: uniswapRouter, storageKeys: [] },
	{ address: curvePool, storageKeys: [RESERVES] },
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE, ALLOWANCE] },
]);
const multiHopSwap = AccessList([
	{ address: uniswapRouter, storageKeys: [] },
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
]);
const list1 = AccessList([
	{ address: usdc, storageKeys: [BALANCE] },
	{ address: dai, storageKeys: [BALANCE] },
]);

const list2 = AccessList([
	{ address: usdc, storageKeys: [ALLOWANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
]);

const merged = AccessList.merge(list1, list2);
const withDuplicates = AccessList([
	{ address: usdc, storageKeys: [BALANCE, BALANCE] }, // Duplicate key
	{ address: usdc, storageKeys: [ALLOWANCE] }, // Duplicate address
	{ address: dai, storageKeys: [BALANCE] },
]);

const deduplicated = AccessList.deduplicate(withDuplicates);
const protocols = [
	{ address: uniswapRouter, storageKeys: [] },
	{ address: curvePool, storageKeys: [RESERVES] },
	{ address: aavePool, storageKeys: [] },
];

const tokens = [
	{ address: usdc, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: dai, storageKeys: [BALANCE, ALLOWANCE] },
	{ address: usdt, storageKeys: [BALANCE] },
];

const aggregatorList = AccessList([...protocols, ...tokens]);
