import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("WalletFamily contract", function () {
    async function fixture() {  
      const [owner, account, ...others] = await ethers.getSigners()
      const getcontract = await ethers.getContractFactory("WalletFamily")
      const myContract = await getcontract.connect(owner).deploy()
  
      return { myContract, owner,account, others }
    }

    it("approveChild normal", async () => {
      const { myContract, owner, account, others } = await loadFixture(fixture)
      const [addr1, addr2, addr3] = others

      // nonce生成
      let dateTime = new Date;
      let nonceBytes = ethers.utils.toUtf8Bytes(addr2.address + addr2.getTransactionCount + dateTime.toString())
      let nonce = ethers.utils.keccak256(nonceBytes)
      console.log(nonce)

      // メッセージのバイト列を取得
      const hash = await myContract.getMessageHash(addr2.address,addr1.address,nonce)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      console.log("sig",sig)
      const ethHash = await myContract.getEthSignedMessageHash(hash)
      console.log("signer          ", addr2.address)
      console.log("recovered signer", await myContract.recoverSigner(ethHash, sig))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,nonce,sig)).not.to.be.reverted

      // approve check
      expect(await myContract.connect(addr1).getApproveList()).to.deep.equals([addr2.address])
      expect(await myContract.connect(addr2).getApproveList()).to.deep.equals([])

      // fix exe
      expect(await myContract.connect(addr1).getFixList(addr1.address)).to.deep.equals([])
      await expect(myContract.connect(addr1).fixChild(addr2.address)).not.to.be.reverted

      // veryfy
      expect(await myContract.connect(addr1).isChild(addr2.address)).to.equals(true)
      expect(await myContract.connect(addr3).isChildPair(addr1.address,addr2.address)).to.equals(true)

      // fix list
      expect(await myContract.connect(addr1).getFixList(addr1.address)).to.deep.equals([addr2.address])

    })

    it("approveChild normal multi", async () => {
      const { myContract, owner, account, others } = await loadFixture(fixture)
      const [addr1, addr2, addr3,addr4,addr5] = others

      // nonce生成
      let dateTime = new Date;
      let nonceBytes = ethers.utils.toUtf8Bytes(addr2.address + addr2.getTransactionCount + dateTime.toString())
      const nonce_2 = ethers.utils.keccak256(nonceBytes)
      nonceBytes = ethers.utils.toUtf8Bytes(addr4.address + addr4.getTransactionCount + dateTime.toString())
      const nonce_4 = ethers.utils.keccak256(nonceBytes)
      nonceBytes = ethers.utils.toUtf8Bytes(addr5.address + addr5.getTransactionCount + dateTime.toString())
      const nonce_5 = ethers.utils.keccak256(nonceBytes)

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address,nonce_2)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_1 = await myContract.getMessageHash(addr4.address,addr1.address,nonce_4)
      const sig_1  = await addr4.signMessage(ethers.utils.arrayify(hash_1))
      const hash_2 = await myContract.getMessageHash(addr5.address,addr1.address,nonce_5)
      const sig_2  = await addr5.signMessage(ethers.utils.arrayify(hash_2))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,nonce_2,sig)).not.to.be.reverted
      await expect(myContract.connect(addr4).approveChild(addr1.address,nonce_4,sig_1)).not.to.be.reverted
      await expect(myContract.connect(addr5).approveChild(addr1.address,nonce_5,sig_2)).not.to.be.reverted

      // approve check
      expect(await myContract.connect(addr1).getApproveList())
        .to.deep.equals([addr2.address,addr4.address,addr5.address])
      expect(await myContract.connect(addr2).getApproveList()).to.deep.equals([])

      // fix exe
      expect(await myContract.connect(addr1).getFixList(addr1.address)).to.deep.equals([])
      await expect(myContract.connect(addr1).fixChild(addr2.address)).not.to.be.reverted
      await expect(myContract.connect(addr1).fixChild(addr4.address)).not.to.be.reverted
      await expect(myContract.connect(addr1).fixChild(addr5.address)).not.to.be.reverted

      // veryfy
      expect(await myContract.connect(addr1).isChild(addr2.address)).to.equals(true)
      expect(await myContract.connect(addr3).isChildPair(addr1.address,addr2.address)).to.equals(true)
      expect(await myContract.connect(addr1).isChild(addr3.address)).to.equals(false)
      expect(await myContract.connect(addr3).isChildPair(addr1.address,addr3.address)).to.equals(false)
      expect(await myContract.connect(addr1).isChild(addr4.address)).to.equals(true)
      expect(await myContract.connect(addr3).isChildPair(addr1.address,addr4.address)).to.equals(true)
      expect(await myContract.connect(addr1).isChild(addr5.address)).to.equals(true)
      expect(await myContract.connect(addr3).isChildPair(addr1.address,addr5.address)).to.equals(true)

      // fix list
      expect(await myContract.connect(addr1).getFixList(addr1.address))
        .to.deep.equals([addr2.address,addr4.address,addr5.address])

    })

    it("approveChild delete", async () => {
      const { myContract, owner, account, others } = await loadFixture(fixture)
      const [addr1, addr2, addr3,addr4,addr5] = others

      // nonce生成
      let dateTime = new Date;
      let nonceBytes = ethers.utils.toUtf8Bytes(addr2.address + addr2.getTransactionCount + dateTime.toString())
      const nonce_2 = ethers.utils.keccak256(nonceBytes)
      nonceBytes = ethers.utils.toUtf8Bytes(addr4.address + addr4.getTransactionCount + dateTime.toString())
      const nonce_4 = ethers.utils.keccak256(nonceBytes)

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address,nonce_2)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_1 = await myContract.getMessageHash(addr4.address,addr1.address,nonce_4)
      const sig_1  = await addr4.signMessage(ethers.utils.arrayify(hash_1))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,nonce_2,sig)).not.to.be.reverted
      await expect(myContract.connect(addr4).approveChild(addr1.address,nonce_4,sig_1)).not.to.be.reverted

      // approve check
      expect(await myContract.connect(addr1).getApproveList()).to.deep.equals([addr2.address,addr4.address])
      expect(await myContract.connect(addr2).getApproveList()).to.deep.equals([])

      // delete
      expect(await myContract.connect(addr1).deleteApprove(addr1.address,addr2.address)).not.to.be.reverted
      expect(await myContract.connect(addr1).getApproveList()).to.deep.equals([0,addr4.address])

    })

    it("approveChild error", async () => {
      const { myContract, owner, account, others } = await loadFixture(fixture)
      const [addr1, addr2, addr3] = others

      // nonce生成
      let dateTime = new Date;
      let nonceBytes = ethers.utils.toUtf8Bytes(addr2.address + addr2.getTransactionCount + dateTime.toString())
      const nonce_2 = ethers.utils.keccak256(nonceBytes)

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address,nonce_2)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_error = await myContract.getMessageHash(addr3.address,addr1.address,nonce_2)
      const sig_error  = await addr2.signMessage(ethers.utils.arrayify(hash_error))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,nonce_2,sig_error))
        .to.be.revertedWith("coupon is no valid");
      await expect(myContract.connect(addr2).approveChild(addr1.address,nonce_2,sig)).not.to.be.reverted

      // delete
      await expect(myContract.connect(addr3).deleteApprove(addr1.address,addr2.address))
        .to.be.revertedWith("no parent");

      // // fix exe
      await expect(myContract.connect(addr1).fixChild(addr3.address)).to.be.revertedWith("no aprove")

    })


});