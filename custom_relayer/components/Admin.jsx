import React, { useState } from 'react';
import styles from "../style/home.module.css";
import Web3 from 'web3';


const Admin = () => {
    const [sponsorAddress, setSponsorAddress] = useState('');
    const [sponsorKey, setSponsorKey] = useState('');
    const [connectedStatus, setConnectedStatus] = useState(false);

    const connectMetamask = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.enable();
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length === 0) {
                    throw new Error('Please connect to MetaMask.');
                } else {
                    console.log('Connected to MetaMask with account:', accounts[0]);
                    setConnectedStatus(true);
                }
            } catch (error) {
                console.error("User denied account access...", error);
            }
        } else {
            alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    };

    const switchNetworkToGoerli = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x' + parseInt('5', 10).toString(16),
                        chainName: 'Goerli',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                        blockExplorerUrls: ['https://goerli.etherscan.io/'],
                    }],
                });
            } catch (error) {
                console.error("Failed to switch network:", error);
            }
        } else {
            alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    };

    const handleButtonClick = async () => {
        if (connectedStatus) {
            alert('Already connected');
        } else {
            await connectMetamask();
            await switchNetworkToGoerli();
        }
    };

    const handleConfirm = async () => {
        if (!connectedStatus) {
            alert('Please connect to MetaMask first.');
            return;
        }

        const web3Instance = new Web3(window.ethereum);

        const balanceWei = await web3Instance.eth.getBalance(sponsorAddress);

        const minBalanceWei = web3Instance.utils.toWei('0.01', 'ether');

        
        
        if (balanceWei < minBalanceWei) {

            alert('Insufficient ETH balance. Please add more ETH to your account.');
            return;

        }else{

            fetch('http://localhost:3001/update-deploy-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sponsorAddress: sponsorAddress,
                    sponsorKey: sponsorKey 
                })
            }).then(response => {
                if (response.ok) {
                    alert('Deploy config updated successfully');
                } else {
                    alert('Response status:', response.status);
                }
            }).catch(error => {
                console.error('Error:', error);
                alert('An error occurred while updating the deploy config',error);
            }); sponsorKey;
            
        }

    };


    return (
        <main className={styles.main}>
            <div className={styles.mainContainer}>
                <div className={styles.inputContainer}>
                    <input
                        id="sponsorAddress"
                        type="text"
                        className={styles.input}
                        value={sponsorAddress}
                        onChange={(e) => setSponsorAddress(e.target.value)}
                        placeholder="Sponsor Address"
                    />
                    <input
                        id="sponsorKey"
                        type="text"
                        className={styles.input}
                        value={sponsorKey}
                        onChange={(e) => setSponsorKey(e.target.value)}
                        placeholder="Sponsor Private Key"
                    />
                    <button className={styles.button} onClick={handleConfirm}>
                        Confirm
                    </button>
                    <button className={styles.connectButton} onClick={handleButtonClick}>
                        {connectedStatus ? `${window.ethereum.selectedAddress.slice(0,  10)}` : 'Connect'}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default Admin;
