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
            message: 'Request veya signature değerleri geçersiz formatta.'
        });
    }

    const web3 = new Web3(deployConfig.RPC_URL);


    console.log('Domain:', domain);
    console.log('Types:', types);
    console.log('Request:', request);


    const verifiedAddress = ethers.utils.verifyTypedData(domain, types, request, signature)
    console.log(verifiedAddress);
    if (request.from === verifiedAddress) {
        return res.status(400).send({
            message: 'The Transaction could not get verified.'
        });
    }

    const functionSignature = request.data.slice(0, 8); 

    const privateKey = deployConfig.Sponsor_Private_Key;
    const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);

    const forwarderContract = new web3.eth.Contract(ForwarderAbi, deployConfig.Forwarder);

    // const isAllowed = await forwarderContract.methods.isFunctionSignatureAllowed(functionSignature).call({ from: wallet.address });

    // if (!isAllowed) {
    //     return res.status(400).send({
    //         message: 'The function signature is not allowed.'
    //     });
    // }

    const gasLimit = (parseInt(request.gas) + 50000).toString();
    const tx = await forwarderContract.methods.executeDelegate(request, signatureBytes).send({ from: wallet.address, gas: gasLimit });
    const transactionReceipt = await tx.wait();

    return res.json(transactionReceipt);
});

app.listen(4000, () => console.log('listening on port 4000!'));
