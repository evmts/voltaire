import { BlockHash, Bytes } from "@tevm/voltaire";
// From hex string (with 0x prefix)
const hash1 = BlockHash(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

// From hex without prefix
const hash2 = BlockHash.fromHex(
	"88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);

// From bytes
const hashBytes = Bytes([
	0x1d, 0xcc, 0x4d, 0xe8, 0xde, 0xc7, 0x5d, 0x7a, 0xab, 0x85, 0xb5, 0x67, 0xb6,
	0xcc, 0xd4, 0x1a, 0xd3, 0x12, 0x45, 0x1b, 0x94, 0x8a, 0x74, 0x13, 0xf0, 0xa1,
	0x42, 0xfd, 0x40, 0xd4, 0x93, 0x47,
]);
const hash3 = BlockHash.fromBytes(hashBytes);
const genesis = BlockHash(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

// The DAO Hard Fork block
const daoFork = BlockHash(
	"0x4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb",
);

// The Merge (Paris upgrade)
const merge = BlockHash(
	"0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
);
const hashA = BlockHash(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);
const hashB = BlockHash(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);
const hashC = BlockHash(
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);
