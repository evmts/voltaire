import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// Uniswap V2 contracts
const router = Address.from("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
const factory = Address.from("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const pair = Address.from("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"); // USDC-WETH

// Storage slots for Uniswap V2
const BALANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const ALLOWANCE_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const RESERVE0_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000008",
);
const RESERVE1_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000009",
);
const TOTAL_SUPPLY_SLOT = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

// Build comprehensive access list
const swapAccessList = AccessList.from([
	// Router: orchestrates swap
	{
		address: router,
		storageKeys: [],
	},
	// USDC: transfer from user to pair
	{
		address: usdc,
		storageKeys: [BALANCE_SLOT, ALLOWANCE_SLOT],
	},
	// WETH: transfer from pair to user
	{
		address: weth,
		storageKeys: [BALANCE_SLOT],
	},
	// Pair: reserves + swap logic
	{
		address: pair,
		storageKeys: [RESERVE0_SLOT, RESERVE1_SLOT, BALANCE_SLOT],
	},
]);

// Compare to simple token transfer
const simpleTransfer = AccessList.from([
	{ address: usdc, storageKeys: [BALANCE_SLOT] },
]);
let incrementalList = AccessList.create();

incrementalList = AccessList.withAddress(incrementalList, router, []);

incrementalList = AccessList.withAddress(incrementalList, usdc, [
	BALANCE_SLOT,
	ALLOWANCE_SLOT,
]);

incrementalList = AccessList.withAddress(incrementalList, weth, [BALANCE_SLOT]);

incrementalList = AccessList.withAddress(incrementalList, pair, [
	RESERVE0_SLOT,
	RESERVE1_SLOT,
]);
