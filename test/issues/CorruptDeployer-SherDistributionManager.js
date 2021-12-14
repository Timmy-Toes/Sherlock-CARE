const { expect } = require('chai');
const { parseEther, parseUnits } = require('ethers/lib/utils');

const { prepare, deploy, solution, blockNumber, Uint16Max, Uint32Max } = require('../utilities');
const { constants } = require('ethers');
const { TimeTraveler } = require('../utilities/snapshot');

const maxTokens = parseUnits('100000000000', 6);
const billie = parseUnits('1000000000', 6);
describe('SherDistributionManager, 6 dec', function () {
  timeTraveler = new TimeTraveler(network.provider);

  before(async function () {
    this.amount = parseUnits('100', 6);

    await prepare(this, ['SherDistributionManager', 'ERC20Mock6d', 'SherlockMock']);

    await deploy(this, [['erc20', this.ERC20Mock6d, ['USDC Token', 'USDC', maxTokens]]]);
    await deploy(this, [
      ['sher', this.ERC20Mock6d, ['USDC Token', 'USDC', parseEther('100000000')]],
    ]);
    await deploy(this, [
      [
        'sdm',
        this.SherDistributionManager,
        [parseUnits('100', 6), parseUnits('600', 6), parseUnits('5', 6), this.sher.address],
      ],
    ]);
    await deploy(this, [
      [
        'sdmMAX',
        this.SherDistributionManager,
        [billie.mul(100), billie.mul(10000), parseUnits('500', 6), this.sher.address],
      ],
    ]);
    await deploy(this, [['sherlock', this.SherlockMock, []]]);
    await deploy(this, [['attackSherlock', this.SherlockMock, []]]);

    await timeTraveler.snapshot();
  });


  describe('pullReward()', function () {
    before(async function () {
      await timeTraveler.revertSnapshot();
      //For convenience, attackSherlock is actually depositing the mock USDC tokens here,
      //But it could be rweritten not to require this.
      await this.attackSherlock.setToken(this.erc20.address);
    });
    it('Set up', async function () {
      await this.attackSherlock.updateSherDistributionManager(this.sdm.address);
      // deposit into sherlock
      await this.erc20.transfer(this.attackSherlock.address, this.amount);
      // deposit into sher distribution manager
      await this.sher.transfer(this.sdm.address, parseEther('500'));
    });
    it('Corrupt Sherlock Core is installed and can extract SHER tokens', async function () {
      await this.sdm.setSherlockCoreAddress(this.attackSherlock.address);

      expect(await this.sher.balanceOf(this.attackSherlock.address)).to.eq(0);
      await this.attackSherlock.pullSherReward(this.amount, 1, 1, this.bob.address);
      expect(await this.sher.balanceOf(this.attackSherlock.address)).to.eq(parseEther('500'));
    });
    it('Alice is owner, but Alice cannot sweep', async function () {
      expect(await this.sdm.owner()).to.eq(this.alice.address);

      expect(await this.sdm.isActive()).to.eq(true);
      await expect(this.sdm.connect(this.alice.address).sweep(this.bob.address, [this.erc20.address])).to.be.reverted;
    });
  });
});
