import * as AccessList from "voltaire/primitives/AccessList";
import * as Address from "voltaire/primitives/Address";
import * as Hash from "voltaire/primitives/Hash";

// AccessList basics: EIP-2930 transaction access lists
// Access lists pre-declare addresses and storage keys for gas savings

// Empty access list
const empty = AccessList.create();
console.log("Empty access list:", empty);
console.log("Is empty?", AccessList.isEmpty(empty));

// Create from single address (no storage keys)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const listWithAddress = AccessList.from([{ address: addr, storageKeys: [] }]);
console.log("\nSingle address access list:", listWithAddress);
console.log("Address count:", AccessList.addressCount(listWithAddress));

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
console.log("\nWith storage keys:", listWithKeys);
console.log("Storage key count:", AccessList.storageKeyCount(listWithKeys));

// Multi-address access list
const uniswapRouter = Address.from(
	"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
);
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const multiList = AccessList.from([
	{ address: uniswapRouter, storageKeys: [balanceSlot] },
	{ address: weth, storageKeys: [] },
]);
console.log("\nMulti-address list:", multiList);

// Gas cost calculation
const gasCost = AccessList.gasCost(multiList);
console.log("\nAccess list gas cost:", gasCost, "gas");
console.log("Address cost:", AccessList.ADDRESS_COST, "per address");
console.log("Storage key cost:", AccessList.STORAGE_KEY_COST, "per key");

// Gas savings calculation
const savings = AccessList.gasSavings(multiList);
console.log("\nEstimated gas savings:", savings, "gas");
console.log("Has savings?", AccessList.hasSavings(multiList));

// Checking inclusion
console.log(
	"\nIncludes USDC?",
	AccessList.includesAddress(multiList, tokenAddr),
);
console.log(
	"Includes Uniswap?",
	AccessList.includesAddress(multiList, uniswapRouter),
);
console.log(
	"Includes balance slot for Uniswap?",
	AccessList.includesStorageKey(multiList, uniswapRouter, balanceSlot),
);

// Get keys for address
const keysForRouter = AccessList.keysFor(multiList, uniswapRouter);
console.log("\nStorage keys for Uniswap router:", keysForRouter);
