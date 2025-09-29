// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CallTarget {
    uint256 public value = 42;
    
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function setValue(uint256 _value) public {
        value = _value;
    }
}

contract ContractCalls {
    CallTarget public target;
    
    constructor() {
        target = new CallTarget();
    }
    
    function benchmark() public returns (uint256) {
        uint256 result = 0;
        
        (bool success1, bytes memory data1) = address(target).call(
            abi.encodeWithSignature("getValue()")
        );
        if (success1) {
            result = abi.decode(data1, (uint256));
        }
        
        (bool success2,) = address(target).call(
            abi.encodeWithSignature("setValue(uint256)", 100)
        );
        require(success2, "Call failed");
        
        (bool success3, bytes memory data3) = address(target).staticcall(
            abi.encodeWithSignature("getValue()")
        );
        if (success3) {
            result += abi.decode(data3, (uint256));
        }
        
        (bool success4, bytes memory data4) = address(target).delegatecall(
            abi.encodeWithSignature("getValue()")
        );
        if (success4) {
            result += abi.decode(data4, (uint256));
        }
        
        return result;
    }
}