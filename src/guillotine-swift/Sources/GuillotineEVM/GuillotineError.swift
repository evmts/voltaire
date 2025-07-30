import Foundation
import GuillotineC

/// Errors that can occur during EVM operations
public enum GuillotineError: Error, Sendable {
    case ok
    case memory
    case invalidParam
    case vmNotInitialized
    case executionFailed
    case invalidAddress
    case invalidBytecode
    case unknown(Int32)
    
    /// Create from C error code
    internal init(code: Int32) {
        switch code {
        case GUILLOTINE_OK.rawValue:
            self = .ok
        case GUILLOTINE_ERROR_MEMORY.rawValue:
            self = .memory
        case GUILLOTINE_ERROR_INVALID_PARAM.rawValue:
            self = .invalidParam
        case GUILLOTINE_ERROR_VM_NOT_INITIALIZED.rawValue:
            self = .vmNotInitialized
        case GUILLOTINE_ERROR_EXECUTION_FAILED.rawValue:
            self = .executionFailed
        case GUILLOTINE_ERROR_INVALID_ADDRESS.rawValue:
            self = .invalidAddress
        case GUILLOTINE_ERROR_INVALID_BYTECODE.rawValue:
            self = .invalidBytecode
        default:
            self = .unknown(code)
        }
    }
}

extension GuillotineError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .ok:
            return "Success"
        case .memory:
            return "Memory allocation error"
        case .invalidParam:
            return "Invalid parameter"
        case .vmNotInitialized:
            return "EVM not initialized"
        case .executionFailed:
            return "Execution failed"
        case .invalidAddress:
            return "Invalid address"
        case .invalidBytecode:
            return "Invalid bytecode"
        case .unknown(let code):
            return "Unknown error code: \(code)"
        }
    }
}