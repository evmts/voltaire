import Foundation
import GuillotinePrimitives

/// Complete transaction representation
public struct Transaction: Sendable {
    public let from: Address
    public let to: Address?  // nil for contract creation
    public let value: U256
    public let input: Bytes
    public let gasLimit: UInt64
    public let gasPrice: U256
    public let nonce: UInt64
    
    public init(
        from: Address,
        to: Address? = nil,
        value: U256 = .zero,
        input: Bytes = .empty,
        gasLimit: UInt64 = 1_000_000,
        gasPrice: U256 = 20_000_000_000, // 20 gwei
        nonce: UInt64 = 0
    ) {
        self.from = from
        self.to = to
        self.value = value
        self.input = input
        self.gasLimit = gasLimit
        self.gasPrice = gasPrice
        self.nonce = nonce
    }
    
    /// Whether this is a contract creation transaction
    public var isContractCreation: Bool {
        to == nil
    }
    
    /// Whether this is a regular call transaction
    public var isCall: Bool {
        to != nil
    }
}

/// Execution environment context
public struct ExecutionContext: Sendable {
    public let blockNumber: UInt64
    public let blockTimestamp: UInt64
    public let blockGasLimit: UInt64
    public let coinbase: Address  // Block miner
    public let difficulty: U256
    public let chainId: UInt64
    
    /// Default execution context for testing
    public static var `default`: ExecutionContext {
        ExecutionContext()
    }
    
    public init(
        blockNumber: UInt64 = 1,
        blockTimestamp: UInt64 = 0,
        blockGasLimit: UInt64 = 30_000_000,
        coinbase: Address = .zero,
        difficulty: U256 = 0x2540be400, // 10_000_000_000
        chainId: UInt64 = 1
    ) {
        self.blockNumber = blockNumber
        self.blockTimestamp = blockTimestamp
        self.blockGasLimit = blockGasLimit
        self.coinbase = coinbase
        self.difficulty = difficulty
        self.chainId = chainId
    }
}

// MARK: - Equatable Conformance

extension Transaction: Equatable {
    public static func == (lhs: Transaction, rhs: Transaction) -> Bool {
        lhs.from == rhs.from &&
        lhs.to == rhs.to &&
        lhs.value == rhs.value &&
        lhs.input == rhs.input &&
        lhs.gasLimit == rhs.gasLimit &&
        lhs.gasPrice == rhs.gasPrice &&
        lhs.nonce == rhs.nonce
    }
}

extension ExecutionContext: Equatable {
    public static func == (lhs: ExecutionContext, rhs: ExecutionContext) -> Bool {
        lhs.blockNumber == rhs.blockNumber &&
        lhs.blockTimestamp == rhs.blockTimestamp &&
        lhs.blockGasLimit == rhs.blockGasLimit &&
        lhs.coinbase == rhs.coinbase &&
        lhs.difficulty == rhs.difficulty &&
        lhs.chainId == rhs.chainId
    }
}

// MARK: - Hashable Conformance

extension Transaction: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(from)
        hasher.combine(to)
        hasher.combine(value)
        hasher.combine(input)
        hasher.combine(gasLimit)
        hasher.combine(gasPrice)
        hasher.combine(nonce)
    }
}

extension ExecutionContext: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(blockNumber)
        hasher.combine(blockTimestamp)
        hasher.combine(blockGasLimit)
        hasher.combine(coinbase)
        hasher.combine(difficulty)
        hasher.combine(chainId)
    }
}

// MARK: - CustomStringConvertible

extension Transaction: CustomStringConvertible {
    public var description: String {
        if let to = to {
            return "Transaction(from: \(from), to: \(to), value: \(value), gas: \(gasLimit))"
        } else {
            return "Transaction(from: \(from), deployment, value: \(value), gas: \(gasLimit))"
        }
    }
}

extension ExecutionContext: CustomStringConvertible {
    public var description: String {
        "ExecutionContext(block: \(blockNumber), timestamp: \(blockTimestamp), chain: \(chainId))"
    }
}