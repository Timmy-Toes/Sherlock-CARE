const { expect } = require('chai');
const { parseEther, parseUnits } = require('ethers/lib/utils');

const { prepare, deploy, solution, timestamp, Uint16Max, meta } = require('../utilities');
const { constants, BigNumber } = require('ethers');
const { TimeTraveler } = require('../utilities/snapshot');
const { id } = require('ethers/lib/utils');

const maxTokens = parseUnits('100000000000', 6);
const maxTokens2 = parseEther('100000000000', 18);

const weeks1 = 60 * 60 * 24 * 7 * 1;
const weeks2 = 60 * 60 * 24 * 7 * 2;
const weeks12 = 60 * 60 * 24 * 7 * 12;

describe('Sherlock ─ Stateless', function () {
  before(async function () {
    await prepare(this, [
      'StrategyMock',
      'SherlockProtocolManagerMock',
      'SherDistributionMock',
      'ERC20Mock6d',
      'ERC20Mock18d',
      'Sherlock',
    ]);

    this.claimManager = this.carol;
    this.nonStaker = this.bob;

    await deploy(this, [['token', this.ERC20Mock6d, ['USDC Token', 'USDC', maxTokens]]]);
    await deploy(this, [['sher', this.ERC20Mock18d, ['SHER Token', 'SHER', maxTokens]]]);

    await deploy(this, [['strategy', this.StrategyMock, [this.token.address]]]);
    await deploy(this, [['strategy2', this.StrategyMock, [this.token.address]]]);
    await deploy(this, [['protmanager', this.SherlockProtocolManagerMock, [this.token.address]]]);
    await deploy(this, [['protmanager2', this.SherlockProtocolManagerMock, [this.token.address]]]);
    await deploy(this, [
      ['sherdist', this.SherDistributionMock, [this.token.address, this.sher.address]],
    ]);
    await deploy(this, [
      ['sherdist2', this.SherDistributionMock, [this.token.address, this.sher.address]],
    ]);

    await deploy(this, [
      [
        'sherlock',
        this.Sherlock,
        [
          this.token.address,
          this.sher.address,
          'SHER POSITION',
          'SPS',
          this.strategy.address,
          this.sherdist.address,
          this.nonStaker.address,
          this.protmanager.address,
          this.claimManager.address,
          [10, 20],
        ],
      ],
    ]);
  });

});

describe('Sherlock ─ Functional', function () {
  before(async function () {
    timeTraveler = new TimeTraveler(network.provider);

    await prepare(this, [
      'StrategyMock',
      'SherlockProtocolManagerMock',
      'SherDistributionMock',
      'ERC20Mock6d',
      'ERC20Mock18d',
      'Sherlock',
      'SherlockTest',
    ]);

    this.claimManager = this.carol;
    this.nonStaker = this.bob;

    await deploy(this, [['token', this.ERC20Mock6d, ['USDC Token', 'USDC', maxTokens]]]);
    await deploy(this, [['sher', this.ERC20Mock18d, ['SHER Token', 'SHER', maxTokens2]]]);

    await deploy(this, [['strategy', this.StrategyMock, [this.token.address]]]);
    await deploy(this, [['strategy2', this.StrategyMock, [this.token.address]]]);
    await deploy(this, [['protmanager', this.SherlockProtocolManagerMock, [this.token.address]]]);
    await deploy(this, [['protmanager2', this.SherlockProtocolManagerMock, [this.token.address]]]);
    await deploy(this, [
      ['sherdist', this.SherDistributionMock, [this.token.address, this.sher.address]],
    ]);
    await deploy(this, [
      ['sherdist2', this.SherDistributionMock, [this.token.address, this.sher.address]],
    ]);

    await prepare(this, ['SherlockClaimManagerTest']);

    this.umaho = this.carol;
    this.spcc = this.gov;

    await deploy(this, [
      ['scm', this.SherlockClaimManagerTest, [this.umaho.address, this.spcc.address]],
    ]);

    await deploy(this, [
      [
        'sherlock',
        this.SherlockTest,
        [
          this.token.address,
          this.sher.address,
          'SHER POSITION',
          'SPS',
          this.strategy.address,
          this.sherdist.address,
          this.nonStaker.address,
          this.protmanager.address,
          this.scm.address,
          [10, 20],
        ],
      ],
    ]);

    await this.strategy.setSherlockCoreAddress(this.sherlock.address);
    await this.sherdist.setSherlockCoreAddress(this.sherlock.address);
    await this.protmanager.setSherlockCoreAddress(this.sherlock.address);
    await this.scm.setSherlockCoreAddress(this.sherlock.address);

    await timeTraveler.snapshot();
  });

  describe('Pause', function () {
    before(async function () {
      await timeTraveler.revertSnapshot();
    });
    it('Can pause normally without revert', async function () {
      await this.sherlock.pause();
      await this.sherlock.unpause();
    });
    it('Cannot pause at all if one contract reverts', async function () {
      await meta(this.sherlock.updateSherlockClaimManager(this.carol.address));

      await expect(this.sherlock.pause()).to.be.reverted;
    });
  });
});
