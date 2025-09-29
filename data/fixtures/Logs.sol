// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Logs {
    event Log0(uint256 indexed value);
    event Log1(uint256 indexed a, uint256 b);
    event Log2(uint256 indexed a, uint256 indexed b, uint256 c);
    event Log3(address indexed sender, uint256 indexed value, bytes data);
    event Log4(uint256 indexed a, uint256 indexed b, uint256 indexed c, uint256 d, bytes data);
    
    function benchmark() public returns (uint256) {
        uint256 result = 0;
        
        for (uint256 i = 0; i < 10; i++) {
            emit Log0(i);
            emit Log1(i, i * 2);
            emit Log2(i, i * 2, i * 3);
            emit Log3(msg.sender, i, abi.encode(i));
            emit Log4(i, i * 2, i * 3, i * 4, abi.encode(i, "data"));
            
            assembly {
                log0(0, 0)
                log1(0, 32, i)
                log2(0, 32, i, mul(i, 2))
                log3(0, 64, i, mul(i, 2), mul(i, 3))
                log4(0, 64, i, mul(i, 2), mul(i, 3), mul(i, 4))
            }
            
            result += i;
        }
        
        return result;
    }
}