use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw_storage_plus::{Item, Map};
use thiserror::Error;

#[cw_serde]
pub struct InstantiateMsg {
    pub card_registry: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    OpenMatch { opponent: String },
    CommitPlay { match_id: u64, commitment: String },
    RevealPlay { match_id: u64, card_id: String, target_index: u32, salt: String },
    ResolveMatch { match_id: u64 },
}

#[cw_serde]
pub enum QueryMsg {
    Match { match_id: u64 },
    NextMatchId {},
}

#[cw_serde]
pub struct MatchRecord {
    pub match_id: u64,
    pub host: String,
    pub guest: String,
    pub turn: u32,
    pub host_hp: u32,
    pub guest_hp: u32,
    pub status: String,
    pub host_commit: Option<String>,
    pub guest_commit: Option<String>,
}

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] cosmwasm_std::StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("match not found")]
    MatchNotFound,
    #[error("not a match participant")]
    NotParticipant,
}

const CARD_REGISTRY: Item<String> = Item::new("card_registry");
const NEXT_MATCH_ID: Item<u64> = Item::new("next_match_id");
const MATCHES: Map<u64, MatchRecord> = Map::new("matches");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    CARD_REGISTRY.save(deps.storage, &msg.card_registry)?;
    NEXT_MATCH_ID.save(deps.storage, &1u64)?;
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
        ExecuteMsg::OpenMatch { opponent } => {
            let match_id = NEXT_MATCH_ID.load(deps.storage)?;
            NEXT_MATCH_ID.save(deps.storage, &(match_id + 1))?;
            let record = MatchRecord {
                match_id,
                host: info.sender.to_string(),
                guest: opponent,
                turn: 0,
                host_hp: 30,
                guest_hp: 30,
                status: "active".to_string(),
                host_commit: None,
                guest_commit: None,
            };
            MATCHES.save(deps.storage, match_id, &record)?;
            Ok(Response::new()
                .add_attribute("action", "open_match")
                .add_attribute("match_id", match_id.to_string()))
        }
        ExecuteMsg::CommitPlay { match_id, commitment } => {
            let mut record = MATCHES.load(deps.storage, match_id).map_err(|_| ContractError::MatchNotFound)?;
            let sender = info.sender.to_string();
            if sender == record.host {
                record.host_commit = Some(commitment);
            } else if sender == record.guest {
                record.guest_commit = Some(commitment);
            } else {
                return Err(ContractError::NotParticipant);
            }
            MATCHES.save(deps.storage, match_id, &record)?;
            Ok(Response::new().add_attribute("action", "commit_play"))
        }
        ExecuteMsg::RevealPlay { match_id, card_id, .. } => {
            let mut record = MATCHES.load(deps.storage, match_id).map_err(|_| ContractError::MatchNotFound)?;
            let sender = info.sender.to_string();
            if sender != record.host && sender != record.guest {
                return Err(ContractError::NotParticipant);
            }
            record.turn += 1;
            MATCHES.save(deps.storage, match_id, &record)?;
            Ok(Response::new()
                .add_attribute("action", "reveal_play")
                .add_attribute("card_id", card_id))
        }
        ExecuteMsg::ResolveMatch { match_id } => {
            let mut record = MATCHES.load(deps.storage, match_id).map_err(|_| ContractError::MatchNotFound)?;
            record.status = "resolved".to_string();
            MATCHES.save(deps.storage, match_id, &record)?;
            Ok(Response::new().add_attribute("action", "resolve_match"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Match { match_id } => to_json_binary(&MATCHES.load(deps.storage, match_id)?),
        QueryMsg::NextMatchId {} => to_json_binary(&NEXT_MATCH_ID.load(deps.storage)?),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

    #[test]
    fn open_match_increments_id() {
        let mut deps = mock_dependencies();
        instantiate(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            InstantiateMsg { card_registry: "registry".into() },
        )
        .unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            ExecuteMsg::OpenMatch { opponent: "bob".into() },
        )
        .unwrap();
        let next: u64 = cosmwasm_std::from_json(
            query(deps.as_ref(), mock_env(), QueryMsg::NextMatchId {}).unwrap(),
        )
        .unwrap();
        assert_eq!(next, 2);
    }

    #[test]
    fn non_participant_cannot_commit() {
        let mut deps = mock_dependencies();
        instantiate(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            InstantiateMsg { card_registry: "registry".into() },
        )
        .unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            ExecuteMsg::OpenMatch { opponent: "bob".into() },
        )
        .unwrap();
        let err = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("eve", &[]),
            ExecuteMsg::CommitPlay { match_id: 1, commitment: "deadbeef".into() },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::NotParticipant));
    }
}
