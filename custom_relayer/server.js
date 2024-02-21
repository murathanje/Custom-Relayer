const express = require('express');
const ForwarderAbi = require('./abi/Forwarder.json');
const Web3 = require('web3'); 
require('dotenv').config();
const deployConfig = require('./web3/deploy.json');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));
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
        chainId: 5,
        verifyingContract: deployConfig.Forwarder,
    };

    const { request, signature } = req.body;
    const web3 = new Web3(deployConfig.RPC_URL);
    const verifiedAddress = web3.eth.accounts.recoverTypedData(domain, types, request, signature);

    if (request.from !== verifiedAddress) {
        return res.status(400).send({
            message: 'The Transaction could not get verified.'
        });
    }

    const functionSignature = web3.utils.hexlify(request.data.slice(0, 4));

    const privateKey = deployConfig.Sponsor_Private_Key;
    const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);

    const forwarderContract = new web3.eth.Contract(ForwarderAbi, deployConfig.Forwarder);

    const isAllowed = await forwarderContract.methods.isFunctionSignatureAllowed(functionSignature).call({ from: wallet.address });

    if (!isAllowed) {
        return res.status(400).send({
            message: 'The function signature is not allowed.'
        });
    }

    const gasLimit = (parseInt(request.gas) + 50000).toString();
    const tx = await forwarderContract.methods.executeDelegate(request, signature).send({ from: wallet.address, gas: gasLimit });
    const transactionReceipt = await tx.wait();

    return res.json(transactionReceipt);
});

app.listen(4000, () => console.log('listening on port 4000!'));
