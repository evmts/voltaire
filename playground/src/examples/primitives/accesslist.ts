import { AccessList, Address, Bytes, Bytes32, Hash } from "@tevm/voltaire";

// === Creating Access Lists ===
// Single address, no storage keys
const simpleList = AccessList.from([
	{
		address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [],
	},
]);

// Address with storage keys
const withStorage = AccessList.from([
	{
		address: Address("0xdead000000000000000000000000000000000001"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			),
		],
	},
]);

// Multiple addresses
const multiAddress = AccessList.from([
	{
		address: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			),
		],
	},
	{
		address: Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
		storageKeys: [
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000005",
			),
			Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000006",
			),
		],
	},
]);

// === Common ERC-20 Storage Slots ===
// balanceOf slot for address
const holderAddress = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const balanceSlot = 0n; // ERC-20 balances typically at slot 0

// For demonstration, using placeholder storage key
const storageKey = Hash(
	"0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
);

const erc20AccessList = AccessList.from([
	{
		address: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
		storageKeys: [storageKey],
	},
]);

// === Access List Serialization ===
const serialized = AccessList.toBytes(multiAddress);

// === Gas Estimation ===
// Access list gas costs (EIP-2930):
// - 2400 gas per address
// - 1900 gas per storage key
const addrCount = AccessList.addressCount(multiAddress);
const keyCount = AccessList.storageKeyCount(multiAddress);
const accessListGas = BigInt(addrCount) * AccessList.ADDRESS_COST + BigInt(keyCount) * AccessList.STORAGE_KEY_COST;

// Use built-in gasCost function
const totalGasCost = AccessList.gasCost(multiAddress);

// === Empty Access List ===
const emptyList = AccessList.create();
const isEmpty = AccessList.isEmpty(emptyList);

// === Merging Access Lists ===
const merged = AccessList.merge(simpleList, withStorage);
