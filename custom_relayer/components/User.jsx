import React, { useState } from 'react';
import styles from "../style/home.module.css";
import Web3 from 'web3';
import ForwarderAbi from "../abi/Forwarder.json";
import NamespaceFactoryAbi from "../abi/NamespaceFactory.json";
import { sendMessage } from '../web3/sendTx';



const User = () => {

  const [nameSpace, setRelayerAddress] = useState('');
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
            chainId: '0x' + parseInt('421614', 10).toString(16), // Convert chain ID to hexadecimal
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



  const handleConfigure = async () => {
    if (!connectedStatus) {
      alert('Please connect to MetaMask first.');
      return;
    }

    const web3Instance = new Web3(window.ethereum);
    const fromAccount = window.ethereum.selectedAddress;

    
    if (!isAllowed('changesNamespace(string)')) {
      const namespaceFactoryContract = new web3Instance.eth.Contract(NamespaceFactoryAbi, process.env.NEXT_PUBLIC_NAMESPACE);

      const tx = namespaceFactoryContract.methods.changesNamespace(nameSpace);
      const gas = await tx.estimateGas({ from: fromAccount });
      const receipt = await tx.send({ from: fromAccount, gas });

      if (receipt.status) {
        alert('Namespace updated successfully.');
        return;
      } else {
        alert('Failed to update namespace.');
        return;
      }
    }

    try {
      const response = await sendMessage(nameSpace);
    } catch (error) {
      alert(error);
    }
    
  };

  const isAllowed = async (functionName) => {

    const web3Instance = new Web3(window.ethereum);
    
    const fromAccount = window.ethereum.selectedAddress;

    const functionSignature = web3Instance.utils.keccak256(functionName).slice(0, 10);

    const forwarderContract = new web3Instance.eth.Contract(ForwarderAbi, process.env.NEXT_PUBLIC_FORWARDER);

    const isAllowed = await forwarderContract.methods.isFunctionSignatureAllowed(functionSignature).call();

    return isAllowed;

  }

  const handleConfirm = async () => {
    if (!connectedStatus) {
      alert('Please connect to MetaMask first.');
      return;
    }

    const web3Instance = new Web3(window.ethereum);
    const fromAccount = window.ethereum.selectedAddress;


    if (!isAllowed('deployNamespace(string)')) {
      const namespaceFactoryContract = new web3Instance.eth.Contract(NamespaceFactoryAbi, process.env.NEXT_PUBLIC_NAMESPACE);

      const tx = namespaceFactoryContract.methods.changesNamespace(nameSpace);
      const gas = await tx.estimateGas({ from: fromAccount });
      const receipt = await tx.send({ from: fromAccount, gas });

      if (receipt.status) {
        alert('Namespace updated successfully.');
        return;
      } else {
        alert('Failed to update namespace.');
        return;
      }
    }

    try {
      const response = await sendMessage(nameSpace);
    } catch (error) {
      alert(error);
    }

  };

  return (
    <main className={styles.main}>
      <div className={styles.mainContainer}>
        <div className={styles.inputContainer}>
          <input
            id="nameSpace"
            type="text"
            className={styles.input}
            value={nameSpace}
            onChange={(e) => setRelayerAddress(e.target.value)}
            placeholder="Name Space"
          />
          <button className={styles.button} onClick={handleConfirm}>
            Create a NameSpace
          </button>
          <button className={styles.button} onClick={handleConfigure}>
            Configure
          </button>
          <button className={styles.connectButton} onClick={handleButtonClick}>
            {connectedStatus ? `${window.ethereum.selectedAddress.slice(0, 10)}` : 'Connect'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default User