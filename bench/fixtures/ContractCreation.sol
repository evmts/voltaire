// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleContract {
    uint256 public value;
    
    constructor(uint256 _value) {
        value = _value;
    }
}

contract ContractCreation {
    function benchmark() public returns (address, address) {
        bytes memory bytecode = type(SimpleContract).creationCode;
        bytes memory constructorArgs = abi.encode(42);
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);
        
        address addr1;
        assembly {
            addr1 := create(0, add(fullBytecode, 0x20), mload(fullBytecode))
        }
        
        bytes32 salt = keccak256("salt");
        address addr2;
        assembly {
            addr2 := create2(0, add(fullBytecode, 0x20), mload(fullBytecode), salt)
        }
        
        return (addr1, addr2);
    }
}