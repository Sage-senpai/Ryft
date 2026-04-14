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
