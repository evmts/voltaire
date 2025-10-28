/**
 * EVENT LOG DECODING - Code Examples and Patterns
 * Extracted from ethers.js, viem, and ox implementations
 */

// ============================================================================
// 1. ETHERS.JS IMPLEMENTATION (Full Source)
// ============================================================================

namespace EthersJs {
  // Types
  interface EventFragment {
    name: string
    inputs: ParamType[]
    anonymous: boolean
    topicHash: string
  }

  interface ParamType {
    name?: string
    type: string
    indexed?: boolean
    baseType?: string
  }

  interface LogDescription {
    name: string
    fragment: EventFragment
    args: any
    topics: string[]
    data: string
  }

  // Core parseLog implementation
  function parseLog(log: { topics: readonly string[]; data: string }): LogDescription | null {
    const fragment = getEvent(log.topics[0])

    if (!fragment || fragment.anonymous) {
      return null
    }

    return new LogDescription(
      fragment,
      fragment.topicHash,
      decodeEventLog(fragment, log.data, log.topics)
    )
  }

  // Core decodeEventLog implementation
  function decodeEventLog(
    fragment: EventFragment,
    data: string,
    topics?: readonly string[]
  ): any {
    // 1. VALIDATE topic[0] matches
    if (topics != null && !fragment.anonymous) {
      const eventTopic = fragment.topicHash
      if (!topics[0] || topics[0].toLowerCase() !== eventTopic) {
        throw new Error("fragment/topic mismatch")
      }
      topics = topics.slice(1) // Remove topic[0] (selector)
    }

    // 2. SEPARATE indexed and non-indexed parameters
    const indexed: ParamType[] = []
    const nonIndexed: ParamType[] = []
    const dynamic: boolean[] = []

    fragment.inputs.forEach((param) => {
      if (param.indexed) {
        // Dynamic types in topics are stored as bytes32 hashes
        if (
          param.type === "string" ||
          param.type === "bytes" ||
          param.baseType === "tuple" ||
          param.baseType === "array"
        ) {
          indexed.push({ type: "bytes32", name: param.name })
          dynamic.push(true)
        } else {
          indexed.push(param)
          dynamic.push(false)
        }
      } else {
        nonIndexed.push(param)
        dynamic.push(false)
      }
    })

    // 3. DECODE indexed and non-indexed separately
    const resultIndexed = topics != null ? abiCoder.decode(indexed, concat(topics)) : null
    const resultNonIndexed = abiCoder.decode(nonIndexed, data, true)

    // 4. RECONSTRUCT result with proper parameter positioning
    const values: any[] = []
    const keys: (string | null)[] = []
    let nonIndexedIndex = 0
    let indexedIndex = 0

    fragment.inputs.forEach((param, index) => {
      let value: any = null

      if (param.indexed) {
        if (resultIndexed == null) {
          value = null
        } else if (dynamic[index]) {
          // Dynamic type: return hash as-is (wrapped in Indexed)
          value = resultIndexed[indexedIndex++]
        } else {
          // Static type: decode normally
          try {
            value = resultIndexed[indexedIndex++]
          } catch (error) {
            value = error
          }
        }
      } else {
        // Non-indexed parameter
        try {
          value = resultNonIndexed[nonIndexedIndex++]
        } catch (error) {
          value = error
        }
      }

      values.push(value)
      keys.push(param.name || null)
    })

    // Return Result object (supports both array and object access)
    return Result.fromItems(values, keys)
  }

  // Helper functions
  function getEvent(topic: string): EventFragment | undefined {
    // Search ABI for event matching topic[0] selector
    return abiItems.find((item) => item.topicHash === topic)
  }

  function concat(topics: readonly string[]): string {
    return "0x" + topics.map((t) => t.slice(2)).join("")
  }

  class Result {
    static fromItems(values: any[], keys: (string | null)[]): any {
      // Create object with both array and named access
      const result = [...values]
      keys.forEach((key, i) => {
        if (key) result[key] = values[i]
      })
      return result
    }
  }

  const abiCoder = {
    decode: (types: any[], data: string, loose?: boolean) => {
      // ABI decoding implementation
      return []
    },
  }

  const abiItems: EventFragment[] = []
}

// ============================================================================
// 2. VIEM IMPLEMENTATION (Full Source)
// ============================================================================

namespace Viem {
  type Hex = `0x${string}`
  type AbiParameter = { name?: string; type: string; indexed?: boolean }
  type Abi = { type: string; name?: string; inputs?: AbiParameter[] }[]

  // Return types
  interface DecodeEventLogReturnType {
    eventName: string
    args?: Record<string, any> | any[]
  }

  // Core decodeEventLog implementation
  function decodeEventLog(params: {
    abi: Abi
    topics: [Hex, ...Hex[]]
    data?: Hex
    eventName?: string
    strict?: boolean
  }): DecodeEventLogReturnType {
    const { abi, topics, data, strict: strict_ } = params
    const strict = strict_ ?? true

    const [signature, ...argTopics] = topics

    // 1. VALIDATE topic[0] exists
    if (!signature) throw new Error("AbiEventSignatureEmptyTopicsError")

    // 2. FIND event in ABI matching signature
    const abiItem = abi.find(
      (x) =>
        x.type === "event" &&
        signature === toEventSelector(formatAbiItem(x) as any)
    )

    if (!(abiItem && "name" in abiItem) || abiItem.type !== "event") {
      throw new Error("AbiEventSignatureNotFoundError")
    }

    const { name, inputs } = abiItem
    const isUnnamed = inputs?.some((x) => !("name" in x && x.name))

    // 3. INITIALIZE result container (array or object)
    const args: any = isUnnamed ? [] : {}

    // 4. DECODE indexed parameters from topics
    const indexedInputs = inputs
      .map((x, i) => [x, i] as const)
      .filter(([x]) => "indexed" in x && x.indexed)

    for (let i = 0; i < indexedInputs.length; i++) {
      const [param, argIndex] = indexedInputs[i]
      const topic = argTopics[i]

      if (!topic) throw new Error("DecodeLogTopicsMismatch")

      args[isUnnamed ? argIndex : param.name || argIndex] = decodeTopic({
        param,
        value: topic,
      })
    }

    // 5. DECODE non-indexed parameters from data
    const nonIndexedInputs = inputs.filter((x) => !("indexed" in x && x.indexed))

    if (nonIndexedInputs.length > 0) {
      if (data && data !== "0x") {
        try {
          const decodedData = decodeAbiParameters(nonIndexedInputs, data)

          if (decodedData) {
            if (isUnnamed) {
              // Array result: fill gaps with decoded data
              for (let i = 0; i < inputs.length; i++) {
                args[i] = args[i] ?? decodedData.shift()
              }
            } else {
              // Object result: merge by parameter name
              for (let i = 0; i < nonIndexedInputs.length; i++) {
                args[nonIndexedInputs[i].name!] = decodedData[i]
              }
            }
          }
        } catch (err) {
          if (strict) {
            throw new Error("DecodeLogDataMismatch")
          }
          // Non-strict: silently ignore decode errors
        }
      } else if (strict && nonIndexedInputs.length > 0) {
        throw new Error("DecodeLogDataMismatch: expected data but got 0x")
      }
    }

    return {
      eventName: name,
      args: Object.values(args).length > 0 ? args : undefined,
    }
  }

  // Special handling for dynamic types in topics
  function decodeTopic({ param, value }: { param: AbiParameter; value: Hex }): any {
    // Dynamic types (string, bytes, tuple, array) in topics are hashes
    // Return the hash directly; can't decode back to original value
    if (
      param.type === "string" ||
      param.type === "bytes" ||
      param.type === "tuple" ||
      param.type.match(/^(.*)\[(\d+)?\]$/) // array type
    ) {
      return value // Return hash as-is
    }

    // Static types can be decoded from the topic value
    const decodedArg = decodeAbiParameters([param], value) || []
    return decodedArg[0]
  }

  // Helper functions
  function toEventSelector(formattedItem: any): Hex {
    // Compute keccak256(formatAbiItem) to get event selector
    return keccak256(formattedItem) as Hex
  }

  function formatAbiItem(item: Abi[0]): string {
    // Format: EventName(type1,type2,...)
    const inputs = item.inputs?.map((i) => i.type).join(",") ?? ""
    return `${item.name}(${inputs})`
  }

  function decodeAbiParameters(params: AbiParameter[], data: Hex): any[] {
    // ABI decode implementation
    return []
  }

  function keccak256(data: string): string {
    // Keccak256 hash implementation
    return "0x"
  }
}

// ============================================================================
// 3. OX IMPLEMENTATION (Conceptual)
// ============================================================================

namespace Ox {
  type Hex = `0x${string}`
  type AbiParameter = { name?: string; type: string; indexed?: boolean }
  type AbiEvent = { name: string; inputs: AbiParameter[] }

  // Core decode implementation
  function decode(abiEvent: AbiEvent, log: { topics: Hex[]; data: Hex }): any {
    const { topics, data } = log
    const [selector_, ...argTopics] = topics

    // 1. VALIDATE selector matches
    const selector = getSelector(abiEvent)
    if (selector_ !== selector) {
      throw new Error("SelectorTopicMismatchError")
    }

    // 2. INITIALIZE result container
    const isUnnamed = abiEvent.inputs.some((x) => !x.name)
    let args: any = isUnnamed ? [] : {}

    // 3. DECODE indexed parameters from topics
    const indexedInputs = abiEvent.inputs.filter((x) => x.indexed)

    for (let i = 0; i < indexedInputs.length; i++) {
      const param = indexedInputs[i]
      const topic = argTopics[i]

      if (!topic) throw new Error("TopicsMismatchError")

      args[param.name || i] = decodeTopicValue(param, topic)
    }

    // 4. DECODE non-indexed parameters from data
    const nonIndexedInputs = abiEvent.inputs.filter((x) => !x.indexed)

    if (nonIndexedInputs.length > 0 && data && data !== "0x") {
      const decodedData = AbiParameters.decode(nonIndexedInputs, data)

      for (let i = 0; i < nonIndexedInputs.length; i++) {
        const param = nonIndexedInputs[i]
        args[param.name || i] = decodedData[i]
      }
    }

    return Object.values(args).length > 0 ? args : undefined
  }

  // Topic value decoder
  function decodeTopicValue(param: AbiParameter, value: Hex): any {
    if (
      param.type === "string" ||
      param.type === "bytes" ||
      param.type === "tuple" ||
      param.type.includes("[")
    ) {
      return value // Dynamic type: return hash
    }

    // Static type: decode normally
    return AbiParameters.decode([param], value)[0]
  }

  // Helper functions
  function getSelector(abiEvent: AbiEvent): Hex {
    const signature = formatEvent(abiEvent)
    return keccak256(signature) as Hex
  }

  function formatEvent(abiEvent: AbiEvent): string {
    const types = abiEvent.inputs.map((i) => i.type).join(",")
    return `${abiEvent.name}(${types})`
  }

  namespace AbiParameters {
    export function decode(params: AbiParameter[], data: Hex): any[] {
      // Decode all parameters from packed data
      return []
    }
  }

  function keccak256(data: string): string {
    return "0x"
  }
}

// ============================================================================
// 4. UNIFIED ALGORITHM IMPLEMENTATION (Generic)
// ============================================================================

namespace Generic {
  type Hex = `0x${string}`

  interface AbiParameter {
    name?: string
    type: string
    indexed?: boolean
  }

  interface AbiEvent {
    type: "event"
    name: string
    inputs: AbiParameter[]
  }

  interface Log {
    topics: Hex[]
    data: Hex
  }

  interface DecodedLog {
    eventName: string
    args?: Record<string, any> | any[]
  }

  /**
   * Generic event log decoding algorithm
   * Works across all three libraries
   */
  function decodeEventLog(abi: AbiEvent[], log: Log): DecodedLog {
    const { topics, data } = log

    // 1. EXTRACT signature from topics[0]
    const signature = topics[0]
    if (!signature) throw new Error("Missing event signature (topics[0])")

    // 2. FIND matching event in ABI
    const event = findEventBySignature(abi, signature)
    if (!event) throw new Error(`Event signature not found: ${signature}`)

    // 3. SEPARATE indexed and non-indexed parameters
    const indexedParams = event.inputs.filter((p) => p.indexed)
    const nonIndexedParams = event.inputs.filter((p) => !p.indexed)

    // 4. INITIALIZE result (array or object based on named params)
    const hasNamedParams = event.inputs.some((p) => p.name)
    let result: any = hasNamedParams ? {} : []

    // 5. DECODE indexed parameters from topics[1:]
    const indexedValues = topics.slice(1).map((topic, i) => {
      const param = indexedParams[i]
      if (!param) throw new Error(`Missing indexed parameter at index ${i}`)

      return {
        param,
        value: decodeTopic(param, topic),
      }
    })

    // 6. DECODE non-indexed parameters from data
    const nonIndexedValues: any[] = []
    if (nonIndexedParams.length > 0) {
      if (data && data !== "0x") {
        nonIndexedValues.push(...decodeData(nonIndexedParams, data))
      } else if (nonIndexedParams.length > 0) {
        throw new Error(
          `Expected data for ${nonIndexedParams.length} non-indexed params, got empty`
        )
      }
    }

    // 7. RECONSTRUCT result in original parameter order
    let indexedIdx = 0
    let nonIndexedIdx = 0

    for (const param of event.inputs) {
      const key = param.name || (hasNamedParams ? "unknown" : indexedIdx + nonIndexedIdx)
      const isIndexed = param.indexed

      if (isIndexed) {
        result[key] = indexedValues[indexedIdx++].value
      } else {
        result[key] = nonIndexedValues[nonIndexedIdx++]
      }
    }

    return {
      eventName: event.name,
      args: Object.values(result).length > 0 ? result : undefined,
    }
  }

  // Supporting functions
  function findEventBySignature(abi: AbiEvent[], signature: Hex): AbiEvent | undefined {
    return abi.find((event) => {
      const computed = computeEventSignature(event)
      return computed.toLowerCase() === signature.toLowerCase()
    })
  }

  function computeEventSignature(event: AbiEvent): Hex {
    const types = event.inputs.map((p) => p.type).join(",")
    const canonical = `${event.name}(${types})`
    return keccak256(canonical) as Hex
  }

  function decodeTopic(param: AbiParameter, topic: Hex): any {
    // Dynamic types: return hash (can't decode)
    if (isDynamicType(param.type)) {
      return topic
    }

    // Static types: decode from topic
    return decodeStaticType(param.type, topic)
  }

  function decodeData(params: AbiParameter[], data: Hex): any[] {
    // Decode all non-indexed parameters packed in data
    return params.map((param) => {
      // Implementation depends on ABI encoder
      return decodeParameter(param, data)
    })
  }

  function isDynamicType(type: string): boolean {
    return (
      type === "string" ||
      type === "bytes" ||
      type === "tuple" ||
      type.includes("[") ||
      type.includes("(")
    )
  }

  function decodeStaticType(type: string, hex: Hex): any {
    // Decode based on type
    if (type.startsWith("uint") || type.startsWith("int")) {
      return BigInt(hex)
    }
    if (type === "bool") {
      return hex !== "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
    if (type === "address") {
      return "0x" + hex.slice(-40)
    }
    return hex
  }

  function decodeParameter(param: AbiParameter, data: Hex): any {
    // Full ABI parameter decoding
    return null
  }

  function keccak256(data: string): string {
    return "0x"
  }
}

// ============================================================================
// 5. PRACTICAL EXAMPLES
// ============================================================================

namespace Examples {
  /**
   * ERC20 Transfer Event Decoding
   * event Transfer(address indexed from, address indexed to, uint256 value)
   */
  const ERC20_TRANSFER_EXAMPLE = {
    signature: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer signature
      "0x0000000000000000000000008ba1f109551bD432803012645Ac136ddd64DBA72", // from
      "0x000000000000000000000000283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75", // to
    ],
    data: "0x0000000000000000000000000000000000000000000000000000000000000064", // value = 100

    // Expected result:
    // {
    //   eventName: "Transfer",
    //   args: {
    //     from: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    //     to: "0x283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75",
    //     value: 100n
    //   }
    // }
  }

  /**
   * Dynamic Type Example
   * event Log(string indexed message, bytes data)
   */
  const DYNAMIC_TYPE_EXAMPLE = {
    signature: "0x...", // keccak256("Log(string,bytes)")
    topics: [
      "0x...", // Log signature
      "0x1234567890abcdef...", // indexed string => stored as hash, not actual string
    ],
    data: "0x...", // bytes data as ABI-encoded

    // Problem: Can't recover original string from topic[1] hash
    // Solution: If needed, query contract history or use off-chain indexing
  }

  /**
   * Multiple Indexed Parameters Example
   * event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)
   */
  const MULTIPLE_INDEXED_EXAMPLE = {
    signature: "0x...",
    topics: [
      "0x...", // Swap signature
      "0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d", // sender (indexed)
      "0x000000000000000000000000b4fbf271143f4fbf7b91a5ded31805e42b2208d6", // to (indexed)
    ],
    data: "0x000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000", // amount0In, amount1In, amount0Out, amount1Out

    // Decoding order:
    // 1. sender from topics[1]
    // 2. to from topics[2]
    // 3. amount0In, amount1In, amount0Out, amount1Out from data
  }
}

// ============================================================================
// 6. ERROR HANDLING PATTERNS
// ============================================================================

namespace ErrorHandling {
  class EventDecodingError extends Error {
    constructor(public code: string, message: string) {
      super(message)
    }
  }

  class AbiEventSignatureNotFoundError extends EventDecodingError {
    constructor(signature: string, context?: any) {
      super(
        "AbiEventSignatureNotFoundError",
        `No event found with signature: ${signature}`
      )
    }
  }

  class DecodeLogTopicsMismatchError extends EventDecodingError {
    constructor(context?: any) {
      super(
        "DecodeLogTopicsMismatchError",
        `Mismatch between expected and provided topics`
      )
    }
  }

  class DecodeLogDataMismatchError extends EventDecodingError {
    constructor(context?: any) {
      super("DecodeLogDataMismatchError", `Data size does not match ABI expectations`)
    }
  }

  // Usage patterns
  function decodeWithErrorHandling(abi: any[], topics: string[], data: string) {
    try {
      const signature = topics[0]
      if (!signature) throw new EventDecodingError("EMPTY_TOPICS", "No topics provided")

      const event = findEventInAbi(abi, signature)
      if (!event) throw new AbiEventSignatureNotFoundError(signature)

      // Decode...
      return decodeEventLog(abi, { topics, data } as any)
    } catch (err) {
      if (err instanceof EventDecodingError) {
        console.error(`Decoding error [${err.code}]: ${err.message}`)
        return null
      }

      // Unknown error
      throw err
    }
  }

  function findEventInAbi(abi: any[], signature: string): any {
    return abi.find((item) => item.type === "event" && computeSignature(item) === signature)
  }

  function computeSignature(event: any): string {
    return "0x"
  }

  function decodeEventLog(abi: any[], log: any): any {
    return null
  }
}

// ============================================================================
// 7. PERFORMANCE OPTIMIZATION PATTERNS
// ============================================================================

namespace Performance {
  /**
   * Selector cache for repeated decoding
   * Avoids recomputing keccak256(eventName + paramTypes) on every decode
   */
  class EventSelectorCache {
    private cache = new Map<string, string>()

    getSelector(eventName: string, paramTypes: string[]): string {
      const key = `${eventName}(${paramTypes.join(",")})`
      if (!this.cache.has(key)) {
        this.cache.set(key, keccak256(key))
      }
      return this.cache.get(key)!
    }

    clear() {
      this.cache.clear()
    }
  }

  /**
   * Batch decoding with shared ABI lookup
   * Single ABI scan instead of per-log scan
   */
  function decodeMultipleLogs(abi: any[], logs: any[]) {
    // Index events by signature once
    const eventsBySignature = new Map()
    abi.forEach((item) => {
      if (item.type === "event") {
        const sig = computeSignature(item)
        eventsBySignature.set(sig, item)
      }
    })

    // Decode each log using indexed lookup
    return logs.map((log) => {
      const event = eventsBySignature.get(log.topics[0])
      if (!event) return null
      return decodeWithEvent(event, log)
    })
  }

  /**
   * Single-pass parameter reconstruction
   * Avoid temporary arrays; iterate and assign directly
   */
  function reconstructParametersEfficient(
    event: any,
    indexedValues: any[],
    nonIndexedValues: any[]
  ) {
    const result: any = {}
    let indexedIdx = 0
    let nonIndexedIdx = 0

    // Single iteration through original parameter order
    for (const param of event.inputs) {
      result[param.name] = param.indexed ? indexedValues[indexedIdx++] : nonIndexedValues[nonIndexedIdx++]
    }

    return result
  }

  // Helper functions
  function keccak256(data: string): string {
    return "0x"
  }

  function computeSignature(event: any): string {
    return "0x"
  }

  function decodeWithEvent(event: any, log: any): any {
    return null
  }
}

export {}
