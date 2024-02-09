# Meta-Transactions DEMO

## Steps to install

### Clone to local

```bash
 git clone https://github.com/murathanje/Custom-Relayer.git
 cd NameSpaceFactory
 forge install OpenZeppelin/openzeppelin-contracts 
```
 İf you don't have Foundry You can setup in your environment with the following [link](https://book.getfoundry.sh/getting-started/installation): 

### Configure the Contracts


```solidity
    function setUp() public {

        bytes4 deployNameSpaceSignature = bytes4(keccak256("deployNameSpace()"));
        bytes4[] memory allowedFunctionSignatures = new bytes4[](2);
        allowedFunctionSignatures[0] = deployNameSpaceSignature;
        
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        forwarder = new Forwarder(allowedFunctionSignatures);
        namespaceFactory = new NamespaceFactory();
        
        vm.stopBroadcast();
    }
```

- In the ``setUp()`` function in the ``Forwarder.s.sol`` file in the ``/script`` path, add the functions you want users to pay gas fee from the ``bytes4 deployNameSpaceSignature = bytes4(keccak256("deployNameSpace()"));`` section as in the ``deployNameSpace()`` example and include them in the ``allowedFunctionSignatures[0] = deployNameSpaceSignature;`` array.
- Followed by 
```bash
forge script script/Forwarder.s.sol:ForwarderScript --rpc-url $ETH_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
```
and paste the addresses of the deployed contracts ``Forwarder.sol`` and ``NamespaceFactory.sol`` into the ``Forwarder`` and ``NameSpaceFactory`` sections of the ``/custom_relayer/web3/deploy.json`` path.


### Trying the Demo

#### Admin


- Now open a new terminal 
```bash
cd custom_relayer
npm run dev
```
Let's open the demo by running the commands

- Then open a new terminal 
```bash
cd custom_relayer
node changeJson.js 
```
Let's run our server code with the command. Thanks to this code, Admin can specify the sponsor address

- Now, from the interface, first connect your Metamask wallet and then click on the Admin button
- Then specify the address that will sponsor user transactions by entering the sponsor address and private key
- During this process, the system also checks whether the address designated as a sponsor has enough ETH.
- For example, you can try the private key and public key values in ``/web3/deploy.json`` right now.


#### User

- Now let's go to the User page by clicking on the User button.
- Open a new terminal 
```bash
cd custom_relayer
node server.js
```
Let's run the command. This server code will be our server code that forwards our meta transactions to the Forwarder.
- Then let's perform the operation we want by entering a Namespace in the input on the screen.
- In our current example, creating a Namespace is done with a meta transaction and the user does not pay a gas fee, while the user pays a gas fee to change the Namespace. This is because of the function names we set while deploying the ``Forwarder.s.sol`` file.




