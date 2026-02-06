import { BeaconBlockRoot, Bytes, Bytes32 } from "@tevm/voltaire";
// Example: Beacon chain connection and consensus layer integration

// Beacon block roots connect execution layer (EL) to consensus layer (CL)
// Each beacon block is ~12 seconds, execution blocks are ~12 seconds
// The root represents the SSZ hash tree root of the beacon block

// Example beacon block root from mainnet
const beaconRoot = BeaconBlockRoot(
	"0x8e47c00dcd5d2d4e5b1f6e4c8e2fce50cf842a8c5a8b0b5c1e4d3a2b1c0d9e8f",
);

// Slot 8000000 example (hypothetical)
const slot8M = BeaconBlockRoot.fromHex(
	"0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
);

// Genesis beacon root (all zeros)
const genesisRoot = BeaconBlockRoot.fromBytes(Bytes32.zero());

// What the beacon block root represents:
const beaconBlockStructure = `
BeaconBlock (SSZ):
├── slot: uint64                          // Time slot
├── proposer_index: uint64                // Validator who proposed
├── parent_root: bytes32                  // Previous beacon block
├── state_root: bytes32                   // Beacon state tree root
└── body:
    ├── randao_reveal: BLSSignature       // Randomness
    ├── eth1_data:                        // Execution layer data
    │   ├── deposit_root: bytes32         // Deposit contract root
    │   ├── deposit_count: uint64         // Total deposits
    │   └── block_hash: bytes32           // EL block hash
    ├── graffiti: bytes32                 // Proposer message
    ├── proposer_slashings: []            // Slashing evidence
    ├── attester_slashings: []            // Slashing evidence
    ├── attestations: []                  // Validator votes
    ├── deposits: []                      // New validators
    ├── voluntary_exits: []               // Exiting validators
    ├── sync_aggregate: SyncAggregate     // Light client sync
    ├── execution_payload: ExecutionPayload // EL block data
    ├── bls_to_execution_changes: []      // Withdrawal credentials
    └── blob_kzg_commitments: []          // EIP-4844 blobs

The beacon root = SSZ hash_tree_root(BeaconBlock)
`;
