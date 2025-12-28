import { BlockHash } from "@tevm/voltaire";
// Mainnet Genesis
const mainnet = BlockHash(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

// Sepolia Testnet Genesis
const sepolia = BlockHash(
	"0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9",
);

// Goerli Testnet Genesis (deprecated but historical)
const goerli = BlockHash(
	"0xbf7e331f7f7c1dd2e05159666b3bf8bc7a8a3a9eb1d518969eab529dd9b88c1a",
);

// Holesky Testnet Genesis
const holesky = BlockHash(
	"0xb5f7f912443c940f21fd611f12828d75b534364ed9e95ca4e307729a4661bde4",
);
const expectedMainnet =
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";
const isValid = BlockHash.equals(mainnet, BlockHash(expectedMainnet));
