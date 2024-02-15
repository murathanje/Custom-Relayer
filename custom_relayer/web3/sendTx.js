import Web3 from 'web3';
import deployConfig from '../web3/deploy.json';
import forwarderAbi from '../abi/Forwarder.json';
import nameSpaceAbi from '../abi/NamespaceFactory.json';

async function sendMessage(message) {
    if (!message || message.length < 1) throw new Error('Message cannot be empty');
    const provider = new Web3(window.ethereum);
    const accounts = await provider.eth.getAccounts();
    const signer = accounts[0];
    const recipient = new provider.eth.Contract(nameSpaceAbi, deployConfig.NameSpaceFactory);

    return await sendMetaTx(recipient, provider, signer, message);
}

async function sendMetaTx(recipient, provider, signer, message) {
    if (!provider.eth.Contract) {
        throw new Error('Web3 provider does not support Contract creation');
    }
    const forwarder = new provider.eth.Contract(forwarderAbi, deployConfig.Forwarder);
    const from = await signer;
    const data = recipient.methods.deployNamespace(message).encodeABI();
    const to = recipient.options.address;

    const request = await signMetaTxRequest(forwarder, { to, from, data });
    const response = await fetch('http://localhost:4000/relayTransaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const responseData = await response.json();
    return responseData;
}

async function signMetaTxRequest(forwarder, input) {
    const request = await buildRequest(forwarder, input);
    const toSign = await buildTypedData(request);
    if (!toSign || !toSign.types) {
        throw new Error('Failed to build typed data');
    }
    const signature = await signTypedData(input.from, toSign);
    return { signature, request };
}

async function buildRequest(forwarder, input) {
    const nonce = await forwarder.methods.getNonce(input.from).call();
    const request = {
        value: 0,
        gas: 10000000,
        nonce,
        from: input.from,
        to: input.to,
        data: input.data,
    };
    return request;
}

async function buildTypedData(request) {
    const chainId = 5;
    const typeData = getMetaTxTypeData(chainId, deployConfig.Forwarder);
    return {
        ...typeData,
        message: request
    };
}

function getMetaTxTypeData(chainId, forwarderAddress) {
    const EIP712Domain = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
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


async function signTypedData(from, data) {
    const typedData = {
        types: data.types,
        domain: {
            ...data.domain,
            chainId: data.domain.chainId,
        },
        primaryType: data.primaryType,
        message: data.message
    };
    const stringifiedData = JSON.stringify(typedData, (_, value) => typeof value === 'bigint' ? value.toString() : value);
    const result = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, stringifiedData],
        from: from
    });
    return result;
}

export { sendMessage };
