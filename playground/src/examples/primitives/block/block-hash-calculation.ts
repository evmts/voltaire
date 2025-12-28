import { BlockHash, BlockHeader, Hash } from "voltaire";
const header = BlockHeader.from({
	parentHash:
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x05a56E2D52c817161883f50c441c3228CFe54d9f",
	stateRoot:
		"0xd67e4d450343046425ae4271474353857ab860dbc0a1dde64b41b5cd3a532bf3",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: new Uint8Array(256),
	difficulty: 17171480576n,
	number: 1n,
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438269988n,
	extraData: new Uint8Array(32),
	mixHash: "0x969b900de27b6ac6a67742365dd65f55a0526c41fd18e1b16f1a1215c2e66f59",
	nonce: new Uint8Array(8).fill(0x53),
});

// The expected block hash for block 1 on mainnet
const expectedHash = BlockHash.from(
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);
const modifiedHeader = BlockHeader.from({
	parentHash:
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x05a56E2D52c817161883f50c441c3228CFe54d9f",
	stateRoot:
		"0xd67e4d450343046425ae4271474353857ab860dbc0a1dde64b41b5cd3a532bf3",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: new Uint8Array(256),
	difficulty: 17171480576n,
	number: 2n, // Changed from 1 to 2
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438269988n,
	extraData: new Uint8Array(32),
	mixHash: "0x969b900de27b6ac6a67742365dd65f55a0526c41fd18e1b16f1a1215c2e66f59",
	nonce: new Uint8Array(8).fill(0x53),
});
