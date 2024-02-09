import { ethers } from "ethers";
import { createForwarderInstance } from "./forwarder";
import { createRecipientInstance } from "./recipient";
import { createProvider } from "./provider";

export async function sendMessage(message) {
    if (!message || message.length < 1) throw new Error('Name cannot be empty');
    if (!window.ethereum) throw new Error('No wallet installed');

    const { ethereum } = window;
    await ethereum.request({ method: 'eth_requestAccounts' });
    const userProvider = new ethers.providers.Web3Provider(window.ethereum);
    const provider = createProvider();
    const signer = userProvider.getSigner();
    const recipient = createRecipientInstance(userProvider);

    return await sendMetaTx(recipient, provider, signer, message);
}

async function sendMetaTx(recipient, provider, signer, message) {
    const forwarder = createForwarderInstance(provider);
    const from = await signer.getAddress();
    const data = recipient.interface.encodeFunctionData('addNewMessage', [message]);
    const to = recipient.address;
    const request = await signMetaTxRequest(signer, forwarder, { to, from, data });
    const response = await fetch('http://localhost:4000/relayTransaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });
    const responseData = await response.json();
    return responseData;
}

export async function signMetaTxRequest(signer, forwarder, input) {
    const request = await buildRequest(forwarder, input);
    const toSign = await buildTypedData(forwarder, request);
    const signature = await signTypedData(signer, input.from, toSign);
    return { signature, request };
}

async function buildRequest(forwarder, input) {
    const nonce = await forwarder.getNonce(input.from).then(nonce => nonce.toString());
    return { value: 0, gas: 1e6, nonce, ...input };
}

async function buildTypedData(forwarder, request) {
    const chainId = await forwarder.provider.getNetwork().then(network => network.chainId);
    const typeData = getMetaTxTypeData(chainId, forwarder.address);
    return { ...typeData, message: request };
}

function getMetaTxTypeData(chainId, forwarderAddress) {
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
}

async function signTypedData(signer, from, data) {
    return await signer.provider.send('eth_signTypedData_v4', [from, JSON.stringify(data)]);
}