import Web3 from 'web3';
import deployConfig from '../web3/deploy.json';
import forwarderAbi from '../abi/Forwarder.json';
import nameSpaceAbi from '../abi/NamespaceFactory.json';


async function sendMessage(message) {
    if (!message || message.length < 1) throw new Error('Message cannot be empty');

    if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.');
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new Web3(window.ethereum);
    const signer = provider.eth.defaultAccount;
    const recipient = new provider.eth.Contract(nameSpaceAbi, deployConfig.NameSpaceFactory);

    return await sendMetaTx(recipient, provider, signer, message);
}

async function sendMetaTx(recipient, provider, signer, message) {
    const forwarder = new provider.eth.Contract(forwarderAbi, deployConfig.Forwarder);
    const from = await signer;
    const data = recipient.methods.changesNamespace(message).encodeABI();
    const to = recipient.options.address;

    const request = await signMetaTxRequest(signer, forwarder, { to, from, data });
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

async function signMetaTxRequest(signer, forwarder, input) {
    const request = await buildRequest(forwarder, input);
    const toSign = await buildTypedData(request);
    const signature = await signTypedData(signer, input.from, toSign);
    return { signature, request };
}

async function buildRequest(forwarder, input) {
    const nonce = await forwarder.methods.getNonce(input.from).call();
    const request = {
        value: 0,
        gas: 1e6,
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
    return Object.assign({}, typeData, { message: request });
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
}
async function signTypedData(signer, from, data) {
    return await signer.signTypedData([from, JSON.stringify(data)]);
}

export { sendMessage };
