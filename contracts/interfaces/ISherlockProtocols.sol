// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.9;

/******************************************************************************\
* Author: Evert Kors <dev@sherlock.xyz> (https://twitter.com/evert0x)
* Sherlock Protocol: https://sherlock.xyz
/******************************************************************************/

/// @title Sherlock core interface for protocols
/// @author Evert Kors
interface ISherlockProtocols {
  // We do some internal accounting with (lastBlockAccounted - block.now) * premium
  // we have mapping(protocol => uint256) for lastSettled but also a global one
  // TODO add totalPremiumPerBlock view function which will just read a variable

  event ProtocolAdded(bytes32 protocol);

  event ProtocolUpdated(bytes32 protocol, bytes32 coverage, uint256 nonStakers);

  event ProtocolAgentTransfer(bytes32 protocol, address from, address to);

  /// @notice View current protocolAgent of `_protocol`
  /// @param _protocol Protocol identifier
  /// @return Address able to submit claims
  function protocolAgent(bytes32 _protocol) external view returns (address);

  /// @notice View current premium of protocol
  /// @param _protocol Protocol identifier
  /// @return Amount of premium `_protocol` pays per second
  function premiums(bytes32 _protocol) external view returns (uint256);

  /// @notice View current active balance of protocol
  /// @param _protocol Protocol identifier
  /// @return Active balance
  /// @dev Accrued debt is subtracted from the stored balance
  function balances(bytes32 _protocol) external view returns (uint256);

  // @todo seconds of coverage remaining?

  /// @notice Add a new protocol to Sherlock
  /// @param _protocol Protocol identifier
  /// @param _protocolAgent Account able to submit a claim on behalve of the protocol
  /// @param _coverage Hash referencing the active coverage agreement
  /// @param _nonStakers Percentage of premium payments that is not redirected to stakers
  /// @dev Adding a protocol allows the `_protocolAgent` to submit a claim.
  /// @dev Coverage is not started yet as the protocol doesn't pay a premium at this point
  /// @dev `_nonStakers` is scaled by 10**18
  /// @dev Only callable by governance
  function protocolAdd(
    bytes32 _protocol,
    address _protocolAgent,
    bytes32 _coverage,
    uint256 _nonStakers
  ) external;

  /// @notice Update info regarding a protocol
  /// @param _protocol Protocol identifier
  /// @param _coverage Hash referencing the active coverage agreement
  /// @param _nonStakers Percentage of premium payments that is not redirected to stakers, scaled by 10**18
  /// @dev Only callable by governance
  function protocolUpdate(
    bytes32 _protocol,
    bytes32 _coverage,
    uint256 _nonStakers
  ) external;

  /// @notice Remove a protocol
  /// @param _protocol Protocol identifier
  /// @dev Before removing a protocol the premium should be 0
  /// @dev Removing a protocol basically stops the `_protocolAgent` from being active
  /// @dev This call should be subject to a timelock
  /// @dev Only callable by governance
  function protocolRemove(bytes32 _protocol) external;

  // @TODO
  // remove protocol force? Allow anyone to remove a protocol if their balance is insufficient.

  /// @notice Set premium of `_protocol` to `_premium`
  /// @param _protocol Protocol identifier
  /// @param _premium Amount of premium `_protocol` pays per second
  /// @dev The value 0 would mean inactive coverage
  /// @dev Only callable by governance
  function setProtocolPremium(bytes32 _protocol, uint256 _premium) external;

  /// @notice Set premium of multiple protocols
  /// @param _protocol Protocol identifier
  /// @param _premium Amount of premium `_protocol` pays per second
  /// @dev The value 0 would mean inactive coverage
  /// @dev Only callable by governance
  function setProtocolPremium(bytes32[] calldata _protocol, uint256[] calldata _premium) external;

  /// @notice Deposit `_amount` token for pay premium for `_protocol`
  /// @param _protocol Protocol identifier
  /// @param _amount Amount of tokens to deposit
  /// @dev Approval should be made before calling
  function depositProtocolBalance(bytes32 _protocol, uint256 _amount) external;

  /// @notice Withdraw `_amount` token that would pay premium for `_protocol`
  /// @param _protocol Protocol identifier
  /// @param _amount Amount of tokens to withdraw
  /// @dev Only claim starter role is able to withdraw balance
  /// @dev Balance can be withdraw up until 3 days of coverage outstanding
  /// @dev In case coverage is not active (0 premium), full balance can be withdrawn
  function withdrawProtocolBalance(bytes32 _protocol, uint256 _amount) external;

  /// @notice Transfer claimStarer role
  /// @param _protocol Protocol identifier
  /// @param _protocolAgent Account able to submit a claim on behalve of the protocol
  /// @dev Only the active protocolAgent is able to transfer the role
  function transferProtocolAgent(bytes32 _protocol, address _protocolAgent) external;
}
