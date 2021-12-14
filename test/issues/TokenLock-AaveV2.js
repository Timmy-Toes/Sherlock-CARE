const { expect } = require('chai');
const { parseEther, parseUnits } = require('ethers/lib/utils');

const {
  prepare,
  deploy,
  solution,
  timestamp,
  Uint16Max,
  meta,
  fork,
  unfork,
} = require('../utilities');
const { constants, BigNumber } = require('ethers');
const { TimeTraveler } = require('../utilities/snapshot');
const { id, formatBytes32String, keccak256 } = require('ethers/lib/utils');

const usdcWhaleAddress = '0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0';
const USDC_AMOUNT = parseUnits('1000000', 6);

describe('AaveV2 ─ Functional', function () {
  before(async function () {
    timeTraveler = new TimeTraveler(network.provider);
    await timeTraveler.fork(13671132);

    await prepare(this, ['AaveV2Strategy', 'Sherlock', 'SherlockProtocolManagerMock']);

    await timeTraveler.request({
      method: 'hardhat_impersonateAccount',
      params: [usdcWhaleAddress],
    });

    // MAINNET contracts
    this.lpAddProvider = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
    this.lp = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';
    this.incentives = await ethers.getContractAt(
      'IAaveIncentivesController',
      '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5',
    );
    this.stkAAVE = await ethers.getContractAt(
      'ERC20',
      '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
    );
    this.usdc = await ethers.getContractAt('ERC20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
    this.aUSDC = await ethers.getContractAt('ERC20', '0xBcca60bB61934080951369a648Fb03DF4F96263C');

    this.mintUSDC = async (target, amount) => {
      const usdcWhale = await ethers.provider.getSigner(usdcWhaleAddress);
      await this.usdc.connect(usdcWhale).transfer(target, amount);
    };

    await deploy(this, [
      ['aaveStrategy', this.AaveV2Strategy, [this.aUSDC.address, this.bob.address]],
    ]);

    await deploy(this, [['protmanager', this.SherlockProtocolManagerMock, [this.usdc.address]]]);

    await deploy(this, [
      [
        'sherlock',
        this.Sherlock,
        [
          this.usdc.address,
          this.usdc.address,
          'test',
          'tst',
          this.aaveStrategy.address,
          constants.AddressZero,
          this.alice.address,
          this.protmanager.address,
          this.alice.address,
          [1000],
        ],
      ],
    ]);

    this.aUsdcYield = BigNumber.from(50);
    this.aUsdcYieldError = BigNumber.from(1000);
    this.aUsdcLM = parseUnits('78', 'gwei');
    this.aUsdcLMError = parseUnits('5', 'gwei');
    await this.mintUSDC(this.sherlock.address, USDC_AMOUNT);
    await timeTraveler.snapshot();
  });

  describe('With correct sherlock core set in strategy contract', function () {
    before(async function () {
      await timeTraveler.revertSnapshot();
      await this.aaveStrategy.setSherlockCoreAddress(this.sherlock.address);
    });
    it('Can deposit', async function () {
      expect(await this.usdc.balanceOf(this.sherlock.address)).to.eq(USDC_AMOUNT);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);

      this.t0 = await meta(this.sherlock.yieldStrategyDeposit(USDC_AMOUNT));
      expect(await this.usdc.balanceOf(this.sherlock.address)).to.eq(0);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);

    });
    it('Can withdraw', async function () {
      await this.sherlock.yieldStrategyWithdrawAll();

      expect(await this.usdc.balanceOf(this.sherlock.address)).to.be.closeTo(USDC_AMOUNT,
        this.aUsdcYieldError);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);
    });
  });


  describe('With wrong sherlock core set in strategy contract', function () {
    before(async function () {
      await timeTraveler.revertSnapshot();
      await this.aaveStrategy.setSherlockCoreAddress(this.carol.address);
    });
    it('Can still deposit', async function () {
      expect(await this.usdc.balanceOf(this.sherlock.address)).to.eq(USDC_AMOUNT);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);

      this.t0 = await meta(this.sherlock.yieldStrategyDeposit(USDC_AMOUNT));
      expect(await this.usdc.balanceOf(this.sherlock.address)).to.eq(0);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);

    });
    it('But cannot withdraw', async function () {
      await expect(this.sherlock.yieldStrategyWithdrawAll()).to.be.revertedWith('InvalidSender()');

      expect(await this.usdc.balanceOf(this.sherlock.address)).to.eq(0);
      expect(await this.usdc.balanceOf(this.aaveStrategy.address)).to.eq(0);
    });
    it('(Also cannot sweep)', async function () {
      await expect(this.aaveStrategy.isActive()).to.be.reverted;
      await expect(this.aaveStrategy.sweep(this.bob.address, [this.usdc.address])).to.be.reverted;
    });
  });
});
