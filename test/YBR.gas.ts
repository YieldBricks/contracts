import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { deployYBRFixture } from "./YBR.fixture";

type FixtureReturnType = Awaited<Promise<PromiseLike<ReturnType<typeof deployYBRFixture>>>>;

const DELEGATED = process.env.DELEGATED === "true";

if (process.env.REPORT_GAS) {
  describe("YBR Gas Measurement", function () {
    before(async function () {
      this.loadFixture = loadFixture;
    });

    describe(`ERC20 Transfer ${DELEGATED ? "with" : "without"} snapshots`, function () {
      before(async function () {
        this.fixture = (await this.loadFixture(deployYBRFixture)) as FixtureReturnType;
      });

      it("YBR should have correct owner", async function () {
        const { ybr, multisig } = this.fixture as FixtureReturnType;
        expect(await ybr.owner()).to.equal(multisig.address);
      });

      it("Multisig should have all the tokens initially", async function () {
        const { ybr, multisig } = this.fixture as FixtureReturnType;
        expect(await ybr.balanceOf(multisig.address)).to.equal(1_000_000_000);
      });

      it("Measure transfer gas", async function () {
        const { ybr, multisig, alice, bob } = this.fixture as FixtureReturnType;
        if (DELEGATED) {
          await ybr.connect(multisig).delegate(multisig.address);
        }
        for (let i = 0; i < 100; i++) {
          // Transfer cycle delegated -> non-delegated -> non-delegated -> delegated
          await ybr.connect(multisig).transfer(alice.address, 100_000_000);
          await ybr.connect(alice).transfer(bob.address, 100_000_000);
          await ybr.connect(bob).transfer(multisig.address, 100_000_000);
        }
      });
    });
  });
}
