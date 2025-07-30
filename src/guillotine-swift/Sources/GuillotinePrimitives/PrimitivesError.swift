import Foundation

/// Errors that can occur when working with Ethereum primitives
public enum PrimitivesError: Error, Sendable {
    case invalidLength(expected: Int, actual: Int)
    case invalidHexLength(expected: Int, actual: Int)
    case invalidHexString(String)
    case overflow
    case underflow
}

extension PrimitivesError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .invalidLength(let expected, let actual):
            return "Invalid length: expected \(expected) bytes, got \(actual)"
        case .invalidHexLength(let expected, let actual):
            return "Invalid hex length: expected \(expected) characters, got \(actual)"
        case .invalidHexString(let hex):
            return "Invalid hex string: \(hex)"
        case .overflow:
            return "Arithmetic overflow"
        case .underflow:
            return "Arithmetic underflow"
        }
    }
}