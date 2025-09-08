package evm

import (
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/evmts/guillotine/bindings/go/primitives"
)

func TestIntegrationScenarios(t *testing.T) {
	t.Run("ERC20 token transfer simulation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		tokenAddr := NewAddress([20]byte{0x01})
		senderAddr := NewAddress([20]byte{0x02})
		receiverAddr := NewAddress([20]byte{0x03})

		senderBalanceSlot := NewU256FromUint64(0)
		receiverBalanceSlot := NewU256FromUint64(1)
		
		initialSenderBalance := NewU256FromUint64(1000)
		initialReceiverBalance := NewU256FromUint64(500)
		
		evm.SetStorage(&tokenAddr, &senderBalanceSlot, &initialSenderBalance)
		evm.SetStorage(&tokenAddr, &receiverBalanceSlot, &initialReceiverBalance)

		transferAmount := uint64(100)
		transferSimulation := "6064805f5461096403805460015461096401556064600155"
		
		bytecode, err := hex.DecodeString(transferSimulation)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &tokenAddr)
		assert.True(t, result.Success)

		finalSenderBalance := evm.GetStorage(&tokenAddr, &senderBalanceSlot)
		finalReceiverBalance := evm.GetStorage(&tokenAddr, &receiverBalanceSlot)
		
		assert.Equal(t, uint64(900), finalSenderBalance.AsUint64())
		assert.Equal(t, uint64(600), finalReceiverBalance.AsUint64())
	})

	t.Run("DEX swap simulation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		dexAddr := NewAddress([20]byte{0x04})
		reserve0Slot := NewU256FromUint64(0)
		reserve1Slot := NewU256FromUint64(1)
		
		reserve0 := NewU256FromUint64(100000)
		reserve1 := NewU256FromUint64(200000)
		
		evm.SetStorage(&dexAddr, &reserve0Slot, &reserve0)
		evm.SetStorage(&dexAddr, &reserve1Slot, &reserve1)

		swapSimulation := "5f5460015402619c40116100165761001c5661001c5b60016001555b"
		
		bytecode, err := hex.DecodeString(swapSimulation)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &dexAddr)
		assert.True(t, result.Success)
	})

	t.Run("Multi-sig wallet execution", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		walletAddr := NewAddress([20]byte{0x05})
		ownerCountSlot := NewU256FromUint64(0)
		thresholdSlot := NewU256FromUint64(1)
		
		ownerCount := NewU256FromUint64(3)
		threshold := NewU256FromUint64(2)
		
		evm.SetStorage(&walletAddr, &ownerCountSlot, &ownerCount)
		evm.SetStorage(&walletAddr, &thresholdSlot, &threshold)

		multiSigExecution := "5f546001541161001e5760aa60025560015460025410610029576001610029565b5f5b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(multiSigExecution)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &walletAddr)
		assert.True(t, result.Success)
	})

	t.Run("NFT minting process", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		nftAddr := NewAddress([20]byte{0x06})
		totalSupplySlot := NewU256FromUint64(0)
		
		currentSupply := NewU256FromUint64(100)
		evm.SetStorage(&nftAddr, &totalSupplySlot, &currentSupply)

		mintNFT := "5f5460010160648111610019576001810190555f52602001f35bfd"
		
		bytecode, err := hex.DecodeString(mintNFT)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &nftAddr)
		assert.True(t, result.Success)

		newSupply := evm.GetStorage(&nftAddr, &totalSupplySlot)
		assert.Equal(t, uint64(101), newSupply.AsUint64())
	})

	t.Run("Staking rewards calculation", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		stakingAddr := NewAddress([20]byte{0x07})
		totalStakedSlot := NewU256FromUint64(0)
		rewardRateSlot := NewU256FromUint64(1)
		
		totalStaked := NewU256FromUint64(1000000)
		rewardRate := NewU256FromUint64(5)
		
		evm.SetStorage(&stakingAddr, &totalStakedSlot, &totalStaked)
		evm.SetStorage(&stakingAddr, &rewardRateSlot, &rewardRate)

		calculateRewards := "5f546001540260648104600255"
		
		bytecode, err := hex.DecodeString(calculateRewards)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &stakingAddr)
		assert.True(t, result.Success)
	})

	t.Run("Governance voting mechanism", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		govAddr := NewAddress([20]byte{0x08})
		proposalSlot := NewU256FromUint64(0)
		yesVotesSlot := NewU256FromUint64(1)
		noVotesSlot := NewU256FromUint64(2)
		
		proposalId := NewU256FromUint64(42)
		yesVotes := NewU256FromUint64(75)
		noVotes := NewU256FromUint64(25)
		
		evm.SetStorage(&govAddr, &proposalSlot, &proposalId)
		evm.SetStorage(&govAddr, &yesVotesSlot, &yesVotes)
		evm.SetStorage(&govAddr, &noVotesSlot, &noVotes)

		checkVoteOutcome := "600154600254116100155760016100195660006100195b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(checkVoteOutcome)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &govAddr)
		assert.True(t, result.Success)
	})

	t.Run("Cross-contract interaction", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		contractA := NewAddress([20]byte{0x09})
		contractB := NewAddress([20]byte{0x0a})
		
		balance := NewU256FromUint64(10000000)
		evm.SetBalance(&contractA, &balance)
		
		contractBCode := []byte{0x60, 0xaa, 0x5f, 0x55, 0x60, 0x01, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&contractB, contractBCode)

		crossContractCall := "5f5f5f5f5f73" + hex.EncodeToString(contractB.Bytes()) + "61fffff1503d60205f5f3e5f515f5260205ff3"
		
		bytecode, err := hex.DecodeString(crossContractCall)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &contractA)
		assert.True(t, result.Success)
		assert.Equal(t, 32, len(result.Output))
	})

	t.Run("Flash loan pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		lenderAddr := NewAddress([20]byte{0x0b})
		borrowerAddr := NewAddress([20]byte{0x0c})
		
		lenderBalance := NewU256FromUint64(10000000)
		evm.SetBalance(&lenderAddr, &lenderBalance)
		
		borrowerCode := []byte{0x34, 0x61, 0x03, 0xe8, 0x01, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&borrowerAddr, borrowerCode)

		flashLoan := "5f5f5f5f6103e873" + hex.EncodeToString(borrowerAddr.Bytes()) + "61fffff1503d5f5f3e5f51610fa010610400196100385760016100385b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(flashLoan)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &lenderAddr)
		assert.True(t, result.Success)
	})

	t.Run("Upgradeable proxy pattern", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		proxyAddr := NewAddress([20]byte{0x0d})
		implAddr := NewAddress([20]byte{0x0e})
		
		implSlot := NewU256FromUint64(0)
		implAddrU256 := NewU256FromBytes(implAddr.Bytes())
		evm.SetStorage(&proxyAddr, &implSlot, &implAddrU256)
		
		implCode := []byte{0x60, 0xbb, 0x5f, 0x52, 0x60, 0x20, 0x5f, 0xf3}
		evm.SetCode(&implAddr, implCode)

		proxyDelegateCall := "5f545f5f5f5f8173ffffffffffffffffffffffffffffffffffffffff1661fffff45f5260205ff3"
		
		bytecode, err := hex.DecodeString(proxyDelegateCall)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &proxyAddr)
		assert.True(t, result.Success)
	})

	t.Run("Time-locked transaction", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		timelockAddr := NewAddress([20]byte{0x0f})
		unlockTimeSlot := NewU256FromUint64(0)
		
		currentTime := NewU256FromUint64(1000)
		unlockTime := NewU256FromUint64(900)
		evm.SetStorage(&timelockAddr, &unlockTimeSlot, &unlockTime)

		checkTimelock := "5f5442116100145760aa5f5560016100185660006100185b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(checkTimelock)
		require.NoError(t, err)

		evm.SetBlockTimestamp(&currentTime)
		result := evm.ExecuteWithAddress(bytecode, &timelockAddr)
		assert.True(t, result.Success)
	})

	t.Run("Batch transaction processing", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		batchAddr := NewAddress([20]byte{0x10})
		
		for i := uint64(0); i < 5; i++ {
			slot := NewU256FromUint64(i)
			value := NewU256FromUint64(i * 10)
			evm.SetStorage(&batchAddr, &slot, &value)
		}

		batchProcess := "5f5b8060051161003b57805460018201915081602002815560010180915061000b565b"
		
		bytecode, err := hex.DecodeString(batchProcess)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &batchAddr)
		assert.True(t, result.Success)
	})

	t.Run("Oracle price feed integration", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		oracleAddr := NewAddress([20]byte{0x11})
		priceSlot := NewU256FromUint64(0)
		timestampSlot := NewU256FromUint64(1)
		
		price := NewU256FromUint64(50000)
		timestamp := NewU256FromUint64(1000)
		
		evm.SetStorage(&oracleAddr, &priceSlot, &price)
		evm.SetStorage(&oracleAddr, &timestampSlot, &timestamp)

		readPrice := "5f54600154426103e8039011610021576001610025565f610025565b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(readPrice)
		require.NoError(t, err)

		currentTime := NewU256FromUint64(1100)
		evm.SetBlockTimestamp(&currentTime)
		
		result := evm.ExecuteWithAddress(bytecode, &oracleAddr)
		assert.True(t, result.Success)
	})

	t.Run("Merkle proof verification", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		merkleAddr := NewAddress([20]byte{0x12})
		rootSlot := NewU256FromUint64(0)
		
		merkleRoot := NewU256FromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		evm.SetStorage(&merkleAddr, &rootSlot, &merkleRoot)

		verifyProof := "5f545f5f205f5f2014610019576001610001d5660006100001d565b5f5260205ff3"
		
		bytecode, err := hex.DecodeString(verifyProof)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &merkleAddr)
		assert.True(t, result.Success)
	})

	t.Run("Emergency pause mechanism", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		pausableAddr := NewAddress([20]byte{0x13})
		pausedSlot := NewU256FromUint64(0)
		
		paused := NewU256FromUint64(0)
		evm.SetStorage(&pausableAddr, &pausedSlot, &paused)

		checkPausedAndExecute := "5f5415610011575f610017575b60015f555b60aa5f5260205ff3"
		
		bytecode, err := hex.DecodeString(checkPausedAndExecute)
		require.NoError(t, err)

		result := evm.ExecuteWithAddress(bytecode, &pausableAddr)
		assert.True(t, result.Success)
		
		paused = NewU256FromUint64(1)
		evm.SetStorage(&pausableAddr, &pausedSlot, &paused)
		
		result = evm.ExecuteWithAddress(bytecode, &pausableAddr)
		assert.True(t, result.Success)
	})
}

func TestRealWorldContracts(t *testing.T) {
	t.Run("Simple storage contract", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		storageContract := "608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220"
		
		bytecode, err := hex.DecodeString(storageContract)
		require.NoError(t, err)

		result := evm.Execute(bytecode)
		assert.NotNil(t, result)
	})

	t.Run("Counter contract", func(t *testing.T) {
		evm := createTestEVM(t)
		defer evm.Destroy()

		counterAddr := NewAddress([20]byte{0x14})
		counterSlot := NewU256FromUint64(0)
		counter := NewU256FromUint64(0)
		evm.SetStorage(&counterAddr, &counterSlot, &counter)

		increment := "5f5460010155"
		decrement := "5f5460010355"
		getCount := "5f545f5260205ff3"
		
		incBytecode, _ := hex.DecodeString(increment)
		result := evm.ExecuteWithAddress(incBytecode, &counterAddr)
		assert.True(t, result.Success)
		
		value := evm.GetStorage(&counterAddr, &counterSlot)
		assert.Equal(t, uint64(1), value.AsUint64())
		
		result = evm.ExecuteWithAddress(incBytecode, &counterAddr)
		assert.True(t, result.Success)
		
		value = evm.GetStorage(&counterAddr, &counterSlot)
		assert.Equal(t, uint64(2), value.AsUint64())
		
		decBytecode, _ := hex.DecodeString(decrement)
		result = evm.ExecuteWithAddress(decBytecode, &counterAddr)
		assert.True(t, result.Success)
		
		value = evm.GetStorage(&counterAddr, &counterSlot)
		assert.Equal(t, uint64(1), value.AsUint64())
		
		getBytecode, _ := hex.DecodeString(getCount)
		result = evm.ExecuteWithAddress(getBytecode, &counterAddr)
		assert.True(t, result.Success)
		assert.Equal(t, 32, len(result.Output))
	})
}