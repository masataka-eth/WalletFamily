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

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const ethHash = await myContract.getEthSignedMessageHash(hash)
      console.log("signer          ", addr2.address)
      console.log("recovered signer", await myContract.recoverSigner(ethHash, sig))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,sig)).not.to.be.reverted

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

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_1 = await myContract.getMessageHash(addr4.address,addr1.address)
      const sig_1  = await addr4.signMessage(ethers.utils.arrayify(hash_1))
      const hash_2 = await myContract.getMessageHash(addr5.address,addr1.address)
      const sig_2  = await addr5.signMessage(ethers.utils.arrayify(hash_2))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,sig)).not.to.be.reverted
      await expect(myContract.connect(addr4).approveChild(addr1.address,sig_1)).not.to.be.reverted
      await expect(myContract.connect(addr5).approveChild(addr1.address,sig_2)).not.to.be.reverted

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

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_1 = await myContract.getMessageHash(addr4.address,addr1.address)
      const sig_1  = await addr4.signMessage(ethers.utils.arrayify(hash_1))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,sig)).not.to.be.reverted
      await expect(myContract.connect(addr4).approveChild(addr1.address,sig_1)).not.to.be.reverted

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

      // signer
      const hash = await myContract.getMessageHash(addr2.address,addr1.address)
      const sig  = await addr2.signMessage(ethers.utils.arrayify(hash))
      const hash_error = await myContract.getMessageHash(addr3.address,addr1.address)
      const sig_error  = await addr2.signMessage(ethers.utils.arrayify(hash_error))

      // approve exe
      await expect(myContract.connect(addr2).approveChild(addr1.address,sig_error))
        .to.be.revertedWith("coupon is no valid");
      await expect(myContract.connect(addr2).approveChild(addr1.address,sig)).not.to.be.reverted

      // delete
      await expect(myContract.connect(addr3).deleteApprove(addr1.address,addr2.address))
        .to.be.revertedWith("no parent");

      // // fix exe
      await expect(myContract.connect(addr1).fixChild(addr3.address)).to.be.revertedWith("no aprove")

    })


});