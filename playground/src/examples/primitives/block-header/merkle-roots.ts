import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

const header = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x00),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347", // Keccak256 of RLP([])
	beneficiary: "0x0000000000000000000000000000000000000000",
	stateRoot:
		"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544", // Example state root
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421", // Empty txs root
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421", // Empty receipts root
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 1000000n,
	gasLimit: 30000000n,
	gasUsed: 0n,
	timestamp: 1234567890n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 1000000000n,
});

// Post-Shanghai: withdrawalsRoot
const shanghaiHeader = BlockHeader.from({
	...header,
	withdrawalsRoot:
		"0x9a3d5e3e8f3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d3e5f7a3b5c8d",
});
