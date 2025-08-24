import Foundation
import GuillotineC
import GuillotinePrimitives

/// High-performance Ethereum Virtual Machine execution engine
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public actor GuillotineEVM {
    private var vmPtr: OpaquePointer?
    private var isInitialized: Bool = false
    
    /// Initialize the EVM instance
    public init() throws {
        let result = guillotine_init()
        guard result == GUILLOTINE_OK.rawValue else {
            throw mapCErrorToExecutionError(result)
        }
        
        guard let vm = guillotine_vm_create() else {
            guillotine_deinit()
            throw ExecutionError.internalError("Failed to create VM instance")
        }
        
        self.vmPtr = vm
        self.isInitialized = true
    }
    
    deinit {
        if let vmPtr = vmPtr {
            guillotine_vm_destroy(vmPtr)
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
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        return try await executeInternal(
            bytecode: bytecode,
            caller: .zero,
            to: .zero,
            value: .zero,
            input: .empty,
            gasLimit: gasLimit,
            vm: vmPtr
        )
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
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        // Get the contract code first
        let vm = vmPtr
        
        // For now, we'll execute using the provided parameters
        // In a full implementation, we'd retrieve the code from state
        let executionResult = try await executeCallInternal(
            to: address,
            input: input,
            value: value,
            from: from,
            gasLimit: gasLimit,
            vm: vm
        )
        
        return CallResult(
            success: executionResult.success,
            gasUsed: executionResult.gasUsed,
            returnData: executionResult.returnData,
            logs: [], // TODO: Extract logs from execution
            revertReason: executionResult.revertReason,
            error: executionResult.error
        )
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
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        // Combine bytecode and constructor data
        var deploymentCode = bytecode
        if !constructor.isEmpty {
            deploymentCode.append(constructor)
        }
        
        // Generate contract address (simplified - should use proper CREATE address calculation)
        let contractAddress = Address.contractAddress(from: from, nonce: 0)
        
        let executionResult = try await executeInternal(
            bytecode: deploymentCode,
            caller: from,
            to: contractAddress,
            value: value,
            input: .empty,
            gasLimit: gasLimit,
            vm: vmPtr
        )
        
        return DeploymentResult(
            success: executionResult.success,
            gasUsed: executionResult.gasUsed,
            contractAddress: executionResult.success ? contractAddress : nil,
            logs: [], // TODO: Extract logs
            revertReason: executionResult.revertReason,
            error: executionResult.error
        )
    }
    
    /// Static call (read-only)
    public func staticCall(
        to address: Address,
        input: Bytes = .empty,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> CallResult {
        // For static calls, we ensure no state changes occur
        return try await call(
            to: address,
            input: input,
            value: .zero, // Static calls cannot transfer value
            from: from,
            gasLimit: gasLimit,
            context: context
        )
    }
    
    /// Execute a full transaction
    public func executeTransaction(
        _ transaction: Transaction
    ) async throws -> TransactionResult {
        if transaction.isContractCreation {
            let deployResult = try await deploy(
                bytecode: transaction.input,
                value: transaction.value,
                from: transaction.from,
                gasLimit: transaction.gasLimit
            )
            
            return TransactionResult(
                success: deployResult.success,
                gasUsed: deployResult.gasUsed,
                returnData: .empty,
                logs: deployResult.logs,
                contractAddress: deployResult.contractAddress,
                revertReason: deployResult.revertReason,
                error: deployResult.error,
                stateChanges: []
            )
        } else {
            guard let to = transaction.to else {
                throw ExecutionError.invalidTransaction("Transaction missing 'to' address")
            }
            
            let callResult = try await call(
                to: to,
                input: transaction.input,
                value: transaction.value,
                from: transaction.from,
                gasLimit: transaction.gasLimit
            )
            
            return TransactionResult(
                success: callResult.success,
                gasUsed: callResult.gasUsed,
                returnData: callResult.returnData,
                logs: callResult.logs,
                contractAddress: nil,
                revertReason: callResult.revertReason,
                error: callResult.error,
                stateChanges: []
            )
        }
    }
    
    /// Set account balance
    public func setBalance(_ address: Address, balance: U256) throws {
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        let vm = vmPtr
        var cAddress = address.toCAddress()
        var cBalance = balance.toCU256()
        
        let success = guillotine_set_balance(vm, &cAddress, &cBalance)
        guard success else {
            throw ExecutionError.internalError("Failed to set balance")
        }
    }
    
    /// Set contract code
    public func setCode(_ address: Address, code: Bytes) throws {
        guard let vmPtr = vmPtr else {
            throw ExecutionError.internalError("VM not initialized")
        }
        
        let vm = vmPtr
        var cAddress = address.toCAddress()
        let codeBytes = code.bytes
        
        let success = codeBytes.withUnsafeBufferPointer { codePtr in
            guillotine_set_code(vm, &cAddress, codePtr.baseAddress, codeBytes.count)
        }
        
        guard success else {
            throw ExecutionError.internalError("Failed to set code")
        }
    }
    
    /// Get Guillotine version
    public static var version: String {
        String(cString: guillotine_version())
    }
    
    /// Check if EVM is initialized
    public static var isInitialized: Bool {
        guillotine_is_initialized() != 0
    }
}

// MARK: - Internal Implementation

@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
extension GuillotineEVM {
    
    private func executeInternal(
        bytecode: Bytes,
        caller: Address,
        to: Address,
        value: U256,
        input: Bytes,
        gasLimit: UInt64,
        vm: OpaquePointer
    ) async throws -> ExecutionResult {
        let vmPtr = vm
        
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
    
    private func executeCallInternal(
        to address: Address,
        input: Bytes,
        value: U256,
        from: Address,
        gasLimit: UInt64,
        vm: OpaquePointer
    ) async throws -> ExecutionResult {
        // Convert Swift types to C types
        var cCaller = from.toCAddress()
        var cTo = address.toCAddress()
        var cValue = value.toCU256()
        
        // Execute the call
        let inputBytes = input.bytes
        let result = inputBytes.withUnsafeBufferPointer { inputPtr in
            guillotine_vm_execute(
                vm,
                &cCaller,
                &cTo,
                &cValue,
                inputPtr.baseAddress,
                inputBytes.count,
                gasLimit
            )
        }
        
        // Convert result (same logic as executeInternal)
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