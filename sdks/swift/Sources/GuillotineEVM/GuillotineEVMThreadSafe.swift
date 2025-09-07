import Foundation
import GuillotineC
import GuillotinePrimitives

/// Thread-safe Ethereum Virtual Machine execution engine (non-actor implementation)
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public final class GuillotineEVMThreadSafe: @unchecked Sendable {
    private var vmPtr: OpaquePointer?
    private var isInitialized: Bool = false
    private let lock = NSLock()
    
    /// Initialize the EVM instance using lazy initialization pattern
    public init() throws {
        lock.lock()
        defer { lock.unlock() }
        
        // LAZY INITIALIZATION: Ensure C library is initialized only when needed
        try GuillotineLazyInit.shared.ensureInitialized()
        
        guard let vm = guillotine_vm_create() else {
            throw ExecutionError.internalError("Failed to create VM instance")
        }
        
        self.vmPtr = vm
        self.isInitialized = true
    }
    
    deinit {
        lock.lock()
        defer { lock.unlock() }
        
        if let vmPtr = vmPtr {
            guillotine_vm_destroy(vmPtr)
            self.vmPtr = nil
        }
        if isInitialized {
            guillotine_deinit()
        }
    }
    
    /// Execute bytecode with simple parameters
    public func execute(
        bytecode: Bytes,
        gasLimit: UInt64 = 1_000_000
    ) async throws -> ExecutionResult {
        return try await withUnsafeThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                do {
                    let result = try self?.executeSync(
                        bytecode: bytecode,
                        caller: .zero,
                        to: .zero,
                        value: .zero,
                        input: .empty,
                        gasLimit: gasLimit
                    )
                    continuation.resume(returning: result ?? ExecutionResult(success: false, gasUsed: 0, error: ExecutionError.internalError("EVM deallocated")))
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Execute a contract call
    public func call(
        to address: Address,
        input: Bytes = .empty,
        value: U256 = .zero,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> CallResult {
        return try await withUnsafeThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                do {
                    let executionResult = try self?.executeCallSync(
                        to: address,
                        input: input,
                        value: value,
                        from: from,
                        gasLimit: gasLimit
                    )
                    
                    guard let result = executionResult else {
                        continuation.resume(throwing: ExecutionError.internalError("EVM deallocated"))
                        return
                    }
                    
                    let callResult = CallResult(
                        success: result.success,
                        gasUsed: result.gasUsed,
                        returnData: result.returnData,
                        logs: [],
                        revertReason: result.revertReason,
                        error: result.error
                    )
                    continuation.resume(returning: callResult)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Deploy a new contract
    public func deploy(
        bytecode: Bytes,
        constructor: Bytes = .empty,
        value: U256 = .zero,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> DeploymentResult {
        return try await withUnsafeThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                do {
                    var deploymentCode = bytecode
                    if !constructor.isEmpty {
                        deploymentCode.append(constructor)
                    }
                    
                    let contractAddress = Address.contractAddress(from: from, nonce: 0)
                    
                    let executionResult = try self?.executeSync(
                        bytecode: deploymentCode,
                        caller: from,
                        to: contractAddress,
                        value: value,
                        input: .empty,
                        gasLimit: gasLimit
                    )
                    
                    guard let result = executionResult else {
                        continuation.resume(throwing: ExecutionError.internalError("EVM deallocated"))
                        return
                    }
                    
                    let deployResult = DeploymentResult(
                        success: result.success,
                        gasUsed: result.gasUsed,
                        contractAddress: result.success ? contractAddress : nil,
                        logs: [],
                        revertReason: result.revertReason,
                        error: result.error
                    )
                    continuation.resume(returning: deployResult)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Set account balance
    public func setBalance(_ address: Address, balance: U256) async throws {
        return try await withUnsafeThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                do {
                    try self?.setBalanceSync(address, balance: balance)
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Set contract code
    public func setCode(_ address: Address, code: Bytes) async throws {
        return try await withUnsafeThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                do {
                    try self?.setCodeSync(address, code: code)
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Get Guillotine version (safe to call without initialization)
    public static var version: String {
        return GuillotineLazyInit.shared.version
    }
    
    /// Check if EVM is initialized
    public static var isInitialized: Bool {
        return GuillotineLazyInit.shared.isInitialized
    }
}

// MARK: - Private Synchronous Methods

@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
extension GuillotineEVMThreadSafe {
    
    private func executeSync(
        bytecode: Bytes,
        caller: Address,
        to: Address,
        value: U256,
        input: Bytes,
        gasLimit: UInt64
    ) throws -> ExecutionResult {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        // Convert Swift types to C types
        var cCaller = caller.toCAddress()
        var cTo = to.toCAddress()
        var cValue = value.toCU256()
        
        // Set the bytecode in the VM
        let bytecodeBytes = bytecode.bytes
        let success = bytecodeBytes.withUnsafeBufferPointer { bytecodePtr in
            guillotine_set_code(vmPtr, &cTo, bytecodePtr.baseAddress, bytecodeBytes.count)
        }
        
        guard success else {
            throw ExecutionError.internalError("Failed to set bytecode")
        }
        
        // Execute the bytecode
        let inputBytes = input.bytes
        let result = inputBytes.withUnsafeBufferPointer { inputPtr in
            guillotine_vm_execute(
                vmPtr,
                &cCaller,
                &cTo,
                &cValue,
                inputPtr.baseAddress,
                inputBytes.count,
                gasLimit
            )
        }
        
        // Convert result
        let returnData: Bytes
        if result.output != nil && result.output_len > 0 {
            let data = Data(bytes: result.output, count: result.output_len)
            returnData = Bytes(data)
        } else {
            returnData = .empty
        }
        
        let revertReason: String?
        let error: ExecutionError?
        
        if result.success {
            revertReason = nil
            error = nil
        } else if let errorPtr = result.error_message {
            let errorMsg = String(cString: errorPtr)
            if errorMsg.hasPrefix("revert") {
                revertReason = errorMsg
                error = nil
            } else {
                revertReason = nil
                error = ExecutionError.internalError(errorMsg)
            }
        } else {
            revertReason = nil
            error = ExecutionError.internalError("Unknown execution failure")
        }
        
        return ExecutionResult(
            success: result.success,
            gasUsed: result.gas_used,
            returnData: returnData,
            revertReason: revertReason,
            error: error
        )
    }
    
    private func executeCallSync(
        to address: Address,
        input: Bytes,
        value: U256,
        from: Address,
        gasLimit: UInt64
    ) throws -> ExecutionResult {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        // Convert Swift types to C types
        var cCaller = from.toCAddress()
        var cTo = address.toCAddress()
        var cValue = value.toCU256()
        
        // Execute the call
        let inputBytes = input.bytes
        let result = inputBytes.withUnsafeBufferPointer { inputPtr in
            guillotine_vm_execute(
                vmPtr,
                &cCaller,
                &cTo,
                &cValue,
                inputPtr.baseAddress,
                inputBytes.count,
                gasLimit
            )
        }
        
        // Convert result (same logic as executeSync)
        let returnData: Bytes
        if result.output != nil && result.output_len > 0 {
            let data = Data(bytes: result.output, count: result.output_len)
            returnData = Bytes(data)
        } else {
            returnData = .empty
        }
        
        let revertReason: String?
        let error: ExecutionError?
        
        if result.success {
            revertReason = nil
            error = nil
        } else if let errorPtr = result.error_message {
            let errorMsg = String(cString: errorPtr)
            if errorMsg.hasPrefix("revert") {
                revertReason = errorMsg
                error = nil
            } else {
                revertReason = nil
                error = ExecutionError.internalError(errorMsg)
            }
        } else {
            revertReason = nil
            error = ExecutionError.internalError("Unknown execution failure")
        }
        
        return ExecutionResult(
            success: result.success,
            gasUsed: result.gas_used,
            returnData: returnData,
            revertReason: revertReason,
            error: error
        )
    }
    
    private func setBalanceSync(_ address: Address, balance: U256) throws {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        var cAddress = address.toCAddress()
        var cBalance = balance.toCU256()
        
        let success = guillotine_set_balance(vmPtr, &cAddress, &cBalance)
        guard success else {
            throw ExecutionError.internalError("Failed to set balance")
        }
    }
    
    private func setCodeSync(_ address: Address, code: Bytes) throws {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        var cAddress = address.toCAddress()
        let codeBytes = code.bytes
        
        let success = codeBytes.withUnsafeBufferPointer { codePtr in
            guillotine_set_code(vmPtr, &cAddress, codePtr.baseAddress, codeBytes.count)
        }
        
        guard success else {
            throw ExecutionError.internalError("Failed to set code")
        }
    }
}

// MARK: - Error Mapping

private func mapCErrorToExecutionError(_ errorCode: Int32) -> ExecutionError {
    switch errorCode {
    case Int32(GUILLOTINE_ERROR_MEMORY.rawValue):
        return .outOfMemory
    case Int32(GUILLOTINE_ERROR_INVALID_PARAM.rawValue):
        return .invalidTransaction("Invalid parameter")
    case Int32(GUILLOTINE_ERROR_VM_NOT_INITIALIZED.rawValue):
        return .internalError("VM not initialized")
    case Int32(GUILLOTINE_ERROR_EXECUTION_FAILED.rawValue):
        return .internalError("Execution failed")
    case Int32(GUILLOTINE_ERROR_INVALID_ADDRESS.rawValue):
        return .invalidTransaction("Invalid address")
    case Int32(GUILLOTINE_ERROR_INVALID_BYTECODE.rawValue):
        return .invalidTransaction("Invalid bytecode")
    default:
        return .internalError("Unknown error code: \(errorCode)")
    }
}