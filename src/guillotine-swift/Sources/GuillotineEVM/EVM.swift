import Foundation
import GuillotineC
import GuillotinePrimitives

/// Ethereum Virtual Machine execution engine
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public final class EVM: @unchecked Sendable {
    private var vmPtr: OpaquePointer?
    private let lock = NSLock()
    
    /// Initialize EVM instance
    public init() throws {
        lock.lock()
        defer { lock.unlock() }
        
        let result = guillotine_init()
        guard result == GUILLOTINE_OK.rawValue else {
            throw GuillotineError(code: result)
        }
        
        guard let vm = guillotine_vm_create() else {
            guillotine_deinit()
            throw GuillotineError.memory
        }
        
        self.vmPtr = OpaquePointer(vm)
    }
    
    deinit {
        lock.lock()
        defer { lock.unlock() }
        
        if let vmPtr = vmPtr {
            guillotine_vm_destroy(UnsafeMutablePointer<GuillotineVm>(vmPtr))
            self.vmPtr = nil
        }
        
        guillotine_deinit()
    }
    
    /// Execute bytecode on the EVM
    public func execute(
        bytecode: Bytes,
        caller: Address = .zero,
        to: Address = .zero,
        value: U256 = .zero,
        input: Bytes = .empty,
        gasLimit: UInt64 = 1_000_000
    ) async throws -> ExecutionResult {
        try await withCheckedThrowingContinuation { continuation in
            Task.detached { [weak self] in
                do {
                    let result = try self?.executeSync(
                        bytecode: bytecode,
                        caller: caller,
                        to: to,
                        value: value,
                        input: input,
                        gasLimit: gasLimit
                    )
                    continuation.resume(returning: result ?? ExecutionResult(success: false, gasUsed: 0, errorMessage: "EVM instance deallocated"))
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// Synchronous execution (internal)
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
            throw GuillotineError.vmNotInitialized
        }
        
        let vm = UnsafeMutablePointer<GuillotineVm>(vmPtr)
        
        // Convert Swift types to C types
        var cCaller = caller.toCAddress()
        var cTo = to.toCAddress()
        var cValue = value.toCU256()
        
        // Set the bytecode in the VM
        let bytecodeBytes = bytecode.bytes
        let success = bytecodeBytes.withUnsafeBufferPointer { bytecodePtr in
            guillotine_set_code(vm, &cTo, bytecodePtr.baseAddress, bytecodeBytes.count)
        }
        
        guard success else {
            throw GuillotineError.executionFailed
        }
        
        // Execute the bytecode
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
        
        // Convert result
        let returnData: Bytes
        if result.output != nil && result.output_len > 0 {
            let data = Data(bytes: result.output, count: result.output_len)
            returnData = Bytes(data)
        } else {
            returnData = .empty
        }
        
        let errorMessage: String?
        if let errorPtr = result.error_message {
            errorMessage = String(cString: errorPtr)
        } else {
            errorMessage = nil
        }
        
        return ExecutionResult(
            success: result.success,
            gasUsed: result.gas_used,
            returnData: returnData,
            errorMessage: errorMessage
        )
    }
    
    /// Set balance for an account
    public func setBalance(_ address: Address, balance: U256) throws {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw GuillotineError.vmNotInitialized
        }
        
        let vm = UnsafeMutablePointer<GuillotineVm>(vmPtr)
        var cAddress = address.toCAddress()
        var cBalance = balance.toCU256()
        
        let success = guillotine_set_balance(vm, &cAddress, &cBalance)
        guard success else {
            throw GuillotineError.executionFailed
        }
    }
    
    /// Set code for a contract
    public func setCode(_ address: Address, code: Bytes) throws {
        lock.lock()
        defer { lock.unlock() }
        
        guard let vmPtr = vmPtr else {
            throw GuillotineError.vmNotInitialized
        }
        
        let vm = UnsafeMutablePointer<GuillotineVm>(vmPtr)
        var cAddress = address.toCAddress()
        let codeBytes = code.bytes
        
        let success = codeBytes.withUnsafeBufferPointer { codePtr in
            guillotine_set_code(vm, &cAddress, codePtr.baseAddress, codeBytes.count)
        }
        
        guard success else {
            throw GuillotineError.executionFailed
        }
    }
    
    /// Check if EVM is initialized
    public static var isInitialized: Bool {
        guillotine_is_initialized() != 0
    }
    
    /// Get Guillotine version
    public static var version: String {
        String(cString: guillotine_version())
    }
}