const express = require('express');
const ForwarderAbi = require('./abi/Forwarder.json');
const {Web3} = require('web3'); 
require('dotenv').config();
const deployConfig = require('./web3/deploy.json');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));


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
        chainId: 5,
        verifyingContract: deployConfig.Forwarder,
    };

    const { request, signature } = req.body;

    if (typeof request !== 'object') {
        return res.status(400).send({
            message: 'Request type doesn\'t exist'
        });
    }

    const web3 = new Web3(deployConfig.RPC_URL);


    console.log('Domain:', domain);
    console.log('Types:', types);
    console.log('Request:', request);


    const verifiedAddress = ethers.utils.verifyTypedData(domain, types, request, signature)
    console.log(verifiedAddress);
    console.log(request.from);

    if (request.from.toLowerCase() !== verifiedAddress.toLowerCase()) {
        return res.status(400).send({
            message: 'The Transaction could not get verified.'
        });
    }

    const connectedWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY)
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL);

    const forwarderContract = new web3.eth.Contract(ForwarderAbi, deployConfig.Forwarder);
    const forwarderContract1 = new ethers.Contract(deployConfig.Forwarder, ForwarderAbi, connectedWallet)
    const isAllowed = await forwarderContract1.methods.isFunctionSignatureAllowed(functionSignature).call({ from: wallet.address });

    if (!isAllowed) {
        return res.status(400).send({
            message: 'The function signature is not allowed.'
        });
    }

    const gasLimit = (parseInt(request.gas) + 50000).toString();
    const contractTx = await forwarderContract1.executeDelegate(request, signature, { gasLimit }); const transactionReceipt = await contractTx.wait();

    return res.json(transactionReceipt);
});

app.listen(4000, () => console.log('listening on port 4000!'));
