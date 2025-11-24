import * as BlockHash from "../../../primitives/BlockHash/index.js";

// Genesis Block (Block 0)
const genesis = BlockHash.from(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

// First transaction block
const firstTx = BlockHash.from(
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);

// The DAO Hard Fork (Block 1920000)
const daoFork = BlockHash.from(
	"0x4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb",
);

// Byzantium Hard Fork (Block 4370000)
const byzantium = BlockHash.from(
	"0xa218e2c611f21232d857e3c8cecdcdf1f65f25a4477f98f6f47e4063807f2308",
);

// London Hard Fork - EIP-1559 (Block 12965000)
const london = BlockHash.from(
	"0xc5b540d4e51e04f5ef5f8a4f6f3f8e3e4f3c1e6c8e4c8e7c8e3c7e8c8e4c8e7c",
);

// The Merge - Transition to PoS (Block 15537393)
const merge = BlockHash.from(
	"0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
);

// Shanghai Hard Fork - Withdrawals enabled (Block 17034870)
const shanghai = BlockHash.from(
	"0x7fd3e716abf61c05bb9e999aea19f52d935b5f9c4d8c1c5f5f6f5f8f9f5f6f7f",
);
