import {
	AccessList,
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

// Example: USDC contract with storage slots we'll access
const usdcAddress = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

// Storage slot calculation for mappings:
// slot(balances[address]) = keccak256(address . slot_number)
// where . is concatenation and slot_number is the mapping's slot

const balanceSlot = 9n; // balances mapping is at slot 9 in USDC

// Calculate storage slot for a specific address's balance
function calculateMappingSlot(
	address: Uint8Array,
	mappingSlot: bigint,
): Uint8Array {
	// Create key: address (32 bytes padded) + slot (32 bytes)
	const key = new Uint8Array(64);
	key.set(address, 12); // Pad address to 32 bytes

	// Encode slot as 32 bytes big-endian
	let slot = mappingSlot;
	for (let i = 63; i >= 32 && slot > 0n; i--) {
		key[i] = Number(slot & 0xffn);
		slot >>= 8n;
	}

	return Keccak256.hash(key);
}

// Calculate balance slot for sender
const senderPrivateKey = Secp256k1.randomPrivateKey();
const senderPublicKey = Secp256k1.derivePublicKey(senderPrivateKey);
const senderAddress = Address.fromPublicKey(senderPublicKey);

const senderBalanceSlot = calculateMappingSlot(senderAddress, balanceSlot);
const recipientAddress = Address.fromHex(
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const recipientBalanceSlot = calculateMappingSlot(
	recipientAddress,
	balanceSlot,
);

// Create access list entry
const usdcAccessEntry = {
	address: usdcAddress,
	storageKeys: [senderBalanceSlot, recipientBalanceSlot],
};

// Example: DEX swap accessing multiple contracts
const uniswapRouter = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
);
const wethAddress = Address.fromHex(
	"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
);
const poolAddress = Address.fromHex(
	"0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640", // USDC/WETH pool
);

// Common pool storage slots
const slot0 = new Uint8Array(32); // Slot 0: sqrtPriceX96, tick
const liquiditySlot = new Uint8Array(32);
liquiditySlot[31] = 4; // Slot 4: liquidity

const multiContractAccessList: Transaction.AccessList = [
	{
		address: usdcAddress,
		storageKeys: [senderBalanceSlot],
	},
	{
		address: wethAddress,
		storageKeys: [calculateMappingSlot(poolAddress, 3n)], // WETH balance of pool
	},
	{
		address: poolAddress,
		storageKeys: [slot0, liquiditySlot],
	},
];
for (const entry of multiContractAccessList) {
	for (const key of entry.storageKeys) {
	}
}

// Gas costs
const COLD_ACCOUNT_ACCESS = 2600n;
const WARM_ACCOUNT_ACCESS = 100n;
const COLD_SLOAD = 2100n;
const WARM_SLOAD = 100n;

// Access list calldata costs
const ACCESS_LIST_ADDRESS_COST = 2400n; // Per address in list
const ACCESS_LIST_STORAGE_COST = 1900n; // Per storage key

function calculateGasSavings(accessList: Transaction.AccessList) {
	let totalAddresses = 0;
	let totalStorageKeys = 0;

	for (const entry of accessList) {
		totalAddresses++;
		totalStorageKeys += entry.storageKeys.length;
	}

	// Gas saved by warming addresses and slots
	const savingsFromAddresses =
		BigInt(totalAddresses) * (COLD_ACCOUNT_ACCESS - WARM_ACCOUNT_ACCESS);
	const savingsFromStorage =
		BigInt(totalStorageKeys) * (COLD_SLOAD - WARM_SLOAD);
	const totalSavings = savingsFromAddresses + savingsFromStorage;

	// Cost of access list in calldata
	const accessListCost =
		BigInt(totalAddresses) * ACCESS_LIST_ADDRESS_COST +
		BigInt(totalStorageKeys) * ACCESS_LIST_STORAGE_COST;

	const netSavings = totalSavings - accessListCost;

	return {
		totalAddresses,
		totalStorageKeys,
		grossSavings: totalSavings,
		accessListCost,
		netSavings,
	};
}

const savings = calculateGasSavings(multiContractAccessList);

// EIP-1559 transaction with access list
const txWithAccessList: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 200_000n,
	to: uniswapRouter,
	value: 0n,
	data: new Uint8Array(100), // Swap calldata
	accessList: multiContractAccessList,
};

// Sign and serialize
const signingHash = Transaction.getSigningHash(txWithAccessList);
const signature = Secp256k1.sign(signingHash, senderPrivateKey);

const signedTx: Transaction.EIP1559 = {
	...txWithAccessList,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

const serialized = Transaction.serialize(signedTx);

// Compare to transaction without access list
const txWithoutAccessList: Transaction.EIP1559 = {
	...txWithAccessList,
	accessList: [],
};

const serializedWithout = Transaction.serialize({
	...txWithoutAccessList,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
});
const erc20TransferAccessList: Transaction.AccessList = [
	{
		address: usdcAddress, // Token contract
		storageKeys: [
			senderBalanceSlot, // sender's balance
			recipientBalanceSlot, // recipient's balance
		],
	},
];
const allowanceSlot = 10n; // allowances mapping slot
const spenderAddress = uniswapRouter;
const allowanceKey = Keccak256.hash(
	new Uint8Array([
		...new Uint8Array(12),
		...senderAddress,
		...new Uint8Array(12),
		...spenderAddress,
	]),
);

const erc20TransferFromAccessList: Transaction.AccessList = [
	{
		address: usdcAddress,
		storageKeys: [senderBalanceSlot, recipientBalanceSlot, allowanceKey],
	},
];
const uniswapAccessList: Transaction.AccessList = [
	{
		address: usdcAddress,
		storageKeys: [calculateMappingSlot(poolAddress, balanceSlot)],
	},
	{
		address: wethAddress,
		storageKeys: [calculateMappingSlot(poolAddress, 3n)],
	},
	{
		address: poolAddress,
		storageKeys: [
			slot0, // sqrtPriceX96, tick
			liquiditySlot, // liquidity
		],
	},
];
const nftContract = Address.fromHex(
	"0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
);
const tokenId = 1234n;
const ownerSlot = 2n; // _owners mapping
const tokenIdBytes = new Uint8Array(32);
let tid = tokenId;
for (let i = 31; i >= 0 && tid > 0n; i--) {
	tokenIdBytes[i] = Number(tid & 0xffn);
	tid >>= 8n;
}
const ownerStorageKey = Keccak256.hash(
	new Uint8Array([
		...tokenIdBytes,
		...new Uint8Array(30),
		0,
		Number(ownerSlot),
	]),
);

const nftAccessList: Transaction.AccessList = [
	{
		address: nftContract,
		storageKeys: [ownerStorageKey],
	},
];

// Helper to create access list from traces
function buildAccessList(
	traces: Array<{
		address: Uint8Array;
		storageKeys: Uint8Array[];
	}>,
): Transaction.AccessList {
	const addressMap = new Map<string, Set<string>>();

	for (const trace of traces) {
		const addrHex = Hex.fromBytes(trace.address);
		if (!addressMap.has(addrHex)) {
			addressMap.set(addrHex, new Set());
		}
		for (const key of trace.storageKeys) {
			addressMap.get(addrHex)?.add(Hex.fromBytes(key));
		}
	}

	const accessList: Transaction.AccessList = [];
	for (const [addrHex, keys] of addressMap) {
		const storageKeys: Uint8Array[] = [];
		for (const keyHex of keys) {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = Number.parseInt(keyHex.slice(2 + i * 2, 4 + i * 2), 16);
			}
			storageKeys.push(bytes);
		}
		accessList.push({
			address: Address.fromHex(addrHex),
			storageKeys,
		});
	}

	return accessList;
}

// Example usage
const traceResults = [
	{
		address: usdcAddress,
		storageKeys: [senderBalanceSlot, recipientBalanceSlot],
	},
	{ address: poolAddress, storageKeys: [slot0] },
];

const generatedAccessList = buildAccessList(traceResults);
