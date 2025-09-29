// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Context {
    function benchmark() public payable returns (uint256) {
        uint256 result = 0;
        
        address self = address(this);
        address sender = msg.sender;
        address origin = tx.origin;
        uint256 value = msg.value;
        uint256 gasPrice = tx.gasprice;
        uint256 balance = self.balance;
        
        result = uint256(uint160(self));
        result += uint256(uint160(sender));
        result += uint256(uint160(origin));
        result += value;
        result += gasPrice;
        result += balance;
        
        assembly {
            result := add(result, codesize())
            result := add(result, selfbalance())
            result := add(result, gasprice())
        }
        
        return result;
    }
}