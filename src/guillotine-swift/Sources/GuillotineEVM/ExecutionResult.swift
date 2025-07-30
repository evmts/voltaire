import Foundation
import GuillotinePrimitives

/// Result of EVM bytecode execution
public struct ExecutionResult: Sendable {
    /// Whether execution was successful
    public let success: Bool
    
    /// Amount of gas consumed
    public let gasUsed: UInt64
    
    /// Return data from execution
    public let returnData: Bytes
    
    /// Error message (if execution failed)
    public let errorMessage: String?
    
    /// Create execution result
    public init(
        success: Bool,
        gasUsed: UInt64,
        returnData: Bytes = .empty,
        errorMessage: String? = nil
    ) {
        self.success = success
        self.gasUsed = gasUsed
        self.returnData = returnData
        self.errorMessage = errorMessage
    }
    
    /// Check if execution was successful
    public var isSuccess: Bool {
        success
    }
    
    /// Check if execution reverted
    public var isRevert: Bool {
        !success && errorMessage != nil
    }
}

// MARK: - Equatable
extension ExecutionResult: Equatable {
    public static func == (lhs: ExecutionResult, rhs: ExecutionResult) -> Bool {
        lhs.success == rhs.success &&
        lhs.gasUsed == rhs.gasUsed &&
        lhs.returnData == rhs.returnData &&
        lhs.errorMessage == rhs.errorMessage
    }
}

// MARK: - CustomStringConvertible
extension ExecutionResult: CustomStringConvertible {
    public var description: String {
        if success {
            return "ExecutionResult(success: true, gasUsed: \(gasUsed), returnData: \(returnData.hexString))"
        } else {
            let error = errorMessage ?? "unknown error"
            return "ExecutionResult(success: false, gasUsed: \(gasUsed), error: \(error))"
        }
    }
}