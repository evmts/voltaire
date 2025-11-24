import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: Using beacon roots to access consensus layer data

// Beacon root from a finalized block
const finalizedRoot = BeaconBlockRoot.from(
	"0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
);

// Recent root (not yet finalized)
const recentRoot = BeaconBlockRoot.from(
	"0x3c59dc048e8850243be8079a5c74d079e77c4e3c3a6e8c3a6c8e3c3a6e8c3a6e",
);

// Root for validator withdrawal verification
const withdrawalRoot = BeaconBlockRoot.from(
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

console.log("=== Consensus Layer Data Access ===\n");

console.log("Beacon Roots:");
console.log("  Finalized:", BeaconBlockRoot.toHex(finalizedRoot));
console.log("  Recent:", BeaconBlockRoot.toHex(recentRoot));
console.log("  Withdrawal:", BeaconBlockRoot.toHex(withdrawalRoot));
console.log();

console.log("Consensus Data Types:");
console.log(consensusDataTypes);
console.log();

console.log("Data Access Pattern:");
console.log("  1. Get beacon root from block header (EIP-4788)");
console.log("  2. Request CL data + Merkle proof from beacon node");
console.log("  3. Submit proof to smart contract");
console.log("  4. Contract verifies proof against beacon root");
console.log("  5. Trust verified CL data in contract logic");
console.log();

console.log("Merkle Proof Structure:");
console.log("  Root: Beacon block root (32 bytes)");
console.log("  Leaf: SSZ hash of target data");
console.log("  Proof: Array of sibling hashes");
console.log("  Depth: ~40 levels (validator set size)");
console.log("  Hash: SHA256 (SSZ standard)");
console.log();

console.log("Solidity Implementation:");
console.log(merkleProofExample);
console.log();

console.log("Real-World Applications:");
console.log("  1. Lido: Verify validator withdrawals");
console.log("  2. RocketPool: Prove node operator balances");
console.log("  3. Eigenlayer: Restaking proof verification");
console.log("  4. L2 Bridges: Finality proofs");
console.log("  5. MEV Smoothing: Fair value distribution");
console.log();

console.log("Data Freshness:");
console.log("  Ring buffer: 8191 slots (~27 hours)");
console.log("  Update frequency: Every slot (12s)");
console.log("  Finality: 2 epochs (~13 min)");
console.log("  Safe usage: Use finalized roots only");
console.log();

console.log("Security Considerations:");
console.log("  ⚠ Recent roots may be reorganized");
console.log("  ✓ Wait for finality (2 epochs)");
console.log("  ✓ Verify proof depth matches expectation");
console.log("  ✓ Check root exists in ring buffer");
console.log("  ✓ Validate proof indices are in-bounds");
