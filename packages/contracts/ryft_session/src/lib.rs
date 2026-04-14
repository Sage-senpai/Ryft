//! ryft_session
//!
//! InterwovenKit's AutoSign uses Cosmos authz + feegrant for the actual session
//! key mechanism — this contract does NOT re-implement that. It stores session
//! metadata (which players have an active grant, which match they're in) so the
//! battle contract can assert scope at execute time.

use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw_storage_plus::Map;
use thiserror::Error;

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    RegisterGrant { player: String, expires_at: u64 },
    RevokeGrant { player: String },
}

#[cw_serde]
pub enum QueryMsg {
    Grant { player: String },
}

#[cw_serde]
pub struct GrantRecord {
    pub player: String,
    pub expires_at: u64,
}

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] cosmwasm_std::StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("no grant")]
    NoGrant,
}

const GRANTS: Map<String, GrantRecord> = Map::new("grants");

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::RegisterGrant { player, expires_at } => {
            if info.sender.as_str() != player {
                return Err(ContractError::Unauthorized);
            }
            GRANTS.save(deps.storage, player.clone(), &GrantRecord { player, expires_at })?;
            Ok(Response::new().add_attribute("action", "register_grant"))
        }
        ExecuteMsg::RevokeGrant { player } => {
            if info.sender.as_str() != player {
                return Err(ContractError::Unauthorized);
            }
            GRANTS.remove(deps.storage, player);
            Ok(Response::new().add_attribute("action", "revoke_grant"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Grant { player } => to_json_binary(&GRANTS.load(deps.storage, player)?),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

    #[test]
    fn player_can_register_own_grant() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("alice", &[]), InstantiateMsg {}).unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            ExecuteMsg::RegisterGrant { player: "alice".into(), expires_at: 9999 },
        )
        .unwrap();
    }

    #[test]
    fn cannot_register_grant_for_another_player() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("alice", &[]), InstantiateMsg {}).unwrap();
        let err = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("eve", &[]),
            ExecuteMsg::RegisterGrant { player: "alice".into(), expires_at: 9999 },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized));
    }

    #[test]
    fn session_key_scope_is_enforced_by_sender_check() {
        // ryft_session exists to record grant metadata; the actual authz/feegrant
        // scope enforcement lives at the chain level via InterwovenKit AutoSign
        // (grant for /cosmwasm.wasm.v1.MsgExecuteContract scoped to ryft_battle).
        // This test asserts that our on-contract metadata CANNOT be forged by a
        // third party — only the player themselves can register or revoke their
        // own grant record.
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("alice", &[]), InstantiateMsg {}).unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            ExecuteMsg::RegisterGrant { player: "alice".into(), expires_at: 9999 },
        )
        .unwrap();
        let err = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("eve", &[]),
            ExecuteMsg::RevokeGrant { player: "alice".into() },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized));
    }
}
