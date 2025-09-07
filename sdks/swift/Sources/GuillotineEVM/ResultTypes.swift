import Foundation
import GuillotinePrimitives

/// Enhanced execution result with comprehensive information
public struct ExecutionResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let revertReason: String?
    public let error: ExecutionError?
    
    public init(
        success: Bool,
        gasUsed: UInt64,
        returnData: Bytes = .empty,
        revertReason: String? = nil,
        error: ExecutionError? = nil
    ) {
        self.success = success
        self.gasUsed = gasUsed
        self.returnData = returnData
        self.revertReason = revertReason
        self.error = error
    }
    
    /// Whether execution was successful
    public var isSuccess: Bool { success }
    
    /// Whether execution reverted
    public var isRevert: Bool { !success && revertReason != nil }
    
    /// Whether execution had an error
    public var isError: Bool { error != nil }
}

/// Contract call result with logs and detailed information
public struct CallResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let logs: [Log]
    public let revertReason: String?
    public let error: ExecutionError?
    
    public init(
        success: Bool,
        gasUsed: UInt64,
        returnData: Bytes = .empty,
        logs: [Log] = [],
        revertReason: String? = nil,
        error: ExecutionError? = nil
    ) {
        self.success = success
        self.gasUsed = gasUsed
        self.returnData = returnData
        self.logs = logs
        self.revertReason = revertReason
        self.error = error
    }
    
    /// Whether call was successful
    public var isSuccess: Bool { success }
    
    /// Whether call reverted
    public var isRevert: Bool { !success && revertReason != nil }
    
    /// Whether call had an error
    public var isError: Bool { error != nil }
}

/// Contract deployment result
public struct DeploymentResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let contractAddress: Address?
    public let logs: [Log]
    public let revertReason: String?
    public let error: ExecutionError?
    
    public init(
        success: Bool,
        gasUsed: UInt64,
        contractAddress: Address? = nil,
        logs: [Log] = [],
        revertReason: String? = nil,
        error: ExecutionError? = nil
    ) {
        self.success = success
        self.gasUsed = gasUsed
        self.contractAddress = contractAddress
        self.logs = logs
        self.revertReason = revertReason
        self.error = error
    }
    
    /// Whether deployment was successful
    public var isSuccess: Bool { success }
    
    /// Whether deployment reverted
    public var isRevert: Bool { !success && revertReason != nil }
    
    /// Whether deployment had an error
    public var isError: Bool { error != nil }
}

/// Complete transaction result with state changes
public struct TransactionResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let logs: [Log]
    public let contractAddress: Address?
    public let revertReason: String?
    public let error: ExecutionError?
    public let stateChanges: [StateChange]
    
    public init(
        success: Bool,
        gasUsed: UInt64,
        returnData: Bytes = .empty,
        logs: [Log] = [],
        contractAddress: Address? = nil,
        revertReason: String? = nil,
        error: ExecutionError? = nil,
        stateChanges: [StateChange] = []
    ) {
        self.success = success
        self.gasUsed = gasUsed
        self.returnData = returnData
        self.logs = logs
        self.contractAddress = contractAddress
        self.revertReason = revertReason
        self.error = error
        self.stateChanges = stateChanges
    }
    
    /// Whether transaction was successful
    public var isSuccess: Bool { success }
    
    /// Whether transaction reverted
    public var isRevert: Bool { !success && revertReason != nil }
    
    /// Whether transaction had an error
    public var isError: Bool { error != nil }
}

/// EVM event log
public struct Log: Sendable {
    public let address: Address
    public let topics: [U256]
    public let data: Bytes
    
    public init(address: Address, topics: [U256], data: Bytes) {
        self.address = address
        self.topics = topics
        self.data = data
    }
}

/// State change tracking
public struct StateChange: Sendable {
    public enum Kind: Sendable {
        case balanceChange(Address, old: U256, new: U256)
        case nonceChange(Address, old: UInt64, new: UInt64)
        case codeChange(Address, old: Bytes, new: Bytes)
        case storageChange(Address, key: U256, old: U256, new: U256)
        case accountCreation(Address)
        case accountDestruction(Address)
    }
    
    public let kind: Kind
    public let gasUsed: UInt64
    
    public init(kind: Kind, gasUsed: UInt64 = 0) {
        self.kind = kind
        self.gasUsed = gasUsed
    }
}

// MARK: - Equatable Conformance

extension ExecutionResult: Equatable {
    public static func == (lhs: ExecutionResult, rhs: ExecutionResult) -> Bool {
        lhs.success == rhs.success &&
        lhs.gasUsed == rhs.gasUsed &&
        lhs.returnData == rhs.returnData &&
        lhs.revertReason == rhs.revertReason
    }
}

extension CallResult: Equatable {
    public static func == (lhs: CallResult, rhs: CallResult) -> Bool {
        lhs.success == rhs.success &&
        lhs.gasUsed == rhs.gasUsed &&
        lhs.returnData == rhs.returnData &&
        lhs.logs == rhs.logs &&
        lhs.revertReason == rhs.revertReason
    }
}

extension DeploymentResult: Equatable {
    public static func == (lhs: DeploymentResult, rhs: DeploymentResult) -> Bool {
        lhs.success == rhs.success &&
        lhs.gasUsed == rhs.gasUsed &&
        lhs.contractAddress == rhs.contractAddress &&
        lhs.logs == rhs.logs &&
        lhs.revertReason == rhs.revertReason
    }
}

extension TransactionResult: Equatable {
    public static func == (lhs: TransactionResult, rhs: TransactionResult) -> Bool {
        lhs.success == rhs.success &&
        lhs.gasUsed == rhs.gasUsed &&
        lhs.returnData == rhs.returnData &&
        lhs.logs == rhs.logs &&
        lhs.contractAddress == rhs.contractAddress &&
        lhs.revertReason == rhs.revertReason &&
        lhs.stateChanges == rhs.stateChanges
    }
}

extension Log: Equatable {
    public static func == (lhs: Log, rhs: Log) -> Bool {
        lhs.address == rhs.address &&
        lhs.topics == rhs.topics &&
        lhs.data == rhs.data
    }
}

extension StateChange: Equatable {
    public static func == (lhs: StateChange, rhs: StateChange) -> Bool {
        lhs.gasUsed == rhs.gasUsed &&
        lhs.kind == rhs.kind
    }
}

extension StateChange.Kind: Equatable {
    public static func == (lhs: StateChange.Kind, rhs: StateChange.Kind) -> Bool {
        switch (lhs, rhs) {
        case let (.balanceChange(lAddr, lOld, lNew), .balanceChange(rAddr, rOld, rNew)):
            return lAddr == rAddr && lOld == rOld && lNew == rNew
        case let (.nonceChange(lAddr, lOld, lNew), .nonceChange(rAddr, rOld, rNew)):
            return lAddr == rAddr && lOld == rOld && lNew == rNew
        case let (.codeChange(lAddr, lOld, lNew), .codeChange(rAddr, rOld, rNew)):
            return lAddr == rAddr && lOld == rOld && lNew == rNew
        case let (.storageChange(lAddr, lKey, lOld, lNew), .storageChange(rAddr, rKey, rOld, rNew)):
            return lAddr == rAddr && lKey == rKey && lOld == rOld && lNew == rNew
        case let (.accountCreation(lAddr), .accountCreation(rAddr)):
            return lAddr == rAddr
        case let (.accountDestruction(lAddr), .accountDestruction(rAddr)):
            return lAddr == rAddr
        default:
            return false
        }
    }
}

// MARK: - CustomStringConvertible

extension ExecutionResult: CustomStringConvertible {
    public var description: String {
        if success {
            return "ExecutionResult(success: true, gasUsed: \(gasUsed), returnData: \(returnData))"
        } else if let reason = revertReason {
            return "ExecutionResult(reverted: \(reason), gasUsed: \(gasUsed))"
        } else if let error = error {
            return "ExecutionResult(error: \(error), gasUsed: \(gasUsed))"
        } else {
            return "ExecutionResult(failed, gasUsed: \(gasUsed))"
        }
    }
}