import Foundation
import GuillotineFFI

/// Ethereum address type (20 bytes)
public struct Address: Equatable, Hashable {
    public let bytes: Data
    
    public init?(hex: String) {
        var cleanHex = hex
        if cleanHex.hasPrefix("0x") || cleanHex.hasPrefix("0X") {
            cleanHex = String(cleanHex.dropFirst(2))
        }
        
        guard cleanHex.count == 40,
              let data = Data(hexString: cleanHex),
              data.count == 20 else {
            return nil
        }
        
        self.bytes = data
    }
    
    public init(bytes: Data) {
        precondition(bytes.count == 20, "Address must be exactly 20 bytes")
        self.bytes = bytes
    }
    
    public var hexString: String {
        "0x" + bytes.map { String(format: "%02x", $0) }.joined()
    }
}

/// 256-bit unsigned integer type
public struct U256: Equatable {
    public let data: Data
    
    public init(_ value: UInt64) {
        var data = Data(repeating: 0, count: 32)
        var temp = value
        for i in (24..<32).reversed() {
            data[i] = UInt8(temp & 0xFF)
            temp >>= 8
        }
        self.data = data
    }
    
    public init(data: Data) {
        precondition(data.count <= 32, "U256 cannot exceed 32 bytes")
        if data.count < 32 {
            var padded = Data(repeating: 0, count: 32 - data.count)
            padded.append(data)
            self.data = padded
        } else {
            self.data = data
        }
    }
    
    public static let zero = U256(0)
}

/// Block information for EVM execution context
public struct BlockInfo {
    public let number: UInt64
    public let timestamp: UInt64
    public let gasLimit: UInt64
    public let coinbase: Address
    public let baseFee: UInt64
    public let chainId: UInt64
    public let difficulty: UInt64
    public let prevRandao: Data
    
    public init(
        number: UInt64,
        timestamp: UInt64,
        gasLimit: UInt64,
        coinbase: Address,
        baseFee: UInt64,
        chainId: UInt64,
        difficulty: UInt64 = 0,
        prevRandao: Data = Data(repeating: 0, count: 32)
    ) {
        self.number = number
        self.timestamp = timestamp
        self.gasLimit = gasLimit
        self.coinbase = coinbase
        self.baseFee = baseFee
        self.chainId = chainId
        self.difficulty = difficulty
        self.prevRandao = prevRandao.count == 32 ? prevRandao : Data(repeating: 0, count: 32)
    }
}

/// Call type enumeration
public enum CallType: UInt8 {
    case call = 0
    case delegateCall = 1
    case staticCall = 2
    case create = 3
    case create2 = 4
}

/// Parameters for EVM call execution
public struct CallParameters {
    public let caller: Address
    public let to: Address
    public let value: U256
    public let input: Data
    public let gas: UInt64
    public let callType: CallType
    public let salt: U256?
    
    public init(
        caller: Address,
        to: Address,
        value: U256 = .zero,
        input: Data = Data(),
        gas: UInt64,
        callType: CallType = .call,
        salt: U256? = nil
    ) {
        self.caller = caller
        self.to = to
        self.value = value
        self.input = input
        self.gas = gas
        self.callType = callType
        self.salt = salt
    }
}

/// Result of EVM execution
public struct ExecutionResult {
    public let success: Bool
    public let gasLeft: UInt64
    public let output: Data
    public let error: String?
    
    public var gasUsed: UInt64 {
        // This would need the initial gas to calculate properly
        return 0
    }
}

/// Main EVM class for interacting with Guillotine
public class GuillotineEVM {
    private let handle: EvmHandle
    private let blockInfo: BlockInfo
    
    /// Global initialization (call once per process)
    public static func initialize() {
        guillotine_init()
    }
    
    /// Global cleanup (call once per process at exit)
    public static func cleanup() {
        guillotine_cleanup()
    }
    
    /// Create a new EVM instance with the given block information
    public init(blockInfo: BlockInfo) throws {
        // Ensure FFI is initialized
        Self.initialize()
        
        self.blockInfo = blockInfo
        
        // Create BlockInfoFFI structure
        var blockInfoFFI = BlockInfoFFI()
        blockInfoFFI.number = blockInfo.number
        blockInfoFFI.timestamp = blockInfo.timestamp
        blockInfoFFI.gas_limit = blockInfo.gasLimit
        blockInfoFFI.base_fee = blockInfo.baseFee
        blockInfoFFI.chain_id = blockInfo.chainId
        blockInfoFFI.difficulty = blockInfo.difficulty
        
        // Copy address and prevRandao bytes
        blockInfo.coinbase.bytes.withUnsafeBytes { bytes in
            memcpy(&blockInfoFFI.coinbase, bytes.baseAddress!, 20)
        }
        blockInfo.prevRandao.withUnsafeBytes { bytes in
            memcpy(&blockInfoFFI.prev_randao, bytes.baseAddress!, 32)
        }
        
        guard let handle = guillotine_evm_create(&blockInfoFFI) else {
            let error = String(cString: guillotine_get_last_error())
            throw EVMError.initializationFailed(error)
        }
        
        self.handle = handle
    }
    
    deinit {
        guillotine_evm_destroy(handle)
    }
    
    /// Set the balance of an account
    public func setBalance(address: Address, balance: U256) throws {
        var addressBytes = [UInt8](repeating: 0, count: 20)
        address.bytes.copyBytes(to: &addressBytes, count: 20)
        
        var balanceBytes = [UInt8](repeating: 0, count: 32)
        balance.data.copyBytes(to: &balanceBytes, count: 32)
        
        let success = guillotine_set_balance(handle, addressBytes, balanceBytes)
        if !success {
            let error = String(cString: guillotine_get_last_error())
            throw EVMError.operationFailed(error)
        }
    }
    
    /// Set the code for a contract
    public func setCode(address: Address, code: Data) throws {
        var addressBytes = [UInt8](repeating: 0, count: 20)
        address.bytes.copyBytes(to: &addressBytes, count: 20)
        
        let success = code.withUnsafeBytes { codeBytes in
            guillotine_set_code(handle, addressBytes, codeBytes.bindMemory(to: UInt8.self).baseAddress!, code.count)
        }
        
        if !success {
            let error = String(cString: guillotine_get_last_error())
            throw EVMError.operationFailed(error)
        }
    }
    
    /// Execute a call
    public func call(_ params: CallParameters) throws -> ExecutionResult {
        var callParams = CallParams()
        
        // Copy caller address
        params.caller.bytes.copyBytes(to: &callParams.caller, count: 20)
        
        // Copy to address
        params.to.bytes.copyBytes(to: &callParams.to, count: 20)
        
        // Copy value
        params.value.data.copyBytes(to: &callParams.value, count: 32)
        
        // Set input data
        callParams.input_len = params.input.count
        if params.input.count > 0 {
            callParams.input = params.input.withUnsafeBytes { bytes in
                bytes.bindMemory(to: UInt8.self).baseAddress!
            }
        } else {
            callParams.input = nil
        }
        
        // Set gas and call type
        callParams.gas = params.gas
        callParams.call_type = params.callType.rawValue
        
        // Set salt for CREATE2
        if let salt = params.salt {
            salt.data.copyBytes(to: &callParams.salt, count: 32)
        }
        
        // Execute the call
        guard let resultPtr = guillotine_call(handle, &callParams) else {
            let error = String(cString: guillotine_get_last_error())
            throw EVMError.callFailed(error)
        }
        
        defer {
            guillotine_free_result(resultPtr)
        }
        
        // Extract result data
        let result = resultPtr.pointee
        let success = result.success
        let gasLeft = result.gas_left
        
        var outputData = Data()
        if result.output_len > 0 && result.output != nil {
            outputData = Data(bytes: result.output, count: result.output_len)
        }
        
        var errorMessage: String? = nil
        if !success && result.error_message != nil {
            errorMessage = String(cString: result.error_message)
        }
        
        return ExecutionResult(
            success: success,
            gasLeft: gasLeft,
            output: outputData,
            error: errorMessage
        )
    }
    
    /// Simulate a call (doesn't commit state changes)
    public func simulate(_ params: CallParameters) throws -> ExecutionResult {
        var callParams = CallParams()
        
        // Copy caller address
        params.caller.bytes.copyBytes(to: &callParams.caller, count: 20)
        
        // Copy to address
        params.to.bytes.copyBytes(to: &callParams.to, count: 20)
        
        // Copy value
        params.value.data.copyBytes(to: &callParams.value, count: 32)
        
        // Set input data
        callParams.input_len = params.input.count
        if params.input.count > 0 {
            callParams.input = params.input.withUnsafeBytes { bytes in
                bytes.bindMemory(to: UInt8.self).baseAddress!
            }
        } else {
            callParams.input = nil
        }
        
        // Set gas and call type
        callParams.gas = params.gas
        callParams.call_type = params.callType.rawValue
        
        // Set salt for CREATE2
        if let salt = params.salt {
            salt.data.copyBytes(to: &callParams.salt, count: 32)
        }
        
        // Execute the simulation
        guard let resultPtr = guillotine_simulate(handle, &callParams) else {
            let error = String(cString: guillotine_get_last_error())
            throw EVMError.simulationFailed(error)
        }
        
        defer {
            guillotine_free_result(resultPtr)
        }
        
        // Extract result data
        let result = resultPtr.pointee
        let success = result.success
        let gasLeft = result.gas_left
        
        var outputData = Data()
        if result.output_len > 0 && result.output != nil {
            outputData = Data(bytes: result.output, count: result.output_len)
        }
        
        var errorMessage: String? = nil
        if !success && result.error_message != nil {
            errorMessage = String(cString: result.error_message)
        }
        
        return ExecutionResult(
            success: success,
            gasLeft: gasLeft,
            output: outputData,
            error: errorMessage
        )
    }
}

/// EVM errors
public enum EVMError: Error, LocalizedError {
    case initializationFailed(String)
    case operationFailed(String)
    case callFailed(String)
    case simulationFailed(String)
    case invalidAddress
    case invalidData
    
    public var errorDescription: String? {
        switch self {
        case .initializationFailed(let message):
            return "EVM initialization failed: \(message)"
        case .operationFailed(let message):
            return "Operation failed: \(message)"
        case .callFailed(let message):
            return "Call failed: \(message)"
        case .simulationFailed(let message):
            return "Simulation failed: \(message)"
        case .invalidAddress:
            return "Invalid address format"
        case .invalidData:
            return "Invalid data format"
        }
    }
}

// MARK: - Helper Extensions

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var index = hexString.startIndex
        
        for _ in 0..<len {
            let nextIndex = hexString.index(index, offsetBy: 2)
            guard let byte = UInt8(hexString[index..<nextIndex], radix: 16) else {
                return nil
            }
            data.append(byte)
            index = nextIndex
        }
        
        self = data
    }
}