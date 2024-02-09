// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Forwarder.sol";
import "../src/NamespaceFactory.sol";

contract ForwarderScript is Script {
    Forwarder public forwarder;
    NamespaceFactory public namespaceFactory;

    function setUp() public {

        bytes4 deployNameSpaceSignature = bytes4(keccak256("deployNameSpace()"));
        bytes4 configureNameSpaceSignature = bytes4(keccak256("configureNameSpace(address)"));
        bytes4[] memory allowedFunctionSignatures = new bytes4[](2);
        allowedFunctionSignatures[0] = deployNameSpaceSignature;
        allowedFunctionSignatures[1] = configureNameSpaceSignature;
        
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        forwarder = new Forwarder(allowedFunctionSignatures);
        namespaceFactory = new NamespaceFactory();
        
        vm.stopBroadcast();
    }

    function run() public {
    }
}



