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

    const verifiedAddress = ethers.utils.verifyTypedData(domain, types, request, signature)

    if (request.from.toLowerCase() !== verifiedAddress.toLowerCase()) {
        return res.status(400).send({
            message: 'The Transaction could not get verified.'
        });
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL);
    const connectedWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY, provider);
    const forwarderContract = new ethers.Contract(deployConfig.Forwarder, ForwarderAbi, connectedWallet);
    const functionSignature = request.data.slice(0, 10);
    const isAllowed = await forwarderContract.isFunctionSignatureAllowed(functionSignature);
    console.log("Is Allowed ", isAllowed);    

    // if (!isAllowed) {
    //     return res.status(400).send({
    //         message: 'The function signature is not allowed.'
    //     });
    // }

    const gasLimit = (parseInt(request.gas) + 50000).toString();
    const contractTx = await forwarderContract.executeDelegate(request, signature, { gasLimit }); 
    const transactionReceipt = await contractTx.wait();

    return res.json(transactionReceipt);
});

app.listen(4000, () => console.log('listening on port 4000!'));
