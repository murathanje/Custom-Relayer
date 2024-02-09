import React, { useState } from 'react';
import styles from "../style/home.module.css";
import Web3 from 'web3';
import ForwarderAbi from "../abi/Forwarder.json";
import NamespaceFactoryAbi from "../abi/NamespaceFactory.json";



const User = () => {

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

    const changesNamespaceSignature = web3Instance.utils.keccak256('changesNamespace(string)').slice(0, 10);

    const forwarderContract = new web3Instance.eth.Contract(ForwarderAbi, process.env.NEXT_PUBLIC_FORWARDER);

    const isAllowed = await forwarderContract.methods.isFunctionSignatureAllowed(changesNamespaceSignature).call();

    if (!isAllowed) {
      const namespaceFactoryContract = new web3Instance.eth.Contract(NamespaceFactoryAbi, process.env.NEXT_PUBLIC_NAMESPACE);

      const tx = namespaceFactoryContract.methods.changesNamespace(relayerAddress);
      const gas = await tx.estimateGas({ from: fromAccount });
      const receipt = await tx.send({ from: fromAccount, gas });

      if (receipt.status) {
        alert('Namespace updated successfully.');
      } else {
        alert('Failed to update namespace.');
      }
    }


    try {
      const response = await sendMessage(relayerAddress);
    } catch (error) {
      alret(error);
    }
    
  };

  const handleConfirm = async () => {
    if (!connectedStatus) {
      alert('Please connect to MetaMask first.');
      return;
    }

    const web3Instance = new Web3(window.ethereum);
    const fromAccount = window.ethereum.selectedAddress;
    const messageHex = web3Instance.utils.toHex(relayerKey);

    const balanceWei = await web3Instance.eth.getBalance(fromAccount);

    const minBalanceWei = web3Instance.utils.toWei('0.01', 'ether');

    if (balanceWei < minBalanceWei) {
      alert('Insufficient ETH balance. Please add more ETH to your account.');
      return;
    }

    try {
      const response = await fetch('/api/updateConstants.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: relayerAddress, key: relayerKey }),
      });

      if (response.ok) {
        alert('Constants updated successfully.');
      } else {
        alert('Failed to update constants.');
      }
      // const signature = await window.ethereum.request({
      //     method: 'personal_sign',
      //     params: [messageHex, fromAccount],
      //     from: fromAccount
      // });
      // console.log('Signature:', signature);
      // alert(`Message signed successfully. Signature: ${signature}`);
    } catch (err) {
      console.error("An error occurred while signing the message:", err);
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
            value={relayerAddress}
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