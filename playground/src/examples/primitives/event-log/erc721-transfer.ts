import { Address, EventLog, Hash, Bytes } from "@tevm/voltaire";
// Event signature: keccak256("Transfer(address,address,uint256)")
// Same as ERC20, but tokenId is indexed
const TRANSFER_SIGNATURE = Hash(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);

// Bored Ape Yacht Club (BAYC) NFT transfer
const baycAddress = Address("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d");

// Transfer from original owner to new owner
const fromAddress = Hash(
	"0x000000000000000000000000a858ddc0445d8131dac4d1de01f834ffcba52ef1",
);
const toAddress = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);

// Token ID #8817 (all three parameters are indexed in ERC721)
const tokenId = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000002271",
);

const transferLog = EventLog.create({
	address: baycAddress,
	topics: [TRANSFER_SIGNATURE, fromAddress, toAddress, tokenId],
	data: Bytes.zero(0), // Empty data - all params are indexed
	blockNumber: 18700000n,
	transactionHash: Hash(
		"0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
	),
	logIndex: 7,
});

const signature = EventLog.getTopic0(transferLog);

const [from, to, token] = EventLog.getIndexedTopics(transferLog);

// Extract token ID as number
const tokenIdView = new DataView(token?.buffer);
const tokenIdNum = tokenIdView.getBigUint64(24, false);

const zeroAddress = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000000",
);

// Mint (from zero address)
const isMint = EventLog.matchesTopics(transferLog, [
	TRANSFER_SIGNATURE,
	zeroAddress,
	null,
	null,
]);

// Burn (to zero address)
const isBurn = EventLog.matchesTopics(transferLog, [
	TRANSFER_SIGNATURE,
	null,
	zeroAddress,
	null,
]);

// Regular transfer (neither mint nor burn)
const isTransfer =
	!isMint &&
	!isBurn &&
	EventLog.matchesTopics(transferLog, [TRANSFER_SIGNATURE, null, null, null]);

const user1 = Hash(
	"0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
);
const user2 = Hash(
	"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
);
const user3 = Hash(
	"0x0000000000000000000000005aaed59320b9eb3cd462ddbaefa21da757f30fbd",
);

const tokenId1 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const tokenId2 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);
const tokenId3 = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000003",
);

const transfers = [
	EventLog.create({
		address: baycAddress,
		topics: [TRANSFER_SIGNATURE, zeroAddress, user1, tokenId1],
		data: Bytes.zero(0),
		blockNumber: 18700000n,
	}), // Mint to user1
	EventLog.create({
		address: baycAddress,
		topics: [TRANSFER_SIGNATURE, user1, user2, tokenId1],
		data: Bytes.zero(0),
		blockNumber: 18700010n,
	}), // Transfer user1 -> user2
	EventLog.create({
		address: baycAddress,
		topics: [TRANSFER_SIGNATURE, zeroAddress, user2, tokenId2],
		data: Bytes.zero(0),
		blockNumber: 18700020n,
	}), // Mint to user2
	EventLog.create({
		address: baycAddress,
		topics: [TRANSFER_SIGNATURE, user2, user3, tokenId2],
		data: Bytes.zero(0),
		blockNumber: 18700030n,
	}), // Transfer user2 -> user3
	EventLog.create({
		address: baycAddress,
		topics: [TRANSFER_SIGNATURE, user2, zeroAddress, tokenId1],
		data: Bytes.zero(0),
		blockNumber: 18700040n,
	}), // Burn by user2
];

// Find all mints
const mints = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, zeroAddress, null, null],
});

// Find all burns
const burns = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, null, zeroAddress, null],
});

// Find all transfers involving user2 (sent or received)
const user2Sent = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, user2, null, null],
});
const user2Received = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, null, user2, null],
});

// Track specific token
const token1History = EventLog.filterLogs(transfers, {
	topics: [TRANSFER_SIGNATURE, null, null, tokenId1],
});
const sorted = EventLog.sortLogs(transfers);
sorted.forEach((log, i) => {
	const [f, t, tid] = EventLog.getIndexedTopics(log);
	const fromStr =
		f?.toHex() ===
		"0x0000000000000000000000000000000000000000000000000000000000000000"
			? "MINT"
			: f?.toHex().slice(0, 10);
	const toStr =
		t?.toHex() ===
		"0x0000000000000000000000000000000000000000000000000000000000000000"
			? "BURN"
			: t?.toHex().slice(0, 10);
	const tidView = new DataView(tid?.buffer);
	const tidNum = tidView.getBigUint64(24, false);
});
