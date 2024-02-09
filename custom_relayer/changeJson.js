const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000' 
}));

app.put('/update-deploy-config', (req, res) => {
    const { sponsorAddress, sponsorKey } = req.body;
    const configPath = path.join(__dirname, '/web3/deploy.json');

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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));