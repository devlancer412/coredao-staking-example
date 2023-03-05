/* eslint-disable tailwindcss/no-custom-classname */
/* eslint-disable tailwindcss/classnames-order */
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import WOOFAbi from '../contract/WOOF.json'
import MoondogsAbi from '../contract/Moondogs.json'
import MoondogStakingAbi from '../contract/MoondogStaking.json'
import { BigNumber } from 'ethers/lib/ethers'
import { formatUnits } from 'ethers/lib/utils'

interface NFTData {
  id: number
  imageUrl: string
  stakedTime?: number
}

const WOOFAddress = '0xC11c32d243c64E8318557bBFa6966C7C3306d26e'
const MoondogsAddress = '0x48C3d70b7c80230ed4B039Fc155BB51780b41759'
const MoondogStakingAddress = '0xaFD966fE0E5DdE79a2c37FD76bb1B1BF7DD8e350'

const getIpfsUrl = (uri: string) => {
  const splited = uri.replace('ipfs://', '').split('/')
  const cid = splited.shift()
  const subUri = splited.join('/')
  return 'https://' + cid + '.ipfs.nftstorage.link/' + subUri
}

function App() {
  const [currentAccount, setCurrentAccount] = useState(null)
  const [rewardRate, setRewardRate] = useState<number>()
  const [currentTime, setCurrentTime] = useState<number>()
  const [nfts, setNfts] = useState<NFTData[]>([])

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

  const stake = async (nftId: number) => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const erc721Contract = new ethers.Contract(
          MoondogsAddress,
          MoondogsAbi,
          signer
        )
        const stakingContract = new ethers.Contract(
          MoondogStakingAddress,
          MoondogStakingAbi,
          signer
        )
        const signerAddress = await signer.getAddress()
        console.log(signerAddress, nftId)

        console.log('Approving nft to contract')
        let tx = await erc721Contract.approve(MoondogStakingAddress, nftId)

        console.log('wait for the transaction to be confirmed')
        await tx.wait()

        console.log('Stake nft to contract')
        tx = await stakingContract.stakeNFT(nftId)

        console.log('Wait for the transaction to be confirmed')
        const receipt = await tx.wait()

        console.log(
          `Transaction confirmed: https://scan.test.btcs.network/tx/${tx.hash}`
        )

        const timestamp = (await provider.getBlock(receipt.blockHash)).timestamp

        setNfts(
          nfts.map((nft) =>
            nft.id == nftId ? { ...nft, stakedTime: timestamp } : nft
          )
        )
      } else {
        console.log('Ethereum object does not exist')
      }
    } catch (err) {
      console.log(err)
    }
  }

  const unStake = async (nftId: number) => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const stakingContract = new ethers.Contract(
          MoondogStakingAddress,
          MoondogStakingAbi,
          signer
        )
        const signerAddress = await signer.getAddress()
        console.log(signerAddress)

        console.log('UnStake NFT from contract')
        const tx = await stakingContract.unStakeNFT(nftId)

        console.log('Wait for the transaction to be confirmed')
        await tx.wait()

        console.log(
          `Transaction confirmed: https://scan.test.btcs.network/tx/${tx.hash}`
        )

        setNfts(
          nfts.map((nft) =>
            nft.id == nftId ? { ...nft, stakedTime: undefined } : nft
          )
        )
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
        className="cta-button connect-wallet-button text-white"
      >
        Connect Wallet
      </button>
    )
  }

  useEffect(() => {
    checkWalletIsConnected()
    setCurrentTime(Math.floor(new Date().getTime() / 1000))

    const timer = setInterval(() => {
      setCurrentTime(Math.floor(new Date().getTime() / 1000))
    }, 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { ethereum } = window

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum)
          const signer = provider.getSigner()
          const erc721Contract = new ethers.Contract(
            MoondogsAddress,
            MoondogsAbi,
            signer
          )
          const stakingContract = new ethers.Contract(
            MoondogStakingAddress,
            MoondogStakingAbi,
            signer
          )
          const signerAddress = await signer.getAddress()

          const tokenIds = await erc721Contract.tokensOfOwner(signerAddress)
          const stakedTokenIds = await stakingContract.tokensOfOwner(
            signerAddress
          )

          console.log([...tokenIds, ...stakedTokenIds])

          const rewardRateValue = await stakingContract.rewardRate()
          setRewardRate(parseFloat(formatUnits(rewardRateValue, 18)))

          const temp: NFTData[] = []
          for (const tokenId of tokenIds) {
            const metadataUrl = await erc721Contract.tokenURI(tokenId)

            const response = await fetch(getIpfsUrl(metadataUrl))
            const metaData = await response.json()
            const imageUrl = getIpfsUrl(metaData.image)
            temp.push({
              id: (tokenId as BigNumber).toNumber(),
              imageUrl: imageUrl
            })

            setNfts(temp)
          }

          for (const tokenId of stakedTokenIds) {
            const metadataUrl = await erc721Contract.tokenURI(tokenId)

            const response = await fetch(getIpfsUrl(metadataUrl))
            const metaData = await response.json()
            const imageUrl = getIpfsUrl(metaData.image)
            const stakeData = await stakingContract.stakes(tokenId)
            temp.push({
              id: (tokenId as BigNumber).toNumber(),
              imageUrl: imageUrl,
              stakedTime: (stakeData.stakedTime as BigNumber).toNumber()
            })

            setNfts(temp)
          }
        } else {
          console.log('Ethereum object does not exist')
        }
      } catch (err) {
        console.log(err)
      }
    })()
  }, [currentAccount])

  return (
    <div className="fixed top-0 left-0 bg-black min-h-screen w-screen">
      <div className="flex items-center justify-center px-2 mt-8">
        <img className="w-10" src="src/public/logo.png" />
        <p className="my-3 mx-1 text-4xl font-bold text-gray-200 sm:text-4xl sm:tracking-tight lg:text-4xl">
          Moon Dog Staking
        </p>
      </div>
      <div className="mx-auto max-w-screen-xl py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">
            Click "Stake" or "UnStake" to stake your MoonDog
          </p>

          {currentAccount ? (
            <div className="w-full grid grid-cols-4 gap-2">
              {nfts.map((nft) => (
                <div
                  key={nft.id}
                  className="p-1 rounded border-slate-700 cursor-pointer"
                >
                  <img
                    className="w-full rounded-md"
                    src={nft.imageUrl}
                    alt="data"
                  />
                  <button
                    placeholder="Input store number"
                    onClick={() => (nft?.stakedTime ? unStake : stake)(nft.id)}
                    className="btn-primary bg-gray-800 mt-8 w-40 rounded"
                  >
                    {nft?.stakedTime ? 'UnStake' : 'Stake'}
                  </button>
                  {nft?.stakedTime && currentTime && rewardRate && (
                    <div className="w-full text-center text-white">
                      {(currentTime > nft.stakedTime
                        ? (currentTime - nft.stakedTime) * rewardRate
                        : 0
                      ).toFixed(6)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            connectWalletButton()
          )}
        </div>
      </div>
    </div>
  )
}

export default App
