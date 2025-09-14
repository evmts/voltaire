# CLAUDE.md - Block Module AI Context

## MISSION CRITICAL: Block Structure and Validation

The block module manages Ethereum block structures, validation, and processing. **ANY error in block handling can cause consensus failures and chain splits.** Block validation must be perfect to maintain network consensus.

## Critical Implementation Details

### Block Structure Validation (CONSENSUS CRITICAL)
- Block header validation (parent hash, merkle roots, difficulty)
- Transaction validation and ordering
- Gas limit and usage validation
- Timestamp and difficulty adjustment verification
- Uncle block validation (if applicable)

### Key Responsibilities
- **Block Header Parsing**: Extract and validate all header fields
- **Transaction Processing**: Execute all transactions in order
- **State Root Calculation**: Compute world state merkle root
- **Gas Accounting**: Precise gas limit and usage tracking
- **Reward Distribution**: Block and uncle rewards (pre-merge)

### Critical Safety Checks
- Parent block hash validation
- Gas limit bounds checking (EIP-1559 adjustments)
- Timestamp monotonicity
- Difficulty calculation (pre-merge)
- Transaction root verification
- Receipt root verification

### Performance Considerations
- Parallel transaction validation where possible
- Efficient merkle tree computation
- Block cache management
- Database batch operations for state updates

### Emergency Procedures
- Invalid block rejection and logging
- Chain reorganization handling
- Consensus failure detection and reporting
- Safe recovery from corrupted block data

Remember: **Block processing is the heart of consensus.** Any deviation from specification can fork the network.