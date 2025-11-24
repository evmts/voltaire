import * as Address from "../../../primitives/Address/index.js";
import * as BlockHash from "../../../primitives/BlockHash/index.js";
import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
const preMergeHeader = BlockHeader.from({
	parentHash:
		"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8", // Miner address
	stateRoot:
		"0xe6e49996c7ec59f7a23d22b83239a60151512c65613bf84a0d7da336399ebc4a",
	transactionsRoot:
		"0x578f087d49e0db8d577c28edd5e19bc7e7bac8f9d8db87f11aede4ce1f8dfa13",
	receiptsRoot:
		"0x9e75c4c8cf9b8e97b85b6f0e3e2be8fc61f5ea6d5c1c90f7e48e6d0c3d2e1f0a",
	logsBloom: new Uint8Array(256),
	difficulty: 2n ** 40n, // ~1.1 trillion
	number: 15537393n, // Pre-merge block
	gasLimit: 30000000n,
	gasUsed: 12456789n,
	timestamp: 1663224179n, // September 15, 2022
	extraData: new TextEncoder().encode("Mined with love"),
	mixHash: "0x7c3e9b6e4a1f2d8c5b3a6f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a",
	nonce: new Uint8Array(8).fill(0x42),
});
const postMergeHeader = BlockHeader.from({
	parentHash:
		"0xf2e5d8a1b3c4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", // Fee recipient
	stateRoot:
		"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
	transactionsRoot:
		"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
	receiptsRoot:
		"0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
	logsBloom: new Uint8Array(256),
	difficulty: 0n, // Zero difficulty post-merge
	number: 15537394n, // First post-merge block
	gasLimit: 30000000n,
	gasUsed: 15234567n,
	timestamp: 1663224191n,
	extraData: new Uint8Array(0),
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: new Uint8Array(8), // Zero nonce post-merge
	baseFeePerGas: 15000000000n, // EIP-1559: 15 gwei
});
const shanghaiHeader = BlockHeader.from({
	parentHash:
		"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990",
	stateRoot:
		"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
	transactionsRoot:
		"0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
	receiptsRoot:
		"0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 17034870n, // Post-Shanghai
	gasLimit: 30000000n,
	gasUsed: 18345678n,
	timestamp: 1681338455n, // April 2023
	extraData: new Uint8Array(0),
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n,
	withdrawalsRoot:
		"0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8", // Shanghai: withdrawals
});
const cancunHeader = BlockHeader.from({
	parentHash:
		"0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
	stateRoot:
		"0xc2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
	transactionsRoot:
		"0xd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
	receiptsRoot:
		"0xe4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 19426587n, // Post-Cancun
	gasLimit: 30000000n,
	gasUsed: 14567890n,
	timestamp: 1710338455n, // March 2024
	extraData: new Uint8Array(0),
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: new Uint8Array(8),
	baseFeePerGas: 12000000000n,
	withdrawalsRoot:
		"0xf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6",
	blobGasUsed: 262144n, // EIP-4844: blob gas (2 blobs)
	excessBlobGas: 131072n, // EIP-4844: excess blob gas
	parentBeaconBlockRoot:
		"0xa6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7", // EIP-4788
});
