// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Forwarder is EIP712 {
    using ECDSA for bytes32;

    address public sponsorAddress;
    address private contractCreator;

   struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }
    bytes32 private constant _TYPEHASH = keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");
    
    mapping(address => uint256) private _nonces;
    mapping(bytes4 => bool) private _allowedFunctionSignatures;


    constructor(bytes4[] memory allowedFunctionSignatures, address _sponsorAddress) EIP712("Forwarder", "0.0.1") {

        contractCreator = msg.sender;
        sponsorAddress = _sponsorAddress;
        
        for (uint256 i =  0; i < allowedFunctionSignatures.length; i++) {
            _allowedFunctionSignatures[allowedFunctionSignatures[i]] = true;
        }
    }

    function changeSponsorAddress(address newSponsorAddress) public {
        require(msg.sender == contractCreator, "Only the contract creator can change the sponsor address.");
        sponsorAddress = newSponsorAddress;
    }

    
    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(abi.encode(_TYPEHASH, req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)))
        ).recover(signature);
        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    function isFunctionSignatureAllowed(bytes4 functionSignature) public view returns (bool) {
        return _allowedFunctionSignatures[functionSignature];
    }

    function executeDelegate(ForwardRequest calldata request, bytes calldata signature) public payable returns(bool, bytes memory) {
        require(verify(request, signature), "Forwarder: signature does not match request");
        require(msg.sender == sponsorAddress, "Only sponsor address can execute this function");
        
        bytes4 functionSignature = bytes4(request.data[:4]);
        require(_allowedFunctionSignatures[functionSignature], "Forwarder: function signature not allowed");
        
        _nonces[request.from] = request.nonce +  1;
        (bool success, bytes memory returndata) = request.to.call{gas: request.gas, value: request.value}(
            abi.encodePacked(request.data, request.from)
        );

        return (success, returndata);
    }
}