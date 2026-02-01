import { BeaconBlockRoot, BlockHeader, Bytes, Bytes32 } from "@tevm/voltaire";
// Example: EIP-4788 beacon root in transaction context

// The beacon root is exposed via a system contract at:
// BEACON_ROOTS_ADDRESS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02

// Block with beacon root (Cancun+)
const cancunBlock = BlockHeader({
	parentHash: Bytes32.zero().fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x02),
	transactionsRoot: Bytes32.zero().fill(0x03),
	receiptsRoot: Bytes32.zero().fill(0x04),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426587n, // Cancun activation block
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1710338135n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 25000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x05),
	blobGasUsed: 262144n,
	excessBlobGas: 0n,
	parentBeaconBlockRoot: Bytes32.zero().fill(0xaa), // EIP-4788
});

// Extract the beacon root
const beaconRoot = BeaconBlockRoot(
	cancunBlock.parentBeaconBlockRoot as Uint8Array,
);

// How to access beacon roots in Solidity:
const solidityExample = `
// Read beacon root for a specific timestamp
function getBeaconRoot(uint256 timestamp) external view returns (bytes32) {
    address beaconRoots = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;
    (bool success, bytes memory data) = beaconRoots.staticcall(
        abi.encode(timestamp)
    );
    require(success, "Beacon root not found");
    return abi.decode(data, (bytes32));
}

// Example: Verify validator withdrawal
function verifyWithdrawal(
    uint256 blockTimestamp,
    bytes32[] calldata proof,
    bytes calldata withdrawal
) external view returns (bool) {
    bytes32 root = getBeaconRoot(blockTimestamp);
    return MerkleProof.verify(proof, root, keccak256(withdrawal));
}
`;
