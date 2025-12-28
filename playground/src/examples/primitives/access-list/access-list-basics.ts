import { AccessList, Address, Hash } from "voltaire";

// AccessList basics: EIP-2930 transaction access lists
// Access lists pre-declare addresses and storage keys for gas savings

// Empty access list
const empty = AccessList.create();

// Create from single address (no storage keys)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const listWithAddress = AccessList.from([{ address: addr, storageKeys: [] }]);

// Create with storage keys
const tokenAddr = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC
const balanceSlot = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const allowanceSlot = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

const listWithKeys = AccessList.from([
	{
		address: tokenAddr,
		storageKeys: [balanceSlot, allowanceSlot],
	},
]);

// Multi-address access list
const uniswapRouter = Address.from(
	"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
);
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const multiList = AccessList.from([
	{ address: uniswapRouter, storageKeys: [balanceSlot] },
	{ address: weth, storageKeys: [] },
]);

// Gas cost calculation
const gasCost = AccessList.gasCost(multiList);

// Gas savings calculation
const savings = AccessList.gasSavings(multiList);

// Get keys for address
const keysForRouter = AccessList.keysFor(multiList, uniswapRouter);
