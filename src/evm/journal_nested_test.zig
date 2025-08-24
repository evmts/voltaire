/// Advanced nested snapshot tests simulating realistic EVM execution patterns
/// These tests validate complex transaction scenarios with multiple call depths and reverts
const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Journal = @import("journal.zig").Journal;
const JournalConfig = @import("journal_config.zig").JournalConfig;

/// ERC20 token transfer simulation with nested calls and reverts
test "Journal nested - ERC20 transfer simulation" {
    const erc20_contract = [_]u8{1} ** 20;
    const sender = [_]u8{2} ** 20;
    const recipient = [_]u8{3} ** 20;
    const allowance_spender = [_]u8{4} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Transaction-level snapshot
    const tx_snapshot = journal.create_snapshot();
    
    // Initial state recording - sender has 1000 tokens, recipient has 100
    try journal.record_storage_change(tx_snapshot, erc20_contract, 1000, 1000); // sender balance slot
    try journal.record_storage_change(tx_snapshot, erc20_contract, 1001, 100);  // recipient balance slot
    
    // ERC20 transfer call
    const transfer_snapshot = journal.create_snapshot();
    
    // Transfer 200 tokens - record balance changes
    try journal.record_storage_change(transfer_snapshot, erc20_contract, 1000, 800); // sender: 1000 -> 800
    try journal.record_storage_change(transfer_snapshot, erc20_contract, 1001, 300); // recipient: 100 -> 300
    
    // Nested call to check allowance (simulating transferFrom)
    const allowance_check_snapshot = journal.create_snapshot();
    
    // Record allowance check
    try journal.record_storage_change(allowance_check_snapshot, erc20_contract, 2000, 500); // allowance slot
    
    // Allowance sufficient, update it
    const allowance_update_snapshot = journal.create_snapshot();
    try journal.record_storage_change(allowance_update_snapshot, erc20_contract, 2000, 300); // allowance: 500 -> 300
    
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // Simulate successful nested execution - no reverts needed
    // Verify final state shows all changes
    const sender_balance = journal.get_original_storage(erc20_contract, 1000);
    try testing.expect(sender_balance != null);
    try testing.expectEqual(@as(u256, 1000), sender_balance.?); // Original value recorded
    
    // Now simulate a failed transfer due to insufficient balance
    const failed_transfer_snapshot = journal.create_snapshot();
    try journal.record_storage_change(failed_transfer_snapshot, erc20_contract, 1000, 0); // Attempt to set to 0
    
    // Transfer fails - revert the failed transfer
    journal.revert_to_snapshot(failed_transfer_snapshot);
    try testing.expectEqual(@as(usize, 5), journal.entry_count()); // Back to successful state
    
    // Verify successful transfer state is preserved
    const allowance_final = journal.get_original_storage(erc20_contract, 2000);
    try testing.expect(allowance_final != null);
    try testing.expectEqual(@as(u256, 500), allowance_final.?); // Original allowance
}

test "Journal nested - DEX swap with multiple token interactions" {
    const dex_contract = [_]u8{1} ** 20;
    const token_a_contract = [_]u8{2} ** 20;
    const token_b_contract = [_]u8{3} ** 20;
    const user = [_]u8{4} ** 20;
    const dex_pool = [_]u8{5} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Transaction snapshot
    const tx_snapshot = journal.create_snapshot();
    
    // Initial user balances: 1000 Token A, 500 Token B
    try journal.record_storage_change(tx_snapshot, token_a_contract, 100, 1000); // User Token A balance
    try journal.record_storage_change(tx_snapshot, token_b_contract, 100, 500);  // User Token B balance
    
    // Initial pool reserves: 10000 Token A, 20000 Token B
    try journal.record_storage_change(tx_snapshot, dex_contract, 200, 10000); // Pool Token A reserve
    try journal.record_storage_change(tx_snapshot, dex_contract, 201, 20000); // Pool Token B reserve
    
    // DEX swap call: swap 100 Token A for Token B
    const swap_snapshot = journal.create_snapshot();
    
    // Transfer Token A from user to pool
    const token_a_transfer_snapshot = journal.create_snapshot();
    try journal.record_storage_change(token_a_transfer_snapshot, token_a_contract, 100, 900);   // User: 1000 -> 900
    try journal.record_storage_change(token_a_transfer_snapshot, token_a_contract, 150, 100);   // Pool receives 100
    
    // Update pool reserves after Token A deposit
    const pool_update_a_snapshot = journal.create_snapshot();
    try journal.record_storage_change(pool_update_a_snapshot, dex_contract, 200, 10100); // Pool A: 10000 -> 10100
    
    // Calculate Token B to send (simulating AMM calculation)
    const token_b_calculation_snapshot = journal.create_snapshot();
    
    // Transfer Token B from pool to user (calculated as ~99 tokens)
    const token_b_transfer_snapshot = journal.create_snapshot();
    try journal.record_storage_change(token_b_transfer_snapshot, token_b_contract, 150, 19901); // Pool: 20000 -> 19901
    try journal.record_storage_change(token_b_transfer_snapshot, token_b_contract, 100, 599);   // User: 500 -> 599
    
    // Update pool reserves after Token B withdrawal
    const pool_update_b_snapshot = journal.create_snapshot();
    try journal.record_storage_change(pool_update_b_snapshot, dex_contract, 201, 19901); // Pool B: 20000 -> 19901
    
    try testing.expectEqual(@as(usize, 9), journal.entry_count());
    
    // Simulate slippage check failure - revert the entire swap
    journal.revert_to_snapshot(swap_snapshot);
    try testing.expectEqual(@as(usize, 4), journal.entry_count()); // Only initial state remains
    
    // Verify initial state is preserved
    const user_token_a = journal.get_original_storage(token_a_contract, 100);
    try testing.expect(user_token_a != null);
    try testing.expectEqual(@as(u256, 1000), user_token_a.?);
    
    const user_token_b = journal.get_original_storage(token_b_contract, 100);
    try testing.expect(user_token_b != null);
    try testing.expectEqual(@as(u256, 500), user_token_b.?);
    
    const pool_reserve_a = journal.get_original_storage(dex_contract, 200);
    try testing.expect(pool_reserve_a != null);
    try testing.expectEqual(@as(u256, 10000), pool_reserve_a.?);
    
    const pool_reserve_b = journal.get_original_storage(dex_contract, 201);
    try testing.expect(pool_reserve_b != null);
    try testing.expectEqual(@as(u256, 20000), pool_reserve_b.?);
}

test "Journal nested - lending protocol with multiple liquidations" {
    const lending_contract = [_]u8{1} ** 20;
    const collateral_token = [_]u8{2} ** 20;
    const debt_token = [_]u8{3} ** 20;
    const borrower = [_]u8{4} ** 20;
    const liquidator = [_]u8{5} ** 20;
    const protocol_treasury = [_]u8{6} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Transaction snapshot
    const tx_snapshot = journal.create_snapshot();
    
    // Initial state: borrower has collateral and debt
    try journal.record_storage_change(tx_snapshot, lending_contract, 1000, 1000); // Borrower collateral amount
    try journal.record_storage_change(tx_snapshot, lending_contract, 1001, 500);  // Borrower debt amount
    try journal.record_storage_change(tx_snapshot, collateral_token, 100, 2000);  // Liquidator token balance
    
    // Health factor check - borrower is liquidatable
    const health_check_snapshot = journal.create_snapshot();
    try journal.record_storage_change(health_check_snapshot, lending_contract, 1002, 800); // Health factor
    
    // Liquidation call
    const liquidation_snapshot = journal.create_snapshot();
    
    // Liquidator pays debt (250 tokens)
    const debt_payment_snapshot = journal.create_snapshot();
    try journal.record_storage_change(debt_payment_snapshot, debt_token, 200, 250);        // Liquidator pays 250
    try journal.record_storage_change(debt_payment_snapshot, lending_contract, 1001, 250); // Debt: 500 -> 250
    
    // Calculate liquidation bonus and seize collateral
    const collateral_seizure_snapshot = journal.create_snapshot();
    try journal.record_storage_change(collateral_seizure_snapshot, lending_contract, 1000, 700); // Collateral: 1000 -> 700
    try journal.record_storage_change(collateral_seizure_snapshot, collateral_token, 100, 2300);  // Liquidator gets 300 collateral
    
    // Protocol fee calculation
    const protocol_fee_snapshot = journal.create_snapshot();
    try journal.record_storage_change(protocol_fee_snapshot, collateral_token, 300, 50); // Treasury gets 50 as fee
    
    // Nested liquidation attempt (liquidator tries to liquidate again)
    const second_liquidation_snapshot = journal.create_snapshot();
    
    // Check if still liquidatable
    const second_health_check_snapshot = journal.create_snapshot();
    try journal.record_storage_change(second_health_check_snapshot, lending_contract, 1002, 1200); // Health improved
    
    try testing.expectEqual(@as(usize, 9), journal.entry_count());
    
    // Second liquidation should fail - health factor too good
    journal.revert_to_snapshot(second_liquidation_snapshot);
    try testing.expectEqual(@as(usize, 7), journal.entry_count());
    
    // Verify first liquidation completed successfully
    const remaining_debt = journal.get_original_storage(lending_contract, 1001);
    try testing.expect(remaining_debt != null);
    try testing.expectEqual(@as(u256, 500), remaining_debt.?); // Original debt
    
    const remaining_collateral = journal.get_original_storage(lending_contract, 1000);
    try testing.expect(remaining_collateral != null);
    try testing.expectEqual(@as(u256, 1000), remaining_collateral.?); // Original collateral
    
    // Now simulate complete failure of first liquidation
    journal.revert_to_snapshot(liquidation_snapshot);
    try testing.expectEqual(@as(usize, 2), journal.entry_count()); // Back to health check
    
    // Only initial state and health check should remain
    const original_debt = journal.get_original_storage(lending_contract, 1001);
    try testing.expect(original_debt != null);
    try testing.expectEqual(@as(u256, 500), original_debt.?);
}

test "Journal nested - governance proposal execution with multi-step changes" {
    const governance_contract = [_]u8{1} ** 20;
    const target_contract1 = [_]u8{2} ** 20;
    const target_contract2 = [_]u8{3} ** 20;
    const target_contract3 = [_]u8{4} ** 20;
    const proposer = [_]u8{5} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Proposal execution transaction
    const tx_snapshot = journal.create_snapshot();
    
    // Record proposal state
    try journal.record_storage_change(tx_snapshot, governance_contract, 100, 1); // Proposal status: executing
    try journal.record_nonce_change(tx_snapshot, governance_contract, 5);
    
    // Execute first action: update parameter in contract1
    const action1_snapshot = journal.create_snapshot();
    try journal.record_storage_change(action1_snapshot, target_contract1, 1, 1000); // Old parameter value
    try journal.record_storage_change(action1_snapshot, target_contract1, 1, 2000); // New parameter value
    
    // Execute second action: transfer ownership in contract2
    const action2_snapshot = journal.create_snapshot();
    try journal.record_storage_change(action2_snapshot, target_contract2, 0, [20]u8{0x11} ** 20); // Old owner
    try journal.record_storage_change(action2_snapshot, target_contract2, 0, [20]u8{0x22} ** 20); // New owner
    
    // Execute third action: upgrade contract3 (change implementation)
    const action3_snapshot = journal.create_snapshot();
    const old_impl_hash = [_]u8{0xAA} ** 32;
    const new_impl_hash = [_]u8{0xBB} ** 32;
    try journal.record_code_change(action3_snapshot, target_contract3, old_impl_hash);
    
    // Update implementation pointer
    try journal.record_storage_change(action3_snapshot, target_contract3, 0, 12345); // Implementation slot
    
    // Mark proposal as executed
    const completion_snapshot = journal.create_snapshot();
    try journal.record_storage_change(completion_snapshot, governance_contract, 100, 2); // Status: executed
    
    try testing.expectEqual(@as(usize, 8), journal.entry_count());
    
    // Simulate failure in action3 - revert from action3
    journal.revert_to_snapshot(action3_snapshot);
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // Actions 1 and 2 should remain
    const param_value = journal.get_original_storage(target_contract1, 1);
    try testing.expect(param_value != null);
    try testing.expectEqual(@as(u256, 1000), param_value.?);
    
    const owner_change = journal.get_original_storage(target_contract2, 0);
    try testing.expect(owner_change != null);
    
    // Action3 and completion should be reverted
    var code_change_found = false;
    var completion_found = false;
    for (journal.entries.items) |entry| {
        switch (entry.data) {
            .code_change => code_change_found = true,
            else => {},
        }
        // Check if completion status entry exists
        if (entry.data == .storage_change) {
            const sc = entry.data.storage_change;
            if (std.mem.eql(u8, &sc.address, &governance_contract) and sc.key == 100 and sc.original_value == 2) {
                completion_found = true;
            }
        }
    }
    try testing.expect(!code_change_found); // Should be reverted
    try testing.expect(!completion_found);  // Should be reverted
    
    // Simulate total proposal failure
    journal.revert_to_snapshot(tx_snapshot);
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    
    // Only initial proposal state should remain
    const proposal_status = journal.get_original_storage(governance_contract, 100);
    try testing.expect(proposal_status != null);
    try testing.expectEqual(@as(u256, 1), proposal_status.?); // Still "executing"
}

test "Journal nested - cross-chain bridge with validation steps" {
    const bridge_contract = [_]u8{1} ** 20;
    const token_contract = [_]u8{2} ** 20;
    const validator1 = [_]u8{3} ** 20;
    const validator2 = [_]u8{4} ** 20;
    const validator3 = [_]u8{5} ** 20;
    const user = [_]u8{6} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Bridge transaction snapshot
    const tx_snapshot = journal.create_snapshot();
    
    // User initiates bridge: lock 1000 tokens
    try journal.record_storage_change(tx_snapshot, token_contract, 100, 5000);  // User balance: 5000 -> 4000
    try journal.record_storage_change(tx_snapshot, bridge_contract, 200, 1000); // Bridge locked amount
    
    // Bridge nonce increment
    try journal.record_nonce_change(tx_snapshot, bridge_contract, 42);
    
    // Validation phase begins
    const validation_snapshot = journal.create_snapshot();
    
    // Validator 1 signs
    const validator1_snapshot = journal.create_snapshot();
    try journal.record_storage_change(validator1_snapshot, bridge_contract, 1001, 1); // Validator1 signature flag
    
    // Validator 2 signs
    const validator2_snapshot = journal.create_snapshot();
    try journal.record_storage_change(validator2_snapshot, bridge_contract, 1002, 1); // Validator2 signature flag
    
    // Validator 3 signs  
    const validator3_snapshot = journal.create_snapshot();
    try journal.record_storage_change(validator3_snapshot, bridge_contract, 1003, 1); // Validator3 signature flag
    
    // Threshold reached, execute bridge
    const execution_snapshot = journal.create_snapshot();
    try journal.record_storage_change(execution_snapshot, bridge_contract, 300, 1); // Bridge execution flag
    try journal.record_storage_change(execution_snapshot, bridge_contract, 301, 123456789); // Destination tx hash
    
    try testing.expectEqual(@as(usize, 8), journal.entry_count());
    
    // Simulate validator3 signature validation failure
    journal.revert_to_snapshot(validator3_snapshot);
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // Validators 1 and 2 signatures should remain
    const val1_sig = journal.get_original_storage(bridge_contract, 1001);
    try testing.expect(val1_sig != null);
    try testing.expectEqual(@as(u256, 1), val1_sig.?);
    
    const val2_sig = journal.get_original_storage(bridge_contract, 1002);
    try testing.expect(val2_sig != null);
    try testing.expectEqual(@as(u256, 1), val2_sig.?);
    
    // Validator3 signature and execution should be reverted
    const val3_sig = journal.get_original_storage(bridge_contract, 1003);
    try testing.expect(val3_sig == null);
    
    const execution_flag = journal.get_original_storage(bridge_contract, 300);
    try testing.expect(execution_flag == null);
    
    // Simulate complete validation failure
    journal.revert_to_snapshot(validation_snapshot);
    try testing.expectEqual(@as(usize, 3), journal.entry_count());
    
    // Only initial lock should remain
    const locked_amount = journal.get_original_storage(bridge_contract, 200);
    try testing.expect(locked_amount != null);
    try testing.expectEqual(@as(u256, 1000), locked_amount.?);
    
    const user_balance = journal.get_original_storage(token_contract, 100);
    try testing.expect(user_balance != null);
    try testing.expectEqual(@as(u256, 5000), user_balance.?); // Original balance
}

test "Journal nested - flash loan with complex arbitrage" {
    const flashloan_provider = [_]u8{1} ** 20;
    const dex1_contract = [_]u8{2} ** 20;
    const dex2_contract = [_]u8{3} ** 20;
    const token_a = [_]u8{4} ** 20;
    const token_b = [_]u8{5} ** 20;
    const arbitrageur = [_]u8{6} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // Flash loan transaction
    const tx_snapshot = journal.create_snapshot();
    
    // Arbitrageur initial balance (should be 0 for pure arbitrage)
    try journal.record_storage_change(tx_snapshot, token_a, 100, 0);
    
    // Flash loan: borrow 10000 Token A
    const flashloan_snapshot = journal.create_snapshot();
    try journal.record_storage_change(flashloan_snapshot, flashloan_provider, 500, 100000); // Provider balance: 100000 -> 90000
    try journal.record_storage_change(flashloan_snapshot, token_a, 100, 10000);             // Arbitrageur receives 10000
    
    // Trade on DEX1: 10000 Token A -> Token B
    const dex1_trade_snapshot = journal.create_snapshot();
    try journal.record_storage_change(dex1_trade_snapshot, token_a, 100, 0);     // Arbitrageur: 10000 -> 0
    try journal.record_storage_change(dex1_trade_snapshot, token_b, 100, 9800);  // Arbitrageur receives 9800 Token B
    try journal.record_storage_change(dex1_trade_snapshot, dex1_contract, 200, 110000); // DEX1 Token A reserve
    try journal.record_storage_change(dex1_trade_snapshot, dex1_contract, 201, 90200);  // DEX1 Token B reserve
    
    // Trade on DEX2: Token B -> Token A (better rate)
    const dex2_trade_snapshot = journal.create_snapshot();
    try journal.record_storage_change(dex2_trade_snapshot, token_b, 100, 0);     // Arbitrageur: 9800 -> 0
    try journal.record_storage_change(dex2_trade_snapshot, token_a, 100, 10500); // Arbitrageur receives 10500 Token A
    try journal.record_storage_change(dex2_trade_snapshot, dex2_contract, 200, 89500);  // DEX2 Token A reserve
    try journal.record_storage_change(dex2_trade_snapshot, dex2_contract, 201, 109800); // DEX2 Token B reserve
    
    // Repay flash loan with fee (10000 + 50 fee)
    const repayment_snapshot = journal.create_snapshot();
    try journal.record_storage_change(repayment_snapshot, token_a, 100, 450);    // Arbitrageur: 10500 -> 450 (profit!)
    try journal.record_storage_change(repayment_snapshot, flashloan_provider, 500, 100050); // Provider: 90000 -> 100050
    
    try testing.expectEqual(@as(usize, 11), journal.entry_count());
    
    // Simulate DEX2 trade failure (insufficient liquidity)
    journal.revert_to_snapshot(dex2_trade_snapshot);
    try testing.expectEqual(@as(usize, 7), journal.entry_count());
    
    // Arbitrageur should still have Token B from DEX1 trade
    const token_b_balance = journal.get_original_storage(token_b, 100);
    try testing.expect(token_b_balance != null);
    try testing.expectEqual(@as(u256, 0), token_b_balance.?); // Original balance before flash loan
    
    // Flash loan should still be outstanding
    const borrowed_token_a = journal.get_original_storage(token_a, 100);
    try testing.expect(borrowed_token_a != null);
    try testing.expectEqual(@as(u256, 0), borrowed_token_a.?); // Original balance
    
    // Simulate complete arbitrage failure - revert everything
    journal.revert_to_snapshot(flashloan_snapshot);
    try testing.expectEqual(@as(usize, 1), journal.entry_count());
    
    // Should be back to initial state
    const initial_balance = journal.get_original_storage(token_a, 100);
    try testing.expect(initial_balance != null);
    try testing.expectEqual(@as(u256, 0), initial_balance.?);
    
    // No flash loan should be recorded
    const provider_balance = journal.get_original_storage(flashloan_provider, 500);
    try testing.expect(provider_balance == null);
}

test "Journal nested - DAO treasury management with multi-sig" {
    const dao_treasury = [_]u8{1} ** 20;
    const target_investment = [_]u8{2} ** 20;
    const token_contract = [_]u8{3} ** 20;
    const signer1 = [_]u8{4} ** 20;
    const signer2 = [_]u8{5} ** 20;
    const signer3 = [_]u8{6} ** 20;
    const signer4 = [_]u8{7} ** 20;
    
    var journal = Journal(.{}).init(testing.allocator);
    defer journal.deinit();
    
    // DAO operation transaction
    const tx_snapshot = journal.create_snapshot();
    
    // Initial treasury state: 1M tokens
    try journal.record_storage_change(tx_snapshot, token_contract, 200, 1000000);
    try journal.record_nonce_change(tx_snapshot, dao_treasury, 25);
    
    // Proposal: invest 500k tokens
    const proposal_snapshot = journal.create_snapshot();
    try journal.record_storage_change(proposal_snapshot, dao_treasury, 100, 1); // Proposal status: active
    
    // Multi-sig signing process (3 of 4 threshold)
    const signing_snapshot = journal.create_snapshot();
    
    // Signer 1 approves
    const signer1_snapshot = journal.create_snapshot();
    try journal.record_storage_change(signer1_snapshot, dao_treasury, 201, 1);
    
    // Signer 2 approves  
    const signer2_snapshot = journal.create_snapshot();
    try journal.record_storage_change(signer2_snapshot, dao_treasury, 202, 1);
    
    // Signer 3 approves (threshold reached)
    const signer3_snapshot = journal.create_snapshot();
    try journal.record_storage_change(signer3_snapshot, dao_treasury, 203, 1);
    
    // Execute investment
    const execution_snapshot = journal.create_snapshot();
    try journal.record_storage_change(execution_snapshot, token_contract, 200, 500000);  // Treasury: 1M -> 500k
    try journal.record_storage_change(execution_snapshot, target_investment, 300, 500000); // Investment receives 500k
    try journal.record_storage_change(execution_snapshot, dao_treasury, 100, 2); // Proposal status: executed
    
    try testing.expectEqual(@as(usize, 9), journal.entry_count());
    
    // Simulate execution failure (investment contract rejects)
    journal.revert_to_snapshot(execution_snapshot);
    try testing.expectEqual(@as(usize, 6), journal.entry_count());
    
    // Signatures should remain valid
    const sig1 = journal.get_original_storage(dao_treasury, 201);
    try testing.expect(sig1 != null);
    try testing.expectEqual(@as(u256, 1), sig1.?);
    
    const sig2 = journal.get_original_storage(dao_treasury, 202);
    try testing.expect(sig2 != null);
    try testing.expectEqual(@as(u256, 1), sig2.?);
    
    const sig3 = journal.get_original_storage(dao_treasury, 203);
    try testing.expect(sig3 != null);
    try testing.expectEqual(@as(u256, 1), sig3.?);
    
    // Treasury balance should be unchanged
    const treasury_balance = journal.get_original_storage(token_contract, 200);
    try testing.expect(treasury_balance != null);
    try testing.expectEqual(@as(u256, 1000000), treasury_balance.?);
    
    // Simulate signer3 changing their mind (revokes signature)
    journal.revert_to_snapshot(signer3_snapshot);
    try testing.expectEqual(@as(usize, 5), journal.entry_count());
    
    // Only signers 1 and 2 should remain (threshold not reached)
    const remaining_sig3 = journal.get_original_storage(dao_treasury, 203);
    try testing.expect(remaining_sig3 == null);
    
    // Attempt to execute without threshold should fail at proposal level
    journal.revert_to_snapshot(proposal_snapshot);
    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    
    // Back to initial state
    const initial_balance = journal.get_original_storage(token_contract, 200);
    try testing.expect(initial_balance != null);
    try testing.expectEqual(@as(u256, 1000000), initial_balance.?);
}