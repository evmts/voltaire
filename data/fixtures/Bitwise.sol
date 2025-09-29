// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Bitwise {
    function benchmark() public pure returns (uint256) {
        uint256 result = 0xDEADBEEF;
        
        for (uint256 i = 0; i < 1000; i++) {
            result = result & 0xFFFFFFFF;
            result = result | (i << 8);
            result = result ^ 0xCAFEBABE;
            result = ~result;
            
            bytes32 data = bytes32(result);
            uint8 extractedByte = uint8(data[i % 32]);
            result = result ^ uint256(extractedByte);
        }
        
        return result;
    }
}