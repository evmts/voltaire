# Ethers v6 Contract API Requirements

Extracted from `ethers@6.x` source code analysis.

## Core Classes

### BaseContract / Contract

**Constructor**: `new Contract(target, abi, runner?)`
- `target`: Address string, ENS name, or Addressable
- `abi`: ABI array, Interface, or JSON string
- `runner`: Provider or Signer (optional)

**Properties**:
- `target`: Original target (address/ENS)
- `interface`: Parsed Interface instance
- `runner`: Connected provider/signer
- `filters`: Proxy for event filters
- `fallback`: Wrapped fallback/receive method (if ABI has one)

**Methods**:
- `connect(runner)`: Return new instance with different runner
- `attach(target)`: Return new instance with different address
- `getAddress()`: Resolve and return address (handles ENS)
- `getDeployedCode()`: Get deployed bytecode
- `waitForDeployment()`: Wait until contract is deployed
- `deploymentTransaction()`: Get deployment tx (if from factory)
- `getFunction(key)`: Get wrapped function by name/signature
- `getEvent(key)`: Get wrapped event by name/signature
- `queryFilter(event, fromBlock?, toBlock?)`: Query historical logs

**Event Methods**:
- `on(event, listener)`: Subscribe to event
- `once(event, listener)`: Subscribe once
- `off(event, listener)`: Unsubscribe
- `emit(event, ...args)`: Emit event to listeners
- `listenerCount(event?)`: Count listeners
- `listeners(event?)`: Get listener functions
- `removeAllListeners(event?)`: Remove all

**Static**:
- `Contract.buildClass(abi)`: Create custom Contract class
- `Contract.from(target, abi, runner?)`: Create instance

### ContractFactory

**Constructor**: `new ContractFactory(abi, bytecode, runner?)`
- `bytecode`: Hex string, Uint8Array, or `{ object: string }` (Solidity output)

**Properties**:
- `interface`: Parsed Interface
- `bytecode`: Normalized hex bytecode
- `runner`: Connected signer

**Methods**:
- `attach(target)`: Create Contract at existing address
- `getDeployTransaction(...args)`: Build deploy transaction
- `deploy(...args)`: Deploy and return Contract instance
- `connect(runner)`: Return new factory with different runner

**Static**:
- `ContractFactory.fromSolidity(output, runner?)`: Create from compiler output

## Wrapped Function Methods

Each function in the ABI becomes a callable with additional methods:

```typescript
contract.functionName(...args)        // Default: staticCall for view/pure, send otherwise
contract.functionName.staticCall(...args)     // eth_call (view simulation)
contract.functionName.send(...args)           // eth_sendTransaction
contract.functionName.estimateGas(...args)    // eth_estimateGas
contract.functionName.populateTransaction(...args)  // Build tx without sending
contract.functionName.fragment               // Get FunctionFragment
contract.functionName.getFragment(...args)   // Get fragment (handles overloads)
```

## Wrapped Event Methods

Each event becomes an event filter factory:

```typescript
contract.filters.EventName(...args)  // Create PreparedTopicFilter
contract.getEvent(key).fragment      // Get EventFragment
```

**PreparedTopicFilter**:
- `fragment`: EventFragment
- `getTopicFilter()`: Promise<topics[]>

## Overload Handling

Functions with same name but different signatures:
- Access by full signature: `contract["transfer(address,uint256)"]`
- Auto-resolve by argument count/types when unambiguous
- Error if ambiguous without qualification

## Runner Requirements

**Provider capabilities** (for read operations):
- `call(tx)`: Execute eth_call
- `estimateGas(tx)`: Estimate gas
- `getLogs(filter)`: Query logs
- `on(filter, listener)`: Subscribe to logs

**Signer capabilities** (for write operations):
- `sendTransaction(tx)`: Send transaction
- All provider capabilities (via `signer.provider`)

**Optional**:
- `resolveName(name)`: ENS resolution

## Error Handling

**Error decoding**:
- Built-in: `Error(string)`, `Panic(uint256)`
- Custom errors from ABI
- Revert reason extraction

**Error types**:
- `UNSUPPORTED_OPERATION`: Runner lacks capability
- `CALL_EXCEPTION`: Contract revert
- `INVALID_ARGUMENT`: Bad input
- `UNCONFIGURED_NAME`: ENS not configured

## Transaction Response

**ContractTransactionResponse extends TransactionResponse**:
- `wait(confirms?, timeout?)`: Returns ContractTransactionReceipt

**ContractTransactionReceipt extends TransactionReceipt**:
- `logs`: Array of EventLog (decoded) or Log (raw)

**EventLog extends Log**:
- `interface`: Contract Interface
- `fragment`: EventFragment
- `args`: Decoded arguments
- `eventName`: Event name
- `eventSignature`: Full signature

## Key Patterns

1. **Proxy-based**: Contract uses Proxy to intercept property access
2. **Lazy resolution**: Address/ENS resolved on first use
3. **Immutable interface**: Once created, Interface is frozen
4. **Symbol-based internal state**: Uses WeakMap + Symbol for private data
5. **Chainable methods**: connect/attach return new instances

## Voltaire Adaptation Notes

- Use Voltaire primitives: `Address`, `Abi`, `Hex`, `Transaction`
- Use existing `EventStream` for event subscriptions
- Leverage `TypedProvider` for provider interface
- Keep branded types for type safety
- Use namespace pattern consistent with codebase
