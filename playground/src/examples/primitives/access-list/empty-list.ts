import { AccessList, Address } from "voltaire";

// Create empty list
const empty = AccessList.create();
const txWithEmpty = {
	type: 1, // EIP-2930
	chainId: 1,
	nonce: 42,
	gasPrice: 50000000000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1000000000000000000n, // 1 ETH
	data: "0x",
	accessList: empty, // Empty but present
};
let list = AccessList.create();

const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
list = AccessList.withAddress(list, usdc, []);
const populated = AccessList.from([{ address: usdc, storageKeys: [] }]);
const list1 = AccessList.from([{ address: usdc, storageKeys: [] }]);
const merged = AccessList.merge(empty, list1);

const mergedReverse = AccessList.merge(list1, empty);
try {
	AccessList.assertValid(empty);
} catch (error) {}
