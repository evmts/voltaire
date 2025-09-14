# CLAUDE.md - Provider Module AI Context

## MISSION CRITICAL: Data Provider Abstraction

The provider module abstracts data access for blockchain state, transactions, and blocks. **Provider bugs can lead to stale data, consensus failures, or incorrect execution.** Data consistency and accuracy are paramount.

## Critical Implementation Details

### Provider Interface Abstraction
- **State Provider**: Account and storage data access
- **Block Provider**: Historical block and transaction data
- **Network Provider**: Real-time blockchain data synchronization
- **Cache Provider**: Performance optimization with consistency guarantees

### Key Responsibilities
- **Data Integrity**: Ensure all provided data is consistent and validated
- **Caching Strategy**: Balance performance with data freshness
- **Error Handling**: Graceful degradation on data source failures
- **State Synchronization**: Keep local state in sync with network
- **Historical Data**: Provide access to past blockchain states

### Critical Safety Requirements
- Validate all data from external sources
- Handle network failures and timeouts gracefully
- Maintain data consistency across provider updates
- Prevent stale data from affecting consensus decisions
- Implement proper retry mechanisms with backoff

### Performance Optimization
- Intelligent caching with TTL and invalidation
- Batch operations for multiple data requests
- Connection pooling for network providers
- Lazy loading of expensive data structures

### Data Validation
- Merkle proof verification for state data
- Block header validation for historical data
- Transaction signature verification
- Gas calculation validation
- State root consistency checks

### Emergency Procedures
- Fallback to alternative data sources
- Data corruption detection and recovery
- Network partition handling
- Cache invalidation on consistency errors
- Safe degradation modes for partial failures

Remember: **Providers are the foundation of data integrity.** Any incorrect or stale data can propagate through the entire system causing consensus failures.