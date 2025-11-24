import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: Merkle proof verification using beacon roots

// Beacon root for a finalized block
const beaconRoot = BeaconBlockRoot.from(
	"0x8e47c00dcd5d2d4e5b1f6e4c8e2fce50cf842a8c5a8b0b5c1e4d3a2b1c0d9e8f",
);

// What a Merkle proof proves:
// - A specific piece of data exists in the beacon state
// - The data is at a specific generalized index in the SSZ tree
// - The root of the tree matches the beacon block root

console.log("=== Merkle Proof Verification ===\n");

console.log("Beacon Root:", BeaconBlockRoot.toHex(beaconRoot));
console.log();

console.log("SSZ Merkle Tree Structure:");
const sszStructure = `
BeaconBlock Root (32 bytes)
├── Left: BeaconBlockHeader
│   ├── slot
│   ├── proposer_index
│   ├── parent_root
│   └── state_root ──────────────┐
└── Right: BeaconBlockBody          │
    ├── randao_reveal              │
    ├── eth1_data                  │
    ├── graffiti                   │
    ├── proposer_slashings         │
    ├── attester_slashings         │
    ├── attestations               │
    ├── deposits                   │
    ├── voluntary_exits            │
    ├── sync_aggregate             │
    ├── execution_payload          │
    ├── bls_to_execution_changes   │
    └── blob_kzg_commitments       │
                                    │
BeaconState (from state_root) ◄────┘
├── genesis_time
├── slot
├── fork
├── latest_block_header
├── block_roots [8192]
├── state_roots [8192]
├── eth1_data
├── eth1_data_votes
├── validators [n] ◄── Merkle proofs commonly target this
│   ├── pubkey (BLS)
│   ├── withdrawal_credentials
│   ├── effective_balance
│   ├── slashed
│   ├── activation_epoch
│   └── exit_epoch
├── balances [n]
├── randao_mixes [65536]
├── slashings [8192]
└── ...
`;
console.log(sszStructure);
console.log();

console.log("Generalized Index:");
console.log("  • SSZ uses generalized indices for Merkle paths");
console.log("  • Index 1 = root");
console.log("  • Index 2 = left child, Index 3 = right child");
console.log("  • Formula: left = 2*i, right = 2*i+1");
console.log();

console.log("Example Indices:");
console.log("  • Validator 0 pubkey: gindex ≈ 2^40 + validator_index");
console.log("  • Validator 0 balance: gindex ≈ 2^38 + validator_index");
console.log("  • Withdrawal credentials: gindex varies by validator");
console.log();

const proofExample = `
// Solidity: Verify validator withdrawal credentials
contract ValidatorProof {
    struct Proof {
        bytes32[] siblings;     // Merkle siblings
        uint256 gindex;         // Generalized index
        bytes32 leaf;           // Leaf value
    }

    function verifyWithdrawalCredentials(
        bytes32 beaconRoot,
        uint256 validatorIndex,
        address withdrawalAddress,
        Proof calldata proof
    ) external pure returns (bool) {
        // Build leaf from withdrawal credentials (0x01 + address)
        bytes32 leaf = keccak256(abi.encodePacked(
            bytes1(0x01),
            bytes11(0),
            withdrawalAddress
        ));

        require(proof.leaf == leaf, "Leaf mismatch");

        // Verify Merkle proof
        return verifyMerkleProof(
            beaconRoot,
            proof.siblings,
            proof.gindex,
            leaf
        );
    }

    function verifyMerkleProof(
        bytes32 root,
        bytes32[] memory siblings,
        uint256 gindex,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 node = leaf;

        // Climb the tree using generalized index
        for (uint256 i = 0; i < siblings.length; i++) {
            // Check if we're a left or right child
            if (gindex % 2 == 0) {
                // Left child: hash(node, sibling)
                node = sha256(abi.encodePacked(node, siblings[i]));
            } else {
                // Right child: hash(sibling, node)
                node = sha256(abi.encodePacked(siblings[i], node));
            }

            // Move up the tree
            gindex /= 2;
        }

        return node == root;
    }
}
`;

console.log("Proof Verification (Solidity):");
console.log(proofExample);
console.log();

const typescriptExample = `
// TypeScript: Generate and verify proof
import { createProof, verifyProof } from '@chainsafe/persistent-merkle-tree';

// Get beacon block from node
const beaconBlock = await fetch(
  'http://localhost:5052/eth/v2/beacon/blocks/head'
).then(r => r.json());

const beaconRoot = BeaconBlockRoot.from(beaconBlock.data.root);

// Get state
const state = await fetch(
  'http://localhost:5052/eth/v2/debug/beacon/states/head'
).then(r => r.json());

// Generate proof for validator 12345
const validatorIndex = 12345;
const gindex = getValidatorGindex(validatorIndex);
const proof = createProof(state, gindex);

// Verify proof
const isValid = verifyProof(
  beaconRoot,
  gindex,
  proof.siblings,
  proof.leaf
);

console.log('Proof valid:', isValid);
`;

console.log("TypeScript Usage:");
console.log(typescriptExample);
console.log();

console.log("Proof Size:");
console.log("  Validator field: ~40 siblings × 32 bytes = ~1.3 KB");
console.log("  Balance field: ~38 siblings × 32 bytes = ~1.2 KB");
console.log("  Execution payload: ~20 siblings × 32 bytes = ~640 bytes");
console.log("  Note: Depends on validator set size");
console.log();

console.log("Gas Costs (Solidity):");
console.log("  • SHA256 precompile: ~60 gas per hash");
console.log("  • 40 hashes: ~2,400 gas");
console.log("  • Memory expansion: ~100 gas");
console.log("  • Total: ~2,500-3,000 gas to verify");
console.log();

console.log("Common Proof Targets:");
console.log("  1. Validator public key (BLS)");
console.log("  2. Withdrawal credentials (0x01 + address)");
console.log("  3. Validator balance (Gwei)");
console.log("  4. Validator slashing status");
console.log("  5. Execution payload block hash");
console.log("  6. RANDAO reveal");
console.log();

console.log("Best Practices:");
console.log("  ✓ Use finalized beacon roots (2+ epochs)");
console.log("  ✓ Validate gindex is in expected range");
console.log("  ✓ Check proof depth matches validator set");
console.log("  ✓ Use SHA256 precompile (cheaper than keccak)");
console.log("  ✓ Cache proofs off-chain, verify on-chain");
console.log("  ✓ Test with mainnet beacon node");
