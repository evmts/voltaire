import { Block, BlockBody, BlockHash, BlockHeader, Bytes } from "@tevm/voltaire";
const block19426587 = Block({
	header: BlockHeader({
		parentHash:
			"0x8e5a0c5b4a8c6e9f1d2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
		ommersHash:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		beneficiary: "0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326",
		stateRoot:
			"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
		transactionsRoot:
			"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
		receiptsRoot:
			"0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
		logsBloom: Bytes.zero(256),
		difficulty: 0n,
		number: 19426587n,
		gasLimit: 30000000n,
		gasUsed: 14623891n,
		timestamp: 1710338455n,
		extraData: Bytes.zero(0),
		mixHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		nonce: Bytes.zero(8),
		baseFeePerGas: 12345678900n,
		withdrawalsRoot:
			"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
		blobGasUsed: 393216n, // 3 blobs
		excessBlobGas: 131072n,
		parentBeaconBlockRoot:
			"0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
	}),
	body: BlockBody({
		transactions: [],
		ommers: [],
	}),
	hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	size: 45678n,
});
const block17034870 = Block({
	header: BlockHeader({
		parentHash:
			"0x7e6a9b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
		ommersHash:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		beneficiary: "0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990",
		stateRoot:
			"0xf7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
		transactionsRoot:
			"0xa8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",
		receiptsRoot:
			"0xb9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0",
		logsBloom: Bytes.zero(256),
		difficulty: 0n,
		number: 17034870n,
		gasLimit: 30000000n,
		gasUsed: 15789234n,
		timestamp: 1681338455n,
		extraData: Bytes.zero(0),
		mixHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		nonce: Bytes.zero(8),
		baseFeePerGas: 23456789000n,
		withdrawalsRoot:
			"0xc0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
	}),
	body: BlockBody({
		transactions: [],
		ommers: [],
	}),
	hash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
	size: 38234n,
});
const block15537394 = Block({
	header: BlockHeader({
		parentHash:
			"0x6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
		ommersHash:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
		stateRoot:
			"0xe8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
		transactionsRoot:
			"0xf9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
		receiptsRoot:
			"0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
		logsBloom: Bytes.zero(256),
		difficulty: 0n, // First block with 0 difficulty
		number: 15537394n,
		gasLimit: 30000000n,
		gasUsed: 11234567n,
		timestamp: 1663224179n,
		extraData: Bytes.zero(0),
		mixHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		nonce: Bytes.zero(8),
		baseFeePerGas: 34567890000n,
	}),
	body: BlockBody({
		transactions: [],
		ommers: [],
	}),
	hash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
	size: 35678n,
});
const block12965000 = Block({
	header: BlockHeader({
		parentHash:
			"0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
		ommersHash:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		beneficiary: "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8",
		stateRoot:
			"0xd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
		transactionsRoot:
			"0xe8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
		receiptsRoot:
			"0xf9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
		logsBloom: Bytes.zero(256),
		difficulty: 7500000000000000n, // PoW difficulty
		number: 12965000n,
		gasLimit: 30000000n,
		gasUsed: 9876543n,
		timestamp: 1628166822n,
		extraData: Bytes.zero(0),
		mixHash:
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		nonce: Bytes.repeat(0xaa, 8),
		baseFeePerGas: 1000000000n, // First block with base fee (1 gwei)
	}),
	body: BlockBody({
		transactions: [],
		ommers: [],
	}),
	hash: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
	size: 32456n,
	totalDifficulty: 58750003716598352816469n,
});
