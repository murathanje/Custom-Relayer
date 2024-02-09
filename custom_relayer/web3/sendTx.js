import Web3 from 'web3';
import forwarderAbi from "../abi/Forwarder.json";
const deployConfig = require('../web3/deploy.json');
import nameSpaceAbi from "../abi/NamespaceFactory.json"

const createProvider = async () => {
    if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Ethereum browser extension.');
    }
    const provider = new Web3(window.ethereum);
    try {
        // Request account access if needed
        await window.ethereum.enable();
    } catch (error) {
        console.error("User denied account access");
    }
    return provider;
};

const createForwarderInstance = (provider) => {
    const forwarderAddress = deployConfig.Forwarder;
    return new provider.eth.Contract(forwarderAbi, forwarderAddress);
};

const createnameSpaceInstance = (provider) => {
    const nameSpaceAddress = deployConfig.Forwarder;
    return new provider.eth.Contract(nameSpaceAbi, nameSpaceAddress);
};

const sendMessage = async (message) => {
    if (!message || message.length < 1) throw new Error('Name cannot be empty');
    if (!window.ethereum) throw new Error('No wallet installed');

    const provider = await createProvider();
    const accounts = await provider.eth.getAccounts();
    const signer = accounts[0];
    const nameSpace = createnameSpaceInstance(provider);

    return await sendMetaTx(nameSpace, provider, signer, message);
};

const sendMetaTx = async (nameSpace, provider, signer, message) => {
    const forwarder = createForwarderInstance(provider);
    const from = signer;
    const data = nameSpace.methods.deployNamespace(message).encodeABI();
    const to = nameSpace.options.address;
    const request = await signMetaTxRequest(signer, forwarder, { to, from, data });
    const response = await fetch('http://localhost:4000/relayTransaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};

const signMetaTxRequest = async (signer, forwarder, input) => {
    const request = await buildRequest(forwarder, input);
    const toSign = await buildTypedData(forwarder, request);
    const signature = await signTypedData(signer, input.from, toSign);
    return { signature, request };
};

const buildRequest = async (forwarder, input) => {
    const nonce = await forwarder.methods.getNonce(input.from).call();
    return { value: 0, gas: 1e6, nonce, ...input };
};

const buildTypedData = async (forwarder, request) => {
    const chainId = await forwarder.currentProvider.chainId;
    const typeData = getMetaTxTypeData(chainId, forwarder.options.address);
    return { ...typeData, message: request };
};

const getMetaTxTypeData = (chainId, forwarderAddress) => {
    // Setup to use the signedTypedData function from ethereum
    const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
    ];

    const ForwardRequest = [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' },
    ];
    return {
        types: {
            EIP712Domain,
            ForwardRequest,
        },
        domain: {
            name: 'Forwarder',
            version: '0.0.1',
            chainId,
            verifyingContract: forwarderAddress,
        },
        primaryType: 'ForwardRequest',
    };
};

const signTypedData = async (signer, from, data) => {
    return await signer.provider.send('eth_signTypedData_v4', [from, JSON.stringify(data)]);
};

export { sendMessage };