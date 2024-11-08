import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';

const Home = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [tokenContract, setTokenContract] = useState("0x6B175474E89094C44Da98b954EedeAC495271d0F");
  const [tokenHolder, setTokenHolder] = useState("0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8");
  const [tokenProvider, setTokenProvider] = useState("https://mainnet.infura.io/v3/YOUR_API_KEY");
  const [web3, setWeb3] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amountToSend, setAmountToSend] = useState('');
  const [holderSecretKey, setHolderSecretKey] = useState(''); // New state for secret key
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (tokenProvider) {
      try {
        const newWeb3 = new Web3(new Web3.providers.HttpProvider(tokenProvider));
        setWeb3(newWeb3);
      } catch (error) {
        console.error("Failed to initialize Web3:", error);
        setErrorMessage("Invalid provider URL.");
      }
    }
  }, [tokenProvider]);

  const balanceOfABI = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
  ];

  // The ABI to send ERC20 Token transfers
  const transferABI = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "type": "function"
    }
  ];

  const getTokenBalance = async () => {
    setBalance(0);
    setErrorMessage("");
    if (!web3) return; // Ensure web3 is initialized
    const contract = new web3.eth.Contract(balanceOfABI, tokenContract);
    try {
      const result = await contract.methods.balanceOf(tokenHolder).call();
      const formattedResult = parseFloat(web3.utils.fromWei(result, "ether")).toFixed(4); // Limit to 4 decimals
      setBalance(formattedResult);
      setErrorMessage(''); // Clear any previous error messages
    } catch (error) {
      console.error("Error fetching balance:", error);
      setErrorMessage("Failed to fetch balance. " + error.message);
    }
  };

  const handleSendTransaction = async () => {
    if (!web3) return;

    const amountInWei = web3.utils.toWei(amountToSend, "ether");
    const accounts = await web3.eth.getAccounts();

    try {
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 200000;

      // Use the input secret key
      const walletSecret = holderSecretKey;

      // Creating a signing account from a private key
      const signer = web3.eth.accounts.privateKeyToAccount(walletSecret);
      web3.eth.accounts.wallet.add(signer);

      const web3contract = new web3.eth.Contract(transferABI, tokenContract, { from: signer.address });

      const params = {
        from: tokenHolder,
        to: destinationAddress,
        nonce: await web3.eth.getTransactionCount(tokenHolder),
        value: '0x00',
        data: web3contract.methods.transfer(tokenHolder, amountInWei).encodeABI(),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
      };

      const signedTx = await web3.eth.accounts.signTransaction(params, walletSecret );

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
          .once("transactionHash", (txhash) => {
            console.log(`Mining transaction ...`);
            console.log(`https://polygonscan.com/tx/${txhash}`);
            alert(txhash);
          });
      // The transaction is now on chain!
      console.log(`Mined in block ${receipt.blockNumber}`);

      alert('Transaction successful!');
      setShowModal(false);
      setDestinationAddress('');
      setAmountToSend('');
      setHolderSecretKey(''); // Clear the secret key after transaction
    } catch (error) {
      console.error("Transaction failed:", error);
      setErrorMessage("Transaction failed. Please check the console for more details.");
    }
  };

  const isAmountValid = () => {
    return parseFloat(amountToSend) > 0 && parseFloat(amountToSend) <= parseFloat(balance);
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Helmet>
          <title>{t('seo_title')}</title>
          <meta name='description' content={t('seo_description')} />
        </Helmet>

        <h1 className="text-3xl font-bold mb-2">ERC-20 Token</h1>
        <p className="text-gray-500 mb-6">Get Balance & Send Transactions</p>

        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Token Contract:</label>
            <input
                type="text"
                value={tokenContract}
                onChange={(e) => setTokenContract(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Token Holder:</label>
            <input
                type="text"
                value={tokenHolder}
                onChange={(e) => setTokenHolder(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Token Provider:</label>
            <input
                type="text"
                value={tokenProvider}
                onChange={(e) => setTokenProvider(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <button
              onClick={getTokenBalance}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Connect
          </button>

          {balance > 0 && (
              <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                Send Transaction
              </button>
          )}

          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>

        <h2 className="text-xl font-semibold mt-6">Balance:</h2>
        <p className="text-lg text-gray-800">{balance}</p>

        {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-80">
                <h3 className="text-lg font-semibold mb-4">Send Transaction</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Destination Address:</label>
                  <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Amount to Send:</label>
                  <input
                      type="number"
                      value={ amountToSend}
                      onChange={(e) => setAmountToSend(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                  />
                  {amountToSend && !isAmountValid() && (
                      <p className="text-red-500 mt-1">Amount must be greater than 0 and less than or equal to your balance.</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Wallet Secret Key:</label>
                  <input
                      type="text"
                      value={holderSecretKey}
                      onChange={(e) => setHolderSecretKey(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
                  />
                </div>

                <button
                    onClick={handleSendTransaction}
                    disabled={!isAmountValid()}
                    className={`w-full ${isAmountValid() ? 'bg-blue-600' : 'bg-gray-400'} text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200`}
                >
                  Send
                </button>
                <button
                    onClick={() => setShowModal(false)}
                    className="mt-2 w-full bg-red-600 text-white font-semibold py-2 rounded-md hover:bg-red-700 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
        )}
      </div>
  );
};

export default Home;