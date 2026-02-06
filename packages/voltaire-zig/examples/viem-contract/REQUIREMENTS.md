# Viem Contract Abstraction - Requirements

Extracted from viem source code analysis.

## Core Actions

### readContract
- **Purpose**: Call view/pure functions via eth_call
- **Flow**: encodeFunctionData → call → decodeFunctionResult
- **Parameters**: `{ abi, address, functionName, args?, ...callOptions }`
- **Returns**: Decoded return value(s)
- **Error handling**: Wraps in ContractReadError with context

### writeContract
- **Purpose**: Execute state-changing functions via eth_sendTransaction
- **Flow**: encodeFunctionData → sendTransaction
- **Parameters**: `{ abi, address, functionName, args?, account, ...txOptions }`
- **Returns**: Transaction hash
- **Error handling**: Wraps in ContractWriteError with context
- **Note**: Requires account, supports dataSuffix

### simulateContract
- **Purpose**: Dry-run write functions to get return value and validate
- **Flow**: encodeFunctionData → call (batch:false) → decodeFunctionResult
- **Parameters**: `{ abi, address, functionName, args?, account?, ...callOptions }`
- **Returns**: `{ result, request }` where request can be passed to writeContract
- **Error handling**: Wraps in ContractSimulateError with context

### estimateContractGas
- **Purpose**: Estimate gas for write functions
- **Flow**: encodeFunctionData → estimateGas
- **Parameters**: `{ abi, address, functionName, args?, account?, ...gasOptions }`
- **Returns**: Gas estimate (bigint)
- **Error handling**: Wraps in ContractGasEstimationError with context

### watchContractEvent
- **Purpose**: Subscribe to contract events
- **Flow**: Polling (getLogs/getFilterChanges) or WebSocket subscription
- **Parameters**: `{ abi, address, eventName?, args?, onLogs, onError?, pollingInterval?, batch?, strict? }`
- **Returns**: Unsubscribe function
- **Features**:
  - Auto-detect transport type (polling vs websocket)
  - Fallback from filters to getLogs if RPC doesn't support filters
  - Event decoding with optional strict mode
  - Deduplication via observe pattern

## getContract Factory

Creates typed contract instance with proxied methods.

### Parameters
```typescript
{
  abi: Abi,
  address: Address,
  client: PublicClient | WalletClient | { public?: PublicClient, wallet?: WalletClient }
}
```

### Returns
```typescript
{
  address: Address,
  abi: Abi,
  read: { [functionName]: (...args) => Promise<Result> },       // view/pure only
  write: { [functionName]: (...args) => Promise<Hash> },        // nonpayable/payable only
  simulate: { [functionName]: (...args) => Promise<SimResult> }, // nonpayable/payable only
  estimateGas: { [functionName]: (...args) => Promise<bigint> }, // nonpayable/payable only
  watchEvent: { [eventName]: (args?, options?) => Unsubscribe }, // events only
  createEventFilter: { [eventName]: (args?, options?) => Filter },
  getEvents: { [eventName]: (args?, options?) => Promise<Logs> }
}
```

### Method Signatures

**Function methods**: `(args: any[], options?: CallOptions) | (options?: CallOptions)`
- If function has inputs, first arg is array of args
- Second arg (or first if no inputs) is options object

**Event methods**: `(args?: FilterArgs, options?: EventOptions) | (options?: EventOptions)`
- First arg can be filter args (for indexed params) or options
- Detection based on whether event has indexed inputs

## Key Implementation Details

### Parameter Extraction (getFunctionParameters)
```javascript
function getFunctionParameters(values) {
  const hasArgs = values.length && Array.isArray(values[0]);
  const args = hasArgs ? values[0] : [];
  const options = (hasArgs ? values[1] : values[0]) ?? {};
  return { args, options };
}
```

### Event Parameter Extraction (getEventParameters)
```javascript
function getEventParameters(values, abiEvent) {
  let hasArgs = false;
  if (Array.isArray(values[0])) hasArgs = true;
  else if (values.length === 1) {
    hasArgs = abiEvent.inputs.some(x => x.indexed);
  } else if (values.length === 2) {
    hasArgs = true;
  }
  const args = hasArgs ? values[0] : undefined;
  const options = (hasArgs ? values[1] : values[0]) ?? {};
  return { args, options };
}
```

### Error Wrapping
All actions wrap errors in ContractError with:
- Original ABI
- Contract address
- Function/event name
- Arguments
- Docs path

## Type System

### Type Inference from ABI
- Extract function names by stateMutability
- Infer input types for args
- Infer output types for return values
- Extract event names
- Infer indexed params for filter args
- Infer all params for decoded log args

### Key Types
- `ReadContractParameters<TAbi, TFunctionName>`
- `ReadContractReturnType<TAbi, TFunctionName>`
- `WriteContractParameters<TAbi, TFunctionName>`
- `WriteContractReturnType` (always Hash)
- `SimulateContractParameters<TAbi, TFunctionName>`
- `SimulateContractReturnType<TAbi, TFunctionName>`
- `EstimateContractGasParameters<TAbi, TFunctionName>`
- `EstimateContractGasReturnType` (always bigint)
- `WatchContractEventParameters<TAbi, TEventName>`
- `WatchContractEventReturnType` (unsubscribe function)
