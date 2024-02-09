// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Forwarder} from "../src/Forwarder.sol";

contract ForwarderTest is Test {
    Forwarder public forwarder;

    function setUp() public {
        bytes4 deployNameSpaceSignature = bytes4(keccak256("deployNameSpace()"));
        bytes4 configureNameSpaceSignature = bytes4(keccak256("configureNameSpace(address)"));
        bytes4[] memory allowedFunctionSignatures = new bytes4[](2);
        allowedFunctionSignatures[0] = deployNameSpaceSignature;
        allowedFunctionSignatures[1] = configureNameSpaceSignature;
        forwarder = new Forwarder(allowedFunctionSignatures);
    }
    
    function test_GetNonce() public {
        address testAddress = address(this);
        uint256 initialNonce = forwarder.getNonce(testAddress);
        assertEq(initialNonce,  0, "Initial nonce should be  0");
    }
}