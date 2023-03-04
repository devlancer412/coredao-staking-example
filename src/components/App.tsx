/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable tailwindcss/classnames-order */
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import ERC20Abi from '../contract/TestERC20.json'
import ERC721Abi from '../contract/TestERC721.json'
import StakingAbi from '../contract/TestStaking.json'
import { BigNumber } from 'ethers/lib/ethers'

const testERC20Address = '0x0cDa00E9df9186c14e4038b35B03659Cc56F8B01'
const testERC721Address = '0xCE2330E60c6cDf86eb77745a52334193c07F1Da9'
const testStakingAddress = '0x09AD1Be1f647B5a137e24F08492feCddF625BBEB'

function App() {
  const [currentAccount, setCurrentAccount] = useState(null)
  const [tokenId, setTokenId] = useState<number>(1)
  const [retrievedNumber, setRetrievedNumber] = useState('')
  const checkWalletIsConnected = async () => {
    const { ethereum } = window

    if (!ethereum) {
      console.log('Make sure you have Metamask installed!')
      return
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' })

    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log('Found an authorized account: ', account)
      setCurrentAccount(account)
    } else {
      console.log('No authorized account found')
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window

    if (!ethereum) {
      alert('Please install Metamask!')
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      console.log(accounts[0])
      console.log('Found an account! Address: ', accounts[0])
      setCurrentAccount(accounts[0])
    } catch (err) {
      console.log(err)
    }
  }

  const stake = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const erc721Contract = new ethers.Contract(
          testERC721Address,
          ERC721Abi,
          signer
        )
        const stakingContract = new ethers.Contract(
          testStakingAddress,
          StakingAbi,
          signer
        )
        const signerAddress = await signer.getAddress()
        console.log(signerAddress, tokenId)

        console.log('Approving nft to contract')
        let tx = await erc721Contract.approve(testStakingAddress, tokenId)

        console.log('wait for the transaction to be confirmed')
        tx.wait()

        console.log('Stake nft to contract')
        tx = await stakingContract.stakeNFT(tokenId)

        console.log('Wait for the transaction to be confirmed')
        await tx.wait()

        console.log(
          `Transaction confirmed: https://scan.test.btcs.network/tx/${tx.hash}`
        )
      } else {
        console.log('Ethereum object does not exist')
      }
    } catch (err) {
      console.log(err)
    }
  }
  const unStake = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const erc20Contract = new ethers.Contract(
          testERC20Address,
          ERC20Abi,
          signer
        )
        const stakingContract = new ethers.Contract(
          testStakingAddress,
          StakingAbi,
          signer
        )
        const signerAddress = await signer.getAddress()
        console.log(signerAddress)

        console.log('UnStake NFT from contract')
        const tx = await stakingContract.unStakeNFT(tokenId)

        console.log('Wait for the transaction to be confirmed')
        await tx.wait()

        console.log(
          `Transaction confirmed: https://scan.test.btcs.network/tx/${tx.hash}`
        )

        const tokenAmount = await erc20Contract.balanceOf(signerAddress)
        setRetrievedNumber((tokenAmount as BigNumber).toString())
      } else {
        console.log('Ethereum object does not exist')
      }
    } catch (err) {
      console.log(err)
    }
  }

  const connectWalletButton = () => {
    return (
      <button
        onClick={connectWalletHandler}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    )
  }

  const storageButton = () => {
    return (
      <div className="mt-8 inline-block text-left">
        <div className="text-left">
          <button onClick={stake} className="btn-primary w-40 rounded-r-none">
            Stake
          </button>
          <input
            value={tokenId}
            onChange={(e) => setTokenId(parseInt(e.target.value))}
            className="rounded-l-none border-2 border-solid border-orange-500 caret-orange-500 focus:caret-indigo-500 py-1 px-2 h-10"
          />
        </div>
        <div>
          <button
            placeholder="Input store number"
            onClick={unStake}
            className="btn-primary w-40 mt-8 w-40 rounded-r-none"
          >
            UnStake
          </button>
          <input
            placeholder="Reward value"
            disabled
            value={retrievedNumber}
            className="text-center rounded-l-none border-2 border-solid border-disabled-500 caret-orange-500 focus:caret-indigo-500 py-1 px-2 h-10"
          />
        </div>
      </div>
    )
  }

  useEffect(() => {
    checkWalletIsConnected()
  }, [])

  return (
    <div className="bg-white">
      <div className="flex items-center justify-center px-2 mt-8">
        <img className="w-10" src="src/public/logo.png" />
        <p className="my-3 mx-1 text-4xl font-bold text-gray-900 sm:text-4xl sm:tracking-tight lg:text-4xl">
          CORE
        </p>
      </div>
      <div className="mx-auto max-w-screen-xl py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold uppercase tracking-wide text-orange-600">
            Welcome to
          </h2>

          <p className="my-3 text-4xl font-bold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple Staking Contract Test
          </p>

          <p className="text-xl text-gray-400">
            Click "Stake" or "UnStake" to call smart contract
          </p>

          {currentAccount ? storageButton() : connectWalletButton()}
        </div>
        <div className="mt-8 text-center">
          <span className="text-sm">Contract addresses:</span>
          <a
            target="_blank"
            className="ml-4 text-sm  text-orange-400 hover:text-orange-600"
            href="https://scan.test.btcs.network/address/0x560628404e0decbd09446bd770b12cc204f1c987"
            rel="noreferrer"
          >
            0x0cDa00E9df9186c14e4038b35B03659Cc56F8B01
            0xCE2330E60c6cDf86eb77745a52334193c07F1Da9
            0x09AD1Be1f647B5a137e24F08492feCddF625BBEB
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
