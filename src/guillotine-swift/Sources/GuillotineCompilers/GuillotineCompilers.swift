import Foundation
import GuillotinePrimitives

/// Solidity compiler interface (placeholder for future implementation)
public struct SolidityCompiler: Sendable {
    
    /// Compile Solidity source code
    public static func compile(_ source: String) throws -> CompileResult {
        // TODO: Implement Solidity compilation
        throw CompilerError.notImplemented
    }
}

/// Vyper compiler interface (placeholder for future implementation)
public struct VyperCompiler: Sendable {
    
    /// Compile Vyper source code
    public static func compile(_ source: String) throws -> CompileResult {
        // TODO: Implement Vyper compilation
        throw CompilerError.notImplemented
    }
}

/// Compilation result
public struct CompileResult: Sendable {
    /// Compiled bytecode
    public let bytecode: Bytes
    
    /// Contract ABI
    public let abi: String
    
    /// Source map
    public let sourceMap: String?
    
    public init(bytecode: Bytes, abi: String, sourceMap: String? = nil) {
        self.bytecode = bytecode
        self.abi = abi
        self.sourceMap = sourceMap
    }
}

/// Compiler errors
public enum CompilerError: Error, Sendable {
    case notImplemented
    case compilationFailed(String)
    case invalidSource
}

extension CompilerError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .notImplemented:
            return "Compiler not yet implemented"
        case .compilationFailed(let message):
            return "Compilation failed: \(message)"
        case .invalidSource:
            return "Invalid source code"
        }
    }
}