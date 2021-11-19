// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.9;

/******************************************************************************\
* Author: Evert Kors <dev@sherlock.xyz> (https://twitter.com/evert0x)
* Sherlock Protocol: https://sherlock.xyz
/******************************************************************************/

import '../managers/SherlockProtocolManager.sol';

/// @notice this contract is used for testing to view all storage variables
contract SherlockProtocolManagerTest is SherlockProtocolManager {
  constructor(IERC20 _token) SherlockProtocolManager(_token) {}

  function privateSettleTotalDebt() external {
    _settleTotalDebt();
  }

  function privateSetMinBalance(uint256 _min) external {
    minBalance = _min;
  }

  function privateSetMinSecondsOfCoverage(uint256 _min) external {
    minSecondsOfCoverage = _min;
  }

  function viewMinSecondsOfCoverage() external view returns (uint256) {
    return minSecondsOfCoverage;
  }

  function viewMinBalance() external view returns (uint256) {
    return minBalance;
  }

  function viewProtocolAgent(bytes32 _protocol) external view returns (address) {
    return protocolAgent_[_protocol];
  }

  function viewRemovedProtocolAgent(bytes32 _protocol) external view returns (address) {
    return removedProtocolAgent[_protocol];
  }

  function viewRemovedProtocolValidUntil(bytes32 _protocol) external view returns (uint256) {
    return removedProtocolValidUntil[_protocol];
  }

  function viewnonStakersPercentage(bytes32 _protocol) external view returns (uint256) {
    return nonStakersPercentage[_protocol];
  }

  function viewCurrentCoverage(bytes32 _protocol) external view returns (uint256) {
    return currentCoverage[_protocol];
  }

  function viewPreviousCoverage(bytes32 _protocol) external view returns (uint256) {
    return previousCoverage[_protocol];
  }

  function viewlastAccountedEachProtocol(bytes32 _protocol) external view returns (uint256) {
    return lastAccountedEachProtocol[_protocol];
  }

  function viewnonStakersClaimableByProtocol(bytes32 _protocol) external view returns (uint256) {
    return nonStakersClaimableByProtocol[_protocol];
  }

  function viewlastAccountedGlobal() external view returns (uint256) {
    return lastAccountedGlobal;
  }

  function viewallPremiumsPerSecToStakers() external view returns (uint256) {
    return allPremiumsPerSecToStakers;
  }

  function viewlastClaimablePremiumsForStakers() external view returns (uint256) {
    return lastClaimablePremiumsForStakers;
  }

  function viewactiveBalances(bytes32 _protocol) external view returns (uint256) {
    return activeBalances[_protocol];
  }
}
