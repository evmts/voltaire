// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Storage {
    mapping(uint256 => uint256) private data;
    
    function benchmark() public returns (uint256) {
        uint256 result = 0;
        
        for (uint256 i = 0; i < 100; i++) {
            data[i] = i * 2;
            result += data[i];
            
            if (i > 0) {
                uint256 prev = data[i - 1];
                data[i] = data[i] + prev;
            }
        }
        
        for (uint256 i = 0; i < 50; i++) {
            delete data[i * 2];
        }
        
        return result;
    }
}