import React, { useState } from 'react';
import styles from "../style/home.module.css";
import Web3 from 'web3';


const Admin = () => {

    const [sponsorAddress, setSponsorAddress] = useState('');
    const [sponsorKey, setSponsorKey] = useState('');

    const handleConfirm = async () => {

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
                </div>
            </div>
        </main>
    );
};

export default Admin;
