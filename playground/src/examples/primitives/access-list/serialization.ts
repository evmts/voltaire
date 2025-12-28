import { AccessList, Address, Hash, Hex } from "voltaire";

// Create access list
const usdc = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const weth = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
const slot1 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const slot2 = Hash.from(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

const accessList = AccessList.from([
	{ address: usdc, storageKeys: [slot1, slot2] },
	{ address: weth, storageKeys: [slot1] },
]);
const bytes = AccessList.toBytes(accessList);
const deserialized = AccessList.fromBytes(bytes);
const reserializedBytes = AccessList.toBytes(deserialized);
const empty = AccessList.create();
const emptyBytes = AccessList.toBytes(empty);

const emptyDeserialized = AccessList.fromBytes(emptyBytes);
const singleAddr = AccessList.from([{ address: usdc, storageKeys: [] }]);
const singleBytes = AccessList.toBytes(singleAddr);

const singleDeserialized = AccessList.fromBytes(singleBytes);
const largeList = AccessList.from([
	{ address: usdc, storageKeys: [slot1, slot2] },
	{ address: weth, storageKeys: [slot1, slot2] },
	{
		address: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
		storageKeys: [slot1],
	},
	{
		address: Address.from("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
		storageKeys: [],
	},
]);

const largeBytes = AccessList.toBytes(largeList);

const largeDeserialized = AccessList.fromBytes(largeBytes);
const baselineSize = 20; // Address size
const keySize = 32; // Storage key size
const expectedSize =
	AccessList.addressCount(accessList) * baselineSize +
	AccessList.storageKeyCount(accessList) * keySize;
