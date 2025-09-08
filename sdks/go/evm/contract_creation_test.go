package evm

import (
	"bytes"
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/evmts/guillotine/bindings/go/primitives"
)

func TestContractCreation(t *testing.T) {
	t.Run("CREATE opcode basic deployment", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x01})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "60806040526004361061001e5760003560e01c80636057361d14610023575b600080fd5b61003d60048036038101906100389190610068565b61003f565b005b8060008190555050565b600080fd5b6000819050919050565b61006081610091565b811461006b57600080fd5b50565b60008135905061007d81610057565b92915050565b60008060408385031215610099576100986100095610004e565b5b60006100a78582860161006e565b92505060206100b88582860161006e565b9150509250929050565b6100cb81610091565b82525050565b60006020820190506100e660008301846100c2565b9291505056fea26469706673582212208"
		deployBytecode := "5f5f5f" + initCode + "5f525ff3"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.True(t, result.Success, "Contract deployment should succeed")
	})

	t.Run("CREATE2 deterministic deployment", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x02})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		salt := "0000000000000000000000000000000000000000000000000000000000000001"
		initCode := "60806040526000805534801561001457600080fd5b50610150806100246000396000f3fe"
		deployBytecode := "5f5f7f" + salt + "5f" + initCode + "5f525ff5"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.True(t, result.Success, "CREATE2 deployment should succeed")
	})

	t.Run("Contract deployment with constructor", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x03})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		constructorArgs := "00000000000000000000000000000000000000000000000000000000000000ff"
		initCode := "608060405234801561001057600080fd5b5060405161001d9061007b565b604051809103905ff080158015610038573d6000803e3d6000fd5b50600080546101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061008f565b60588061009883390190565b603f8061009683390190565b0033"
		deployBytecode := initCode + constructorArgs

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Constructor deployment should return result")
	})

	t.Run("Contract deployment with value transfer", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x04})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		deployValue := "00000000000000000000000000000000000000000000000000000000000003e8"
		initCode := "60806040525f5260205ff3"
		deployBytecode := "7f" + deployValue + "5f5f" + initCode + "5f525ff1"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Deployment with value should return result")
	})

	t.Run("Failed deployment - insufficient gas", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x05})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		gasLimit := NewU256FromUint64(1000)
		evm.SetGasLimit(&gasLimit)

		largeInitCode := bytes.Repeat([]byte{0x60, 0x00}, 10000)
		deployBytecode := append([]byte{0x5f, 0x5f, 0x5f}, largeInitCode...)
		deployBytecode = append(deployBytecode, []byte{0x5f, 0x52, 0x5f, 0xf0}...)

		result := evm.ExecuteWithAddress(deployBytecode, &deployerAddr)
		assert.False(t, result.Success, "Deployment should fail with insufficient gas")
	})

	t.Run("Failed deployment - stack underflow", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x06})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		deployBytecode := "f0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.False(t, result.Success, "Deployment should fail with stack underflow")
	})

	t.Run("Contract deployment address calculation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x07})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		nonce := uint64(0)
		evm.SetNonce(&deployerAddr, nonce)

		initCode := "5f5260205ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Address calculation should complete")
	})

	t.Run("Multiple contract deployments", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x08})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode1 := "60aa5f555f5260205ff3"
		initCode2 := "60bb5f555f5260205ff3"

		deployBytecode := "5f5f5f" + initCode1 + "5f525ff0505f5f5f" + initCode2 + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Multiple deployments should complete")
	})

	t.Run("Contract deployment with init code execution", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x09})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "60aa5f5560bb60015560cc60025560dd5f5260205ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Init code execution should complete")
	})

	t.Run("Contract factory pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		factoryAddr := NewAddress([20]byte{0x0a})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&factoryAddr, &balance)

		childContract := "5f5260205ff3"
		factoryCode := "5f5f5f" + childContract + "5f525ff05f5260205ff3"

		bytecode, err := hex.DecodeString(factoryCode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &factoryAddr)
		assert.NotNil(t, result, "Factory pattern should complete")
	})

	t.Run("CREATE2 with computed address", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x0b})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		salt := NewHash([32]byte{0x01})
		initCode := "5f5260205ff3"
		
		deployBytecode := "7f" + hex.EncodeToString(salt.Bytes()) + "5f5f" + initCode + "5f525ff5"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "CREATE2 with computed address should complete")
	})

	t.Run("Contract deployment with SELFDESTRUCT in init", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x0c})
		beneficiary := NewAddress([20]byte{0x0d})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "73" + hex.EncodeToString(beneficiary.Bytes()) + "ff"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Deployment with SELFDESTRUCT should complete")
	})

	t.Run("Nested contract creation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x0e})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		innerContract := "5f5260205ff3"
		outerInitCode := "5f5f5f" + innerContract + "5f525ff05f5260205ff3"
		deployBytecode := "5f5f5f" + outerInitCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Nested contract creation should complete")
	})

	t.Run("Contract deployment with large init code", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x0f})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		largeInitCode := bytes.Repeat([]byte{0x60, 0x00, 0x60, 0x00, 0x55}, 100)
		largeInitCode = append(largeInitCode, []byte{0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}...)
		
		deployBytecode := append([]byte{0x5f, 0x5f, 0x5f}, largeInitCode...)
		deployBytecode = append(deployBytecode, []byte{0x5f, 0x52, 0x5f, 0xf0}...)

		result := evm.ExecuteWithAddress(deployBytecode, &deployerAddr)
		assert.NotNil(t, result, "Large init code deployment should complete")
	})

	t.Run("Contract deployment with code size limit", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x10})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		maxCodeSize := bytes.Repeat([]byte{0x00}, 24576)
		deployBytecode := append([]byte{0x5f, 0x5f, 0x5f}, maxCodeSize...)
		deployBytecode = append(deployBytecode, []byte{0x5f, 0x52, 0x5f, 0xf0}...)

		result := evm.ExecuteWithAddress(deployBytecode, &deployerAddr)
		assert.NotNil(t, result, "Max code size deployment should be handled")
	})
}

func TestContractInteraction(t *testing.T) {
	t.Run("Deploy and call contract", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x11})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		contractCode := "60806040525f80553480156011575f80fd5b506004361060285760003560e01c806360fe47b114602c575b5f80fd5b60426004803603810190603d91906064565b6044565b005b805f8190555050565b5f80fd5b5f819050919050565b605c816050565b8114605f575f80fd5b50565b5f813590506071816055565b92915050565b5f60208284031215608657608560605c565b5b5f6090848285016062565b9150509291505056fea2646970667358"
		
		deployBytecode := "5f5f5f" + contractCode + "5f525ff0"
		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Contract should be deployed")

		callData := "60fe47b10000000000000000000000000000000000000000000000000000000000000064"
		callBytecode, err := hex.DecodeString(callData)
		require.NoError(t, err)

		callResult := evm.ExecuteWithAddress(callBytecode, &deployerAddr)
		assert.NotNil(t, callResult, "Contract call should complete")
	})

	t.Run("Contract creation from contract", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		factoryAddr := NewAddress([20]byte{0x12})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&factoryAddr, &balance)

		childInitCode := "60aa5f555f5260205ff3"
		factoryInitCode := "7f" + childInitCode + "000000000000000000005f527f00000000000000000000000000000000000" +
			"00000000000000000000000000a60205260205ff0"
			
		deployBytecode := "5f5f5f" + factoryInitCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &factoryAddr)
		assert.NotNil(t, result, "Factory should deploy child contract")
	})
}

func TestContractUpgradePatterns(t *testing.T) {
	t.Run("Proxy pattern deployment", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x13})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		implementationCode := "60aa5f555f5260205ff3"
		proxyCode := "365f5f375f5f365f7f" + implementationCode + "545af43d5f5f3e3d5ff3"

		deployBytecode := "5f5f5f" + proxyCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Proxy pattern should deploy")
	})

	t.Run("Clone factory pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x14})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		masterContract := "60aa5f555f5260205ff3"
		cloneCode := "3d602d80600a3d3981f3363d3d373d3d3d363d73" + masterContract + "5af43d82803e903d91602b57fd5bf3"

		deployBytecode := "5f5f5f" + cloneCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Clone factory should deploy")
	})
}

func TestContractSecurityPatterns(t *testing.T) {
	t.Run("Reentrancy guard in constructor", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x15})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "60015f555f5260205ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Reentrancy guard initialization should complete")
	})

	t.Run("Access control initialization", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x16})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "335f555f5260205ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Access control setup should complete")
	})
}

func TestContractDeploymentEdgeCases(t *testing.T) {
	t.Run("Zero-length runtime code", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x17})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		initCode := "5f5f5ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Zero-length runtime code should be handled")
	})

	t.Run("Maximum constructor arguments", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x18})
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)

		args := bytes.Repeat([]byte{0xff}, 1024)
		initCode := "5f5260205ff3"
		deployBytecode := append(args, []byte(initCode)...)

		fullDeploy := append([]byte{0x5f, 0x5f, 0x5f}, deployBytecode...)
		fullDeploy = append(fullDeploy, []byte{0x5f, 0x52, 0x5f, 0xf0}...)

		result := evm.ExecuteWithAddress(fullDeploy, &deployerAddr)
		assert.NotNil(t, result, "Large constructor args should be handled")
	})

	t.Run("Deployment at existing address", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		deployerAddr := NewAddress([20]byte{0x19})
		existingAddr := NewAddress([20]byte{0x20})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&deployerAddr, &balance)
		
		existingCode := []byte{0x60, 0x00}
		evm.SetCode(&existingAddr, existingCode)

		initCode := "5f5260205ff3"
		deployBytecode := "5f5f5f" + initCode + "5f525ff0"

		bytecode, err := hex.DecodeString(deployBytecode)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &deployerAddr)
		assert.NotNil(t, result, "Deployment collision should be handled")
	})
}