# Ethers Interface Requirements

Extracted from ethers v6 `node_modules/ethers/lib.esm/abi/interface.js` and `fragments.js`.

## Interface Class API

### Constructor
- `new Interface(fragments)` - Create from ABI array, JSON string, or human-readable ABI
- `Interface.from(value)` - Static factory method

### Properties
- `fragments` - All ABI fragments (frozen array)
- `deploy` - ConstructorFragment (defaults to empty constructor)
- `fallback` - FallbackFragment or null
- `receive` - boolean (if receiving ether supported)

### Format Methods
- `format(minimal?)` - Human-readable ABI array (full or minimal)
- `formatJson()` - JSON-encoded ABI string

### Function Methods
- `getFunction(key, values?)` - Get FunctionFragment by name/selector/signature
- `getFunctionName(key)` - Get function name
- `hasFunction(key)` - Check if function exists
- `forEachFunction(callback)` - Iterate functions sorted by name

### Event Methods
- `getEvent(key, values?)` - Get EventFragment by name/topicHash/signature
- `getEventName(key)` - Get event name
- `hasEvent(key)` - Check if event exists
- `forEachEvent(callback)` - Iterate events sorted by name

### Error Methods
- `getError(key, values?)` - Get ErrorFragment by name/selector/signature
- `forEachError(callback)` - Iterate errors sorted by name

### Encoding/Decoding - Functions
- `encodeFunctionData(fragment, values?)` - Encode function call (selector + params)
- `decodeFunctionData(fragment, data)` - Decode function call params
- `decodeFunctionResult(fragment, data)` - Decode return data
- `encodeFunctionResult(fragment, values?)` - Encode return data (for mocking)

### Encoding/Decoding - Events
- `encodeEventLog(fragment, values)` - Encode event log (topics + data)
- `decodeEventLog(fragment, data, topics?)` - Decode event log
- `encodeFilterTopics(fragment, values)` - Encode filter topics for eth_filterLog

### Encoding/Decoding - Errors
- `encodeErrorResult(fragment, values?)` - Encode error revert data
- `decodeErrorResult(fragment, data)` - Decode error revert data

### Encoding/Decoding - Constructor
- `encodeDeploy(values?)` - Encode constructor arguments

### Parsing Methods
- `parseTransaction(tx)` - Parse tx data to TransactionDescription
- `parseLog(log)` - Parse log to LogDescription
- `parseError(data)` - Parse revert data to ErrorDescription
- `parseCallResult(data)` - Parse call result (throws on error)
- `makeError(data, tx)` - Create detailed error from revert data

### Internal Methods
- `_encodeParams(params, values)` - Encode parameters
- `_decodeParams(params, data)` - Decode parameters
- `getAbiCoder()` - Get ABI coder instance

## Fragment Classes

### ParamType
- `name` - Parameter name
- `type` - Full type (e.g., "uint256[]")
- `baseType` - Base type (e.g., "array", "tuple", "uint256")
- `indexed` - For events (true/false/null)
- `components` - For tuples (array of ParamType)
- `arrayLength` - For arrays (-1 = dynamic)
- `arrayChildren` - Child type for arrays
- `format(format?)` - Format as string (sighash/minimal/full/json)
- `isArray()`, `isTuple()`, `isIndexable()` - Type guards
- `walk(value, process)` - Walk structure
- `walkAsync(value, process)` - Async walk
- `ParamType.from(obj, allowIndexed?)` - Factory
- `ParamType.isParamType(value)` - Type guard

### Fragment (abstract)
- `type` - Fragment type
- `inputs` - Input parameters
- `Fragment.from(obj)` - Factory
- `Fragment.isConstructor/isError/isEvent/isFunction/isStruct(value)` - Type guards

### NamedFragment (extends Fragment)
- `name` - Fragment name

### FunctionFragment (extends NamedFragment)
- `constant` - Is view/pure
- `outputs` - Return types
- `stateMutability` - payable/nonpayable/view/pure
- `payable` - Can receive ether
- `gas` - Recommended gas limit
- `selector` - 4-byte selector
- `format(format?)` - Format as string
- `FunctionFragment.from(obj)` - Factory
- `FunctionFragment.getSelector(name, params?)` - Compute selector

### EventFragment (extends NamedFragment)
- `anonymous` - Is anonymous event
- `topicHash` - 32-byte topic hash
- `format(format?)` - Format as string
- `EventFragment.from(obj)` - Factory
- `EventFragment.getTopicHash(name, params?)` - Compute topic hash

### ErrorFragment (extends NamedFragment)
- `selector` - 4-byte selector
- `format(format?)` - Format as string
- `ErrorFragment.from(obj)` - Factory

### ConstructorFragment (extends Fragment)
- `payable` - Can receive endowment
- `gas` - Recommended gas limit
- `format(format?)` - Format as string
- `ConstructorFragment.from(obj)` - Factory

### FallbackFragment (extends Fragment)
- `payable` - Can receive ether
- `format(format?)` - Format as string
- `FallbackFragment.from(obj)` - Factory

## Description Classes

### LogDescription
- `fragment` - EventFragment
- `name` - Event name
- `signature` - Event signature
- `topic` - Topic hash
- `args` - Decoded arguments (Result)

### TransactionDescription
- `fragment` - FunctionFragment
- `name` - Function name
- `args` - Decoded arguments (Result)
- `signature` - Function signature
- `selector` - 4-byte selector
- `value` - Transaction value (bigint)

### ErrorDescription
- `fragment` - ErrorFragment
- `name` - Error name
- `args` - Decoded arguments (Result)
- `signature` - Error signature
- `selector` - 4-byte selector

### Indexed
- `hash` - keccak256 hash of original value
- `_isIndexed` - Type brand
- `Indexed.isIndexed(value)` - Type guard

## Built-in Errors
- `Error(string)` - selector 0x08c379a0
- `Panic(uint256)` - selector 0x4e487b71

## Panic Codes
- 0x00: generic panic
- 0x01: assert(false)
- 0x11: arithmetic overflow
- 0x12: division by zero
- 0x21: enum overflow
- 0x22: invalid storage byte array
- 0x31: empty array pop
- 0x32: array out of bounds
- 0x41: out of memory
- 0x51: uninitialized function

## Format Types
- `"sighash"` - Canonical signature (no names, no spaces)
- `"minimal"` - Minimal (no names, no spaces, type keywords)
- `"full"` - Full (names, spaces, type keywords)
- `"json"` - JSON object format
