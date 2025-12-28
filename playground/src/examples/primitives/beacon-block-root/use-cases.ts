import { BeaconBlockRoot } from "voltaire";
// Example: Real-world use cases for beacon block roots

// MEV Protection: Verify validator set to prevent manipulation
const mevProtectionRoot = BeaconBlockRoot.from(
	"0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
);

// L2 Bridge: Prove finality for cross-chain message
const l2BridgeRoot = BeaconBlockRoot.from(
	"0x9f8e7d6c5b4a3928170f1e2d3c4b5a69780f1e2d3c4b5a69780f1e2d3c4b5a69",
);

// Oracle: Trustless random number from beacon RANDAO
const oracleRoot = BeaconBlockRoot.from(
	"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
);

// Lido: Verify validator withdrawal credentials
const lidoRoot = BeaconBlockRoot.from(
	"0x7f8e9d0c1b2a3948576e0d1c2b3a4958677e0d1c2b3a4958677e0d1c2b3a4958",
);
const mevExample = `
// Verify validator in current committee
contract MEVProtection {
    function verifyProposer(
        uint256 slot,
        uint256 validatorIndex,
        bytes32[] calldata proof
    ) external view returns (bool) {
        // Get beacon root for slot
        bytes32 root = getBeaconRoot(slotToTimestamp(slot));

        // Verify validator is in active set
        bytes32 leaf = keccak256(abi.encode(validatorIndex, slot));
        require(MerkleProof.verify(proof, root, leaf), "Invalid proposer");

        return true;
    }

    // Prevent censorship by requiring proposer proof
    function submitBundle(
        bytes calldata bundle,
        uint256 validatorIndex,
        bytes32[] calldata proof
    ) external {
        require(verifyProposer(currentSlot(), validatorIndex, proof));
        // Process bundle knowing validator is legitimate
    }
}
`;
const l2Example = `
// Trustless L2 → L1 message passing
contract L2Bridge {
    function proveWithdrawal(
        uint256 l2BlockNumber,
        bytes32 messageHash,
        bytes32[] calldata beaconProof,
        bytes32[] calldata executionProof
    ) external {
        // 1. Get beacon root (proves CL finality)
        bytes32 beaconRoot = getBeaconRoot(block.timestamp - 15 minutes);

        // 2. Verify execution payload in beacon block
        bytes32 executionPayloadRoot = verifyBeaconProof(
            beaconRoot,
            beaconProof
        );

        // 3. Verify L2 state in execution payload
        require(
            verifyExecutionProof(
                executionPayloadRoot,
                l2BlockNumber,
                messageHash,
                executionProof
            ),
            "Invalid L2 proof"
        );

        // 4. Release funds (finality guaranteed by CL)
        processWithdrawal(messageHash);
    }
}
`;
const oracleExample = `
// Use RANDAO for verifiable randomness
contract RandomOracle {
    function getVerifiableRandom(
        uint256 timestamp,
        bytes32[] calldata randaoProof
    ) external view returns (uint256) {
        // Get beacon root
        bytes32 beaconRoot = getBeaconRoot(timestamp);

        // Verify RANDAO reveal from beacon block body
        bytes32 randao = verifyRandao(beaconRoot, randaoProof);

        // Derive random number
        return uint256(keccak256(abi.encode(randao, block.number)));
    }

    // Fair NFT mint using beacon RANDAO
    function mintWithFairness(bytes32[] calldata proof) external {
        uint256 random = getVerifiableRandom(block.timestamp - 12, proof);
        uint256 tokenId = random % COLLECTION_SIZE;

        _mint(msg.sender, tokenId);
    }
}
`;
const stakingExample = `
// Verify validator credentials and balances
contract StakingPool {
    function reportValidatorBalance(
        uint256 validatorIndex,
        uint256 balance,
        bytes32[] calldata proof
    ) external {
        // Get recent finalized root
        bytes32 beaconRoot = getBeaconRoot(block.timestamp - 15 minutes);

        // Verify validator balance
        bytes32 leaf = sha256(abi.encode(balance));
        uint256 balanceGindex = getBalanceGindex(validatorIndex);

        require(
            verifyGeneralizedIndex(proof, beaconRoot, leaf, balanceGindex),
            "Invalid balance proof"
        );

        // Update protocol accounting
        updateValidatorBalance(validatorIndex, balance);
    }

    // Prove validator exit for withdrawal
    function processValidatorExit(
        uint256 validatorIndex,
        bytes32[] calldata exitProof
    ) external {
        bytes32 beaconRoot = getBeaconRoot(block.timestamp - 15 minutes);
        require(verifyExit(beaconRoot, validatorIndex, exitProof));

        // Initiate withdrawal flow
        initiateWithdrawal(validatorIndex);
    }
}
`;
