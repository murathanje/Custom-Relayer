// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NamespaceFactory{

    mapping(address => string) public getNamespace;
    address private immutable _trustedForwarder;
    event NameSpace(address indexed from, string nameSpace);

    constructor(address trustedForwarder) {
        _trustedForwarder = trustedForwarder;
    }

    
    modifier onlyTrustedForwarder {
        require(msg.sender == _trustedForwarder, "only the trusted forwarder can call this function");
        _;
    }


    function deployNamespace(string memory name) public onlyTrustedForwarder {
        address sender;
        assembly {
                    sender := shr(96, calldataload(sub(calldatasize(), 20)))
                }
        require(bytes(getNamespace[sender]).length ==  0, "Namespace already exists");
        getNamespace[sender] = name;
        emit NameSpace(sender, name);
    }

    function changesNamespace(string memory name) public {
        require(bytes(getNamespace[msg.sender]).length >  0, "Namespace does not exist");
        getNamespace[msg.sender] = name;
    }
    
    function getNamespaceOfSender() public view returns (string memory) {
        string memory namespaceName = getNamespace[msg.sender];
        require(bytes(namespaceName).length >  0, "Namespace does not exist");
        return namespaceName;
    }
}