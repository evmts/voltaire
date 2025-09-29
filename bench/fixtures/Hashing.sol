// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hashing {
    function benchmark() public pure returns (bytes32) {
        bytes32 result = keccak256("initial");
        
        for (uint256 i = 0; i < 100; i++) {
            result = keccak256(abi.encodePacked(result, i));
            
            if (i % 10 == 0) {
                result = keccak256(abi.encode(result, "longer string for hashing", i));
            }
        }
        
        return result;
    }
}