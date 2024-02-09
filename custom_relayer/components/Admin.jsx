import React, { useState } from 'react';
import styles from "../style/home.module.css";
import Web3 from 'web3';

const Admin = () => {
    const [relayerAddress, setRelayerAddress] = useState('');
    const [relayerKey, setRelayerKey] = useState('');
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

    const switchNetworkToArbitrumSepolia = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x' + parseInt('421614', 10).toString(16), 
                        chainName: 'Arbitrum Sepolia',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                        blockExplorerUrls: ['https://explorer.arbitrum.io/#/'],
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
            await switchNetworkToArbitrumSepolia();
        }
    };

    const test = async () => {
        alert(process.env.ADDRESS);
    }
    const handleConfirm = async () => {
        if (!connectedStatus) {
            alert('Please connect to MetaMask first.');
            return;
        }

        const web3Instance = new Web3(window.ethereum);
        const fromAccount = window.ethereum.selectedAddress;
        const messageHex = web3Instance.utils.toHex(relayerKey);

        const balanceWei = await web3Instance.eth.getBalance(relayerAddress);

        const minBalanceWei = web3Instance.utils.toWei('0.01', 'ether');

        const dataToSave = {
            relayerAddress: relayerAddress,
            relayerKey: relayerKey
        };

            
        if (balanceWei > minBalanceWei) {
            alert('Insufficient ETH balance. Please add more ETH to your account.');
            return;
        }

    };


    return (
        <main className={styles.main}>
            <div className={styles.mainContainer}>
                <div className={styles.inputContainer}>
                    <input
                        id="relayerAddress"
                        type="text"
                        className={styles.input}
                        value={relayerAddress}
                        onChange={(e) => setRelayerAddress(e.target.value)}
                        placeholder="Relayer Address"
                    />
                    <input
                        id="relayerKey"
                        type="text"
                        className={styles.input}
                        value={relayerKey}
                        onChange={(e) => setRelayerKey(e.target.value)}
                        placeholder="Relayer Private Key"
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
