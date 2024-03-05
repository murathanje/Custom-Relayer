// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Forwarder.sol";
import "../src/NamespaceFactory.sol";

contract ForwarderScript is Script {
    
    Forwarder public forwarder;
    NamespaceFactory public namespaceFactory;

    function setUp() public {

        bytes4 deployNameSpaceSignature = bytes4(keccak256("deployNamespace(string)"));
        bytes4[] memory allowedFunctionSignatures = new bytes4[](2);
        allowedFunctionSignatures[0] = deployNameSpaceSignature;
        
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        address sponsorAddress = 0x97E7f2B08a14e4C0A8Dca87fbEB1F68b397c91df;
        
        forwarder = new Forwarder(allowedFunctionSignatures, sponsorAddress);

        address forwarderAddress = address(forwarder);

        namespaceFactory = new NamespaceFactory(forwarderAddress);
        
        vm.stopBroadcast();
    }

    function run() public {

    }
}



