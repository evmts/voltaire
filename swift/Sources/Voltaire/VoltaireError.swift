import Foundation
import CVoltaire

/// Errors thrown by Voltaire operations
public enum VoltaireError: Error, Equatable {
    case invalidHex
    case invalidLength
    case invalidChecksum
    case outOfMemory
    case invalidInput
    case invalidSignature
    case invalidSelector
    case unsupportedType
    case maxLengthExceeded
    case invalidAccessList
    case invalidAuthorization
    case unknown(Int32)

    /// Initialize from C API error code
    init(code: Int32) {
        switch code {
        case PRIMITIVES_ERROR_INVALID_HEX:
            self = .invalidHex
        case PRIMITIVES_ERROR_INVALID_LENGTH:
            self = .invalidLength
        case PRIMITIVES_ERROR_INVALID_CHECKSUM:
            self = .invalidChecksum
        case PRIMITIVES_ERROR_OUT_OF_MEMORY:
            self = .outOfMemory
        case PRIMITIVES_ERROR_INVALID_INPUT:
            self = .invalidInput
        case PRIMITIVES_ERROR_INVALID_SIGNATURE:
            self = .invalidSignature
        case PRIMITIVES_ERROR_INVALID_SELECTOR:
            self = .invalidSelector
        case PRIMITIVES_ERROR_UNSUPPORTED_TYPE:
            self = .unsupportedType
        case PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED:
            self = .maxLengthExceeded
        case PRIMITIVES_ERROR_ACCESS_LIST_INVALID:
            self = .invalidAccessList
        case PRIMITIVES_ERROR_AUTHORIZATION_INVALID:
            self = .invalidAuthorization
        default:
            self = .unknown(code)
        }
    }
}

/// Check result code and throw if error
@inline(__always)
func checkResult(_ code: Int32) throws {
    if code != PRIMITIVES_SUCCESS {
        throw VoltaireError(code: code)
    }
}
