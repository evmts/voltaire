// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockInfo {
    function benchmark() public view returns (uint256) {
        uint256 result = 0;
        
        result += block.number;
        result += block.timestamp;
        result += block.gaslimit;
        result += block.basefee;
        result += block.chainid;
        
        address coinbase = block.coinbase;
        result += uint256(uint160(coinbase));
        
        uint256 difficulty = block.prevrandao;
        result += difficulty;
        
        if (block.number > 0) {
            bytes32 bhash = blockhash(block.number - 1);
            result += uint256(bhash);
        }
        
        return result;
    }
}