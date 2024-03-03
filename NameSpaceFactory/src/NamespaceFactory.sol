// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NamespaceFactory{

    mapping(address => string) public getNamespace;

    function deployNamespace(string memory name) public {
        require(bytes(getNamespace[msg.sender]).length ==  0, "Namespace already exists");
        getNamespace[msg.sender] = name;
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