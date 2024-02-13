// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Forwarder} from "../src/Forwarder.sol";

contract ForwarderTest is Test {
    Forwarder public forwarder;

    function setUp() public {
        bytes4 configureNameSpaceSignature = bytes4(keccak256("deployNameSpace()"));
        bytes4[] memory allowedFunctionSignatures = new bytes4[](2);
        allowedFunctionSignatures[1] = configureNameSpaceSignature;
        address sponsorAddress =  0x97E7f2B08a14e4C0A8Dca87fbEB1F68b397c91df;
        forwarder = new Forwarder(allowedFunctionSignatures,sponsorAddress);
    }
    
    function test_GetNonce() public {
        address testAddress = address(this);
        uint256 initialNonce = forwarder.getNonce(testAddress);
        assertEq(initialNonce,   0, "Initial nonce should be   0");
    }

    function test_AllowedFunction() public {
        bytes4 exampleFunctionSignature = bytes4(keccak256("deployNameSpace()"));
        bool isAllowed = forwarder.isFunctionSignatureAllowed(exampleFunctionSignature);
        assertEq(true,  isAllowed, "This function is not allowed");
    }

    function test_SponsorAddressMatches() public {
        address expectedSponsorAddress =   0x97E7f2B08a14e4C0A8Dca87fbEB1F68b397c91df;
        address actualSponsorAddress = forwarder.sponsorAddress();
        assertEq(expectedSponsorAddress, actualSponsorAddress, "Sponsor addresses do not match");
    }
}