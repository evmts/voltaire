import { BeaconBlockRoot } from "@tevm/voltaire";
// Example: Using beacon roots to access consensus layer data

// Beacon root from a finalized block
const finalizedRoot = BeaconBlockRoot(
	"0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
);

// Recent root (not yet finalized)
const recentRoot = BeaconBlockRoot(
	"0x3c59dc048e8850243be8079a5c74d079e77c4e3c3a6e8c3a6c8e3c3a6e8c3a6e",
);

// Root for validator withdrawal verification
const withdrawalRoot = BeaconBlockRoot(
	"0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
);

// What consensus data you can prove with beacon roots:
const consensusDataTypes = `
Provable Consensus Layer Data:
├── Validator Information:
│   ├── Public keys (BLS12-381)
│   ├── Balances (Gwei)
│   ├── Effective balance
│   ├── Activation epoch
│   ├── Exit epoch
│   ├── Slashed status
│   └── Withdrawal credentials
├── Chain State:
│   ├── Slot number
│   ├── Epoch number
│   ├── Finalized checkpoint
│   ├── Justified checkpoint
│   └── Current sync committee
├── Execution Payload:
│   ├── Block hash
│   ├── Parent hash
│   ├── State root
│   ├── Receipts root
│   ├── Gas used/limit
│   └── Base fee per gas
└── Attestations & Votes:
    ├── Validator attestations
    ├── Aggregate signatures
    ├── Participation rate
    └── Sync committee votes
`;

// Example Merkle proof verification (pseudocode)
const merkleProofExample = `
// Verify validator withdrawal address
function verifyWithdrawalCredentials(
    bytes32 beaconRoot,
    uint256 validatorIndex,
    address withdrawalAddress,
    bytes32[] calldata proof
) external view returns (bool) {
    // 1. Get beacon root from EIP-4788 contract
    bytes32 root = getBeaconRoot(block.timestamp - 12);
    require(root == beaconRoot, "Root mismatch");

    // 2. Build leaf from validator data
    bytes32 leaf = keccak256(abi.encodePacked(
        validatorIndex,
        withdrawalAddress
    ));

    // 3. Verify Merkle proof
    return MerkleProof.verify(proof, root, leaf);
}

// Verify validator balance
function verifyValidatorBalance(
    bytes32 beaconRoot,
    uint256 validatorIndex,
    uint256 balance,
    bytes32[] calldata proof
) external view returns (bool) {
    bytes32 leaf = sha256(abi.encodePacked(balance));
    return MerkleProof.verify(proof, beaconRoot, leaf);
}
`;
