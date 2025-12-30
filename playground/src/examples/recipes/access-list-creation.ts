import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
	AccessList,
} from "@tevm/voltaire";

// === Access List Creation Recipe ===
// This recipe demonstrates how to create and optimize access lists
// for EIP-2930 and EIP-1559 transactions to save gas

console.log("=== Access List Creation Recipe ===\n");

// === Step 1: Understanding access lists ===
console.log("Step 1: Understanding Access Lists");
console.log("-".repeat(50));

console.log(`
Access lists (EIP-2930) declare storage slots that will be accessed.
This provides gas savings by:
1. Reducing "cold" storage access costs (2100 -> 100 gas)
2. Reducing "cold" account access costs (2600 -> 100 gas)

Trade-off: Each access list entry adds calldata cost.
Use access lists when gas savings exceed calldata costs.
`);

// === Step 2: Create basic access list ===
console.log("\n\nStep 2: Create Basic Access List");
console.log("-".repeat(50));

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
const recipientBalanceSlot = calculateMappingSlot(recipientAddress, balanceSlot);

console.log("Storage slot calculation for ERC-20 balances:");
console.log(`\nContract: USDC (${Address.toChecksummed(usdcAddress)})`);
console.log(`Balances mapping slot: ${balanceSlot}`);
console.log(`\nSender: ${Address.toChecksummed(senderAddress)}`);
console.log(`Sender balance slot: ${Hex.fromBytes(senderBalanceSlot)}`);
console.log(`\nRecipient: ${Address.toChecksummed(recipientAddress)}`);
console.log(`Recipient balance slot: ${Hex.fromBytes(recipientBalanceSlot)}`);

// Create access list entry
const usdcAccessEntry = {
	address: usdcAddress,
	storageKeys: [senderBalanceSlot, recipientBalanceSlot],
};

console.log("\n\nBasic Access List Entry:");
console.log(`  Address: ${Address.toChecksummed(usdcAddress)}`);
console.log(`  Storage Keys: 2`);
console.log(`    - ${Hex.fromBytes(senderBalanceSlot)}`);
console.log(`    - ${Hex.fromBytes(recipientBalanceSlot)}`);

// === Step 3: Multi-contract access list ===
console.log("\n\nStep 3: Multi-Contract Access List");
console.log("-".repeat(50));

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

console.log("Multi-Contract Access List (DEX Swap):");
for (const entry of multiContractAccessList) {
	console.log(`\n  Contract: ${Address.toChecksummed(entry.address)}`);
	console.log(`  Storage Keys: ${entry.storageKeys.length}`);
	for (const key of entry.storageKeys) {
		console.log(`    - ${Hex.fromBytes(key as Uint8Array)}`);
	}
}

// === Step 4: Calculate gas savings ===
console.log("\n\nStep 4: Calculate Gas Savings");
console.log("-".repeat(50));

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

console.log("Gas Analysis for Multi-Contract Access List:");
console.log(`  Addresses in list: ${savings.totalAddresses}`);
console.log(`  Storage keys: ${savings.totalStorageKeys}`);
console.log(`\n  Gross savings: ${savings.grossSavings} gas`);
console.log(`    - From addresses: ${BigInt(savings.totalAddresses) * (COLD_ACCOUNT_ACCESS - WARM_ACCOUNT_ACCESS)} gas`);
console.log(`    - From storage: ${BigInt(savings.totalStorageKeys) * (COLD_SLOAD - WARM_SLOAD)} gas`);
console.log(`\n  Access list cost: ${savings.accessListCost} gas`);
console.log(`  Net savings: ${savings.netSavings} gas`);
console.log(`  Worth it: ${savings.netSavings > 0n ? "YES" : "NO"}`);

// === Step 5: Create transaction with access list ===
console.log("\n\nStep 5: Create Transaction with Access List");
console.log("-".repeat(50));

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

console.log("Transaction with access list:");
console.log(`  Type: 2 (EIP-1559)`);
console.log(`  To: ${Address.toChecksummed(uniswapRouter)}`);
console.log(`  Access list entries: ${txWithAccessList.accessList.length}`);

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
console.log(`\nSerialized length: ${serialized.length} bytes`);

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

console.log(`Without access list: ${serializedWithout.length} bytes`);
console.log(`Calldata overhead: ${serialized.length - serializedWithout.length} bytes`);

// === Step 6: Common patterns ===
console.log("\n\n=== Common Access List Patterns ===");
console.log("-".repeat(50));

// Pattern 1: ERC-20 transfer
console.log("\n1. ERC-20 Transfer:");
const erc20TransferAccessList: Transaction.AccessList = [
	{
		address: usdcAddress, // Token contract
		storageKeys: [
			senderBalanceSlot, // sender's balance
			recipientBalanceSlot, // recipient's balance
		],
	},
];
console.log(`   Contract: Token`);
console.log(`   Slots: sender balance, recipient balance`);

// Pattern 2: ERC-20 transferFrom (with allowance)
console.log("\n2. ERC-20 TransferFrom (with approval):");
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
console.log(`   Contract: Token`);
console.log(`   Slots: sender balance, recipient balance, allowance`);

// Pattern 3: Uniswap V3 swap
console.log("\n3. Uniswap V3 Swap:");
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
console.log(`   Contracts: TokenA, TokenB, Pool`);
console.log(`   Slots: pool balances, price, liquidity`);

// Pattern 4: NFT transfer
console.log("\n4. NFT Transfer (ERC-721):");
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
console.log(`   Contract: NFT`);
console.log(`   Slots: owner of tokenId`);

// === Step 7: Best practices ===
console.log("\n\n=== Best Practices ===");
console.log("-".repeat(50));

console.log(`
1. Always simulate transactions first to identify accessed slots
2. Use eth_createAccessList RPC to auto-generate access lists
3. Calculate net gas savings before adding access list
4. Include slots for ALL storage reads, not just writes
5. Account for nested calls (internal contract calls)

When to use access lists:
  - Multiple storage accesses to same contract
  - Accessing 2+ storage slots in a contract
  - Complex DeFi operations (swaps, liquidations)

When to skip access lists:
  - Simple ETH transfers
  - Single storage access
  - Very gas-price sensitive situations
`);

// === Step 8: Programmatic access list generation ===
console.log("\n=== Generating Access Lists Programmatically ===");
console.log("-".repeat(50));

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
			addressMap.get(addrHex)!.add(Hex.fromBytes(key));
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
	{ address: usdcAddress, storageKeys: [senderBalanceSlot, recipientBalanceSlot] },
	{ address: poolAddress, storageKeys: [slot0] },
];

const generatedAccessList = buildAccessList(traceResults);
console.log(`Generated access list from ${traceResults.length} traces`);
console.log(`Total entries: ${generatedAccessList.length}`);

console.log("\n=== Recipe Complete ===");
