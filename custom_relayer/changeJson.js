const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();
const deployConfig = require('./web3/deploy.json');
const ForwarderAbi = require('./abi/Forwarder.json');




const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000' 
}));

app.put('/update-deploy-config', async (req, res) => {
    const { sponsorAddress, sponsorKey } = req.body;
    const configPath = path.join(__dirname, '/web3/deploy.json');

    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL);
    const sponsorWallet = new ethers.Wallet(sponsorKey, provider);
    const sponsorWalletAddress = sponsorWallet.getAddress();
    const resolvedValue = await sponsorWalletAddress;



    if (sponsorAddress !== resolvedValue.toString()){
        console.log(resolvedValue.toString());
        console.log(sponsorAddress);
        console.log("Private Key and Public Key mismatch");
        return;
    }
    


    fs.readFile(configPath, 'utf8', (err, data) => {


        if (err) {
            console.error(err);
            return res.status(500).send('Error reading deploy.json');
        }

        const config = JSON.parse(data);
        config.Sponsor_address = sponsorAddress;
        config.Sponsor_Private_Key = sponsorKey;

        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error writing to deploy.json');
            }
            res.send('Deploy config updated successfully');
        });
    });

    const connectedWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY, provider);
    const forwarderContract = new ethers.Contract(deployConfig.Forwarder, ForwarderAbi, connectedWallet);
    const changeSponsor = await forwarderContract.changeSponsorAddress(sponsorAddress);
    console.log(changeSponsor);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));