"""
Comprehensive examples for Guillotine EVM Python bindings.

This file demonstrates the full API with practical usage examples.
"""

from guillotine_evm import (
    # Core EVM
    EVM, ExecutionResult, DeployResult, HardFork,
    
    # Primitives
    Address, U256, Hash,
    
    # Bytecode Analysis
    Bytecode, Opcode, Instruction,
    
    # Optimization
    Planner, Plan,
    
    # Precompiles
    ECPoint, ecrecover, sha256, identity, modexp,
    is_precompile_address, create_precompile_address,
    
    # Exceptions
    GuillotineError, ExecutionError, InvalidBytecodeError
)


def example_basic_execution():
    """Example: Basic EVM bytecode execution."""
    print("=== Basic EVM Execution ===")
    
    # Simple bytecode: PUSH1 5, PUSH1 3, ADD, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
    bytecode_hex = "60056003016000526020600052"
    
    with EVM() as evm:
        # Execute bytecode
        result = evm.execute(
            bytecode=bytes.fromhex(bytecode_hex),
            gas_limit=100000
        )
        
        print(f"Success: {result.success}")
        print(f"Gas used: {result.gas_used}")
        print(f"Return data: {result.return_data.hex()}")
        print()


def example_contract_deployment():
    """Example: Contract deployment and interaction."""
    print("=== Contract Deployment ===")
    
    deployer = Address.from_hex("0x1234567890123456789012345678901234567890")
    
    # Simple contract that stores and returns a value
    deployment_bytecode = bytes.fromhex(
        "608060405234801561001057600080fd5b50"  # Constructor
        "6042600081905550"                        # Store 42 in slot 0
        "600a80601e6000396000f3fe"              # Return runtime code
        "60008054"                               # Runtime: SLOAD slot 0
        "60005260206000f3"                       # Return 32 bytes from memory
    )
    
    with EVM() as evm:
        # Set up deployer balance
        evm.set_balance(deployer, U256.from_ether(10))
        
        # Deploy contract
        deploy_result = evm.deploy(
            bytecode=deployment_bytecode,
            caller=deployer,
            gas_limit=500000
        )
        
        if deploy_result.success:
            contract_addr = deploy_result.contract_address
            print(f"Contract deployed at: {contract_addr}")
            print(f"Deployment gas used: {deploy_result.gas_used}")
            
            # Call the contract
            call_result = evm.call(
                to=contract_addr,
                caller=deployer,
                gas_limit=100000
            )
            
            if call_result.success:
                print(f"Call gas used: {call_result.gas_used}")
                print(f"Return data: {call_result.return_data.hex()}")
            else:
                print(f"Call failed: {call_result.error}")
        else:
            print(f"Deployment failed: {deploy_result.error}")
        
        print()


def example_bytecode_analysis():
    """Example: Comprehensive bytecode analysis."""
    print("=== Bytecode Analysis ===")
    
    # Analyze complex bytecode
    bytecode_hex = "608060405234801561001057600080fd5b506004361061004c5760003560e01c8063095ea7b31461005157806318160ddd1461008157806323b872dd146100a1578063a9059cbb146100d1575b600080fd5b61006b6004803603810190610066919061032b565b610101565b60405161007891906103c9565b60405180910390f35b6100896101f3565b60405161009891906103e4565b60405180910390f35b6100bb60048036038101906100b691906102dc565b6101f9565b6040516100c891906103c9565b60405180910390f35b6100eb60048036038101906100e6919061032b565b610358565b6040516100f891906103c9565b60405180910390f35b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156101c0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101b7906103a4565b60405180910390fd5b82816101cc919061041e565b600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506001905092915050565b60005481565b6000600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156102b3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102aa906103a4565b60405180910390fd5b82816102bf919061041e565b600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161034b91906103e4565b60405180910390a3600190509392505050565b6000610365338484610358565b905092915050565b60008135905061037c8161057e565b92915050565b60008135905061039181610595565b92915050565b6000813590506103a6816105ac565b92915050565b6103b5816104e8565b82525050565b6103c4816104fe565b82525050565b60006020820190506103df60008301846103ac565b92915050565b60006020820190506103fa60008301846103bb565b92915050565b60006060820190506104156000830186610397565b610422602083018561036d565b61042f6040830184610397565b949350505050565b600061044282610508565b915061044d83610508565b92508282101561046057610465565b61046482610508565b5b92915050565b60006104738261052c565b9050919050565b600061048582610468565b9050919050565b60008190506104738161047a565b60006104a582610468565b9050919050565b60006104b78261049a565b9050919050565b600081905091905056"
    
    try:
        # Create and analyze bytecode
        bytecode = Bytecode.from_hex(bytecode_hex)
        print(f"Bytecode length: {len(bytecode)} bytes")
        
        # Get detailed statistics
        stats = bytecode.statistics()
        print(f"Instructions: {stats.instruction_count}")
        print(f"Unique opcodes: {stats.unique_opcodes}")
        print(f"PUSH instructions: {stats.push_count}")
        print(f"JUMP instructions: {stats.jump_count}")
        print(f"Invalid opcodes: {stats.invalid_opcode_count}")
        print(f"Estimated gas: {stats.gas_estimate}")
        print(f"Complexity score: {stats.complexity_score:.2f}")
        
        # Find jump destinations
        jump_dests = list(bytecode.jump_destinations())
        print(f"Jump destinations: {jump_dests[:5]}..." if len(jump_dests) > 5 else f"Jump destinations: {jump_dests}")
        
        # Show first few instructions
        print("First 5 instructions:")
        for i, (pc, instruction) in enumerate(bytecode.instructions()):
            if i >= 5:
                break
            print(f"  PC {pc:04x}: {instruction}")
        
    except InvalidBytecodeError as e:
        print(f"Invalid bytecode: {e}")
    
    print()


def example_bytecode_optimization():
    """Example: Bytecode optimization with planner."""
    print("=== Bytecode Optimization ===")
    
    # Simple bytecode with optimization opportunities
    simple_bytecode = Bytecode.from_hex("6001600201600052600a6000f3")  # PUSH1 1, PUSH1 2, ADD, PUSH1 0, MSTORE, PUSH1 10, PUSH1 0, RETURN
    
    try:
        with Planner() as planner:
            # Analyze original bytecode
            original_stats = simple_bytecode.statistics()
            print(f"Original: {original_stats.instruction_count} instructions, {original_stats.gas_estimate} gas")
            
            # Create optimized plan
            plan = planner.plan(simple_bytecode)
            print(f"Optimized: {plan.instruction_count} instructions")
            print(f"Optimization ratio: {plan.optimization_ratio:.2f}x")
            print(f"Has jump table: {plan.has_jump_table}")
            print(f"Constants: {plan.constant_count}")
            
            # Performance analysis
            complexity = planner.analyze_complexity(simple_bytecode)
            print(f"Complexity analysis:")
            for key, value in complexity.items():
                if isinstance(value, float):
                    print(f"  {key}: {value:.2f}")
                else:
                    print(f"  {key}: {value}")
            
            # Cache stats
            cache_stats = planner.cache_stats()
            print(f"Cache: {cache_stats.size}/{cache_stats.capacity} plans, {cache_stats.hit_rate:.1%} hit rate")
            
    except Exception as e:
        print(f"Optimization failed: {e}")
    
    print()


def example_precompiled_contracts():
    """Example: Using precompiled contracts."""
    print("=== Precompiled Contracts ===")
    
    # Test various precompiles
    try:
        # SHA256
        data = b"Hello, Ethereum!"
        hash_result = sha256(data)
        print(f"SHA256('{data.decode()}'): {hash_result}")
        
        # Identity (copy function)
        copied_data = identity(data)
        print(f"Identity: {copied_data} (same as input: {copied_data == data})")
        
        # Modular exponentiation: 2^10 % 1000 = 24
        base = U256.from_int(2)
        exp = U256.from_int(10)
        mod = U256.from_int(1000)
        result = modexp(base, exp, mod)
        print(f"ModExp(2^10 % 1000): {result.to_int()}")
        
        # Check precompile addresses
        for i in range(1, 11):
            addr = create_precompile_address(i)
            is_precompile = is_precompile_address(addr)
            print(f"Address {addr} is precompile: {is_precompile}")
        
    except Exception as e:
        print(f"Precompile error: {e}")
    
    print()


def example_state_management():
    """Example: EVM state management."""
    print("=== State Management ===")
    
    with EVM() as evm:
        # Account management
        account = Address.from_hex("0x1234567890123456789012345678901234567890")
        
        # Set and get balance
        initial_balance = U256.from_ether(5)
        evm.set_balance(account, initial_balance)
        current_balance = evm.get_balance(account)
        print(f"Balance set: {initial_balance.to_ether()} ETH")
        print(f"Balance retrieved: {current_balance.to_ether()} ETH")
        
        # Contract code management
        sample_code = bytes.fromhex("6001600201")  # PUSH1 1 PUSH1 2 ADD
        evm.set_code(account, sample_code)
        retrieved_code = evm.get_code(account)
        print(f"Code set: {sample_code.hex()}")
        print(f"Code retrieved: {retrieved_code.hex()}")
        
        # Storage operations
        storage_key = U256.from_int(42)
        storage_value = U256.from_int(123)
        evm.set_storage(account, storage_key, storage_value)
        retrieved_value = evm.get_storage(account, storage_key)
        print(f"Storage[{storage_key}] = {storage_value}")
        print(f"Retrieved: {retrieved_value}")
        
        # Snapshots
        snapshot_id = evm.snapshot()
        print(f"Created snapshot: {snapshot_id}")
        
        # Modify state
        new_balance = U256.from_ether(10)
        evm.set_balance(account, new_balance)
        modified_balance = evm.get_balance(account)
        print(f"Modified balance: {modified_balance.to_ether()} ETH")
        
        # Revert to snapshot
        evm.revert_to_snapshot(snapshot_id)
        reverted_balance = evm.get_balance(account)
        print(f"Reverted balance: {reverted_balance.to_ether()} ETH")
    
    print()


def example_error_handling():
    """Example: Comprehensive error handling."""
    print("=== Error Handling ===")
    
    try:
        # Invalid bytecode
        Bytecode(b"")  # Empty bytecode should fail
    except InvalidBytecodeError as e:
        print(f"Empty bytecode error: {e}")
    
    try:
        # Invalid address
        Address.from_hex("0x123")  # Too short
    except Exception as e:
        print(f"Invalid address error: {e}")
    
    try:
        # Invalid U256
        U256.from_int(-1)  # Negative value
    except Exception as e:
        print(f"Invalid U256 error: {e}")
    
    try:
        # Out of gas execution
        with EVM() as evm:
            # Infinite loop with very low gas
            infinite_loop = bytes.fromhex("5b6000565b")  # JUMPDEST PUSH1 0 JUMP
            result = evm.execute(
                bytecode=infinite_loop,
                gas_limit=100  # Very low gas
            )
            print(f"Low gas execution: {result.success}")
            if not result.success:
                print(f"Error: {result.error}")
    
    except Exception as e:
        print(f"Execution error: {e}")
    
    print()


def example_performance_comparison():
    """Example: Performance comparison with and without optimization."""
    print("=== Performance Comparison ===")
    
    # Complex bytecode for performance testing
    complex_bytecode = Bytecode.from_hex(
        "60806040526004361061004c5760003560e01c8063095ea7b31461005157806318160ddd14610081578063"
        "23b872dd146100a1578063a9059cbb146100d1575b600080fd5b61006b6004803603810190610066919061"
        "032b565b610101565b60405161007891906103c9565b60405180910390f35b6100896101f3565b6040516100"
        "9891906103e4565b60405180910390f35b6100bb60048036038101906100b691906102dc565b6101f9565b"
        "6040516100c891906103c9565b60405180910390f3"
    )
    
    try:
        with Planner() as planner:
            # Analyze complexity
            stats = complex_bytecode.statistics()
            plan = planner.plan(complex_bytecode)
            
            print(f"Original bytecode: {len(complex_bytecode)} bytes")
            print(f"Instructions: {stats.instruction_count}")
            print(f"Estimated gas: {stats.gas_estimate}")
            print(f"Complexity score: {stats.complexity_score:.2f}")
            print()
            
            print(f"Optimized plan:")
            print(f"Instructions: {plan.instruction_count}")
            print(f"Optimization ratio: {plan.optimization_ratio:.2f}x")
            print(f"Estimated performance gain: {planner.estimate_performance_gain(complex_bytecode):.2f}x")
            print()
            
            # Cache performance
            print("Testing cache performance:")
            for i in range(3):
                cached = planner.has_cached_plan(complex_bytecode)
                plan = planner.plan(complex_bytecode)  # This should hit cache after first call
                print(f"  Iteration {i+1}: cached={cached}")
            
            cache_stats = planner.cache_stats()
            print(f"Final cache stats: {cache_stats.size} plans, {cache_stats.hit_rate:.1%} hit rate")
    
    except Exception as e:
        print(f"Performance comparison failed: {e}")
    
    print()


def main():
    """Run all examples."""
    print("Guillotine EVM Python Bindings - Comprehensive Examples")
    print("=" * 60)
    print()
    
    try:
        example_basic_execution()
        example_contract_deployment() 
        example_bytecode_analysis()
        example_bytecode_optimization()
        example_precompiled_contracts()
        example_state_management()
        example_error_handling()
        example_performance_comparison()
        
        print("All examples completed successfully!")
        
    except Exception as e:
        print(f"Example failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()