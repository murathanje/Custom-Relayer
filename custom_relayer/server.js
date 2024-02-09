const express = require('express');
const ForwarderAbi = require('./src/abi/Forwarder.json');
const ethers = require('ethers');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/relayTransaction', async (req, res) => {
    const types = {
        ForwardRequest: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'gas', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'data', type: 'bytes' },
        ]
    };

    const domain = {
        name: 'Forwarder',
        version: '0.0.1',
        chainId: 421611,
        verifyingContract: process.env.NEXT_PUBLIC_FORWARDER,
    };

    const { request, signature } = req.body;
    const verifiedAddress = ethers.utils.verifyTypedData(domain, types, request, signature);

    if (request.from !== verifiedAddress) {
        return res.status(400).send({
            message: 'The Transaction could not get verified.'
        });
    }

    const functionSignature = ethers.utils.hexlify(request.data.slice(0, 4));

    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY);
    const provider = ethers.getDefaultProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL);
    const connectedWallet = wallet.connect(provider);

    const forwarderContract = new ethers.Contract(process.env.NEXT_PUBLIC_FORWARDER, ForwarderAbi, connectedWallet);

    const isAllowed = await forwarderContract.isFunctionSignatureAllowed(functionSignature);

    if (!isAllowed) {
        return res.status(400).send({
            message: 'The function signature is not allowed.'
        });
    }

    const gasLimit = (parseInt(request.gas) + 50000).toString();
    const contractTx = await forwarderContract.executeDelegate(request, signature, { gasLimit });
    const transactionReceipt = await contractTx.wait();

    return res.json(transactionReceipt);
});

app.listen(4000, () => console.log('listening on port  4000!'));