import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { bigNumberify } from '@ethersproject/bignumber'; 
import forwarderAbi from "../abi/Forwarder.json";
import nameSpaceAbi from "../abi/NamespaceFactory.json";
import deployConfig from '../web3/deploy.json';

const createProvider = async () => {
    if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Ethereum browser extension.');
    }
    const provider = new JsonRpcProvider(window.ethereum);
    try {
        await window.ethereum.enable();
    } catch (error) {
        console.error("User denied account access");
    }
    return provider;
};

const createForwarderInstance = (provider) => {
    const forwarderAddress = deployConfig.Forwarder;
    return new Contract(forwarderAddress, forwarderAbi, provider);
};

const createNameSpaceInstance = (provider) => {
    const nameSpaceAddress = deployConfig.Forwarder;
    return new Contract(nameSpaceAddress, nameSpaceAbi, provider);
};

const sendMessage = async (message) => {
    if (!message || message.length < 1) throw new Error('Name cannot be empty');
    if (!window.ethereum) throw new Error('No wallet installed');

    const provider = await createProvider();
    const signer = provider.getSigner();
    const nameSpace = createNameSpaceInstance(provider);

    return await sendMetaTx(nameSpace, provider, signer, message);
};

const sendMetaTx = async (nameSpace, provider, signer, message) => {
    const forwarder = createForwarderInstance(provider);
    const from = await signer.getAddress();
    const data = nameSpace.interface.encodeFunctionData('deployNamespace', [message]);
    const to = nameSpace.address;
    const request = await signMetaTxRequest(provider, forwarder, { to, from, data });
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

const signMetaTxRequest = async (provider, forwarder, input) => {
    const request = await buildRequest(forwarder, input);
    const toSign = await buildTypedData(forwarder, request);
    const signature = await signTypedData(provider, input.from, toSign);
    return { signature, request };
};

const buildRequest = async (forwarder, input) => {
    const nonce = await forwarder.functions.getNonce(input.from);
    return {
        from: input.from,
        to: input.to,
        value: parseEther(input.value || '0'),
        gas: bigNumberify(input.gas || 1e6),
        nonce: nonce,
        data: input.data
    };
};

const buildTypedData = async (forwarder, request) => {
    const chainId = (await forwarder.provider.getNetwork()).chainId;
    const typeData = getMetaTxTypeData(String(chainId), forwarder.address);
    const serializedMessage = {
        from: request.from,
        to: request.to,
        value: parseEther(request.value).toString(),
        gas: request.gas.toString(),
        nonce: request.nonce.toString(),
        data: request.data
    };
    return {
        ...typeData,
        message: serializedMessage
    };
};

const getMetaTxTypeData = (chainId, forwarderAddress) => {
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

const signTypedData = async (provider, from, data) => {
    const signer = new Wallet(from, provider);
    return await signer.signTypedData(data.domain, data.types, data.message);
};

export { sendMessage };