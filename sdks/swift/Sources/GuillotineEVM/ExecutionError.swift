import Foundation
import GuillotinePrimitives

/// Comprehensive execution errors for EVM operations
public enum ExecutionError: Error, Sendable {
    case outOfGas
    case stackUnderflow
    case stackOverflow
    case invalidOpcode(UInt8)
    case invalidJumpDestination(UInt64)
    case revert(String?)
    case outOfMemory
    case callDepthExceeded
    case insufficientBalance
    case accountNotFound(Address)
    case codeNotFound(Address)
    case invalidTransaction(String)
    case internalError(String)
}

extension ExecutionError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .outOfGas:
            return "Execution ran out of gas"
        case .stackUnderflow:
            return "Stack underflow occurred"
        case .stackOverflow:
            return "Stack overflow occurred"
        case .invalidOpcode(let opcode):
            return "Invalid opcode: 0x\(String(opcode, radix: 16, uppercase: true))"
        case .invalidJumpDestination(let pc):
            return "Invalid jump destination: \(pc)"
        case .revert(let reason):
            return "Execution reverted" + (reason.map { ": \($0)" } ?? "")
        case .outOfMemory:
            return "Out of memory"
        case .callDepthExceeded:
            return "Call depth exceeded"
        case .insufficientBalance:
            return "Insufficient balance"
        case .accountNotFound(let address):
            return "Account not found: \(address)"
        case .codeNotFound(let address):
            return "Code not found for address: \(address)"
        case .invalidTransaction(let reason):
            return "Invalid transaction: \(reason)"
        case .internalError(let message):
            return "Internal error: \(message)"
        }
    }
}

/// State management errors
public enum StateError: Error, Sendable {
    case accountNotFound(Address)
    case invalidBalance
    case invalidNonce
    case storageError(String)
    case snapshotError(String)
}

extension StateError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .accountNotFound(let address):
            return "Account not found: \(address)"
        case .invalidBalance:
            return "Invalid balance value"
        case .invalidNonce:
            return "Invalid nonce value"
        case .storageError(let message):
            return "Storage error: \(message)"
        case .snapshotError(let message):
            return "Snapshot error: \(message)"
        }
    }
}