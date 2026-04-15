use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw_storage_plus::{Item, Map};
use thiserror::Error;

#[cw_serde]
pub struct Card {
    pub card_id: String,
    pub name: String,
    pub rarity: String,
    pub attack: u32,
    pub defense: u32,
    pub hp_cost: u32,
    pub ability: Option<String>,
}

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    Mint { to: String, card: Card, instance_id: String },
    Transfer { instance_id: String, to: String },
}

#[cw_serde]
pub enum QueryMsg {
    Owner { instance_id: String },
    Card { instance_id: String },
}

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] cosmwasm_std::StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("instance not found")]
    InstanceNotFound,
}

const ADMIN: Item<String> = Item::new("admin");
const OWNERS: Map<String, String> = Map::new("owners");
const CARDS: Map<String, Card> = Map::new("cards");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    ADMIN.save(deps.storage, &msg.admin)?;
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
        ExecuteMsg::Mint { to, card, instance_id } => {
            let admin = ADMIN.load(deps.storage)?;
            if info.sender.as_str() != admin {
                return Err(ContractError::Unauthorized);
            }
            CARDS.save(deps.storage, instance_id.clone(), &card)?;
            OWNERS.save(deps.storage, instance_id, &to)?;
            Ok(Response::new().add_attribute("action", "mint"))
        }
        ExecuteMsg::Transfer { instance_id, to } => {
            let owner = OWNERS
                .load(deps.storage, instance_id.clone())
                .map_err(|_| ContractError::InstanceNotFound)?;
            if info.sender.as_str() != owner {
                return Err(ContractError::Unauthorized);
            }
            OWNERS.save(deps.storage, instance_id, &to)?;
            Ok(Response::new().add_attribute("action", "transfer"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Owner { instance_id } => to_json_binary(&OWNERS.load(deps.storage, instance_id)?),
        QueryMsg::Card { instance_id } => to_json_binary(&CARDS.load(deps.storage, instance_id)?),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};

    fn sample_card() -> Card {
        Card {
            card_id: "ryft_001".into(),
            name: "Ashveil Soldier".into(),
            rarity: "common".into(),
            attack: 4,
            defense: 3,
            hp_cost: 2,
            ability: None,
        }
    }

    #[test]
    fn admin_can_mint() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("admin", &[]), InstantiateMsg { admin: "admin".into() }).unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("admin", &[]),
            ExecuteMsg::Mint { to: "alice".into(), card: sample_card(), instance_id: "inst-1".into() },
        )
        .unwrap();
        let owner: String = cosmwasm_std::from_json(
            query(deps.as_ref(), mock_env(), QueryMsg::Owner { instance_id: "inst-1".into() }).unwrap(),
        )
        .unwrap();
        assert_eq!(owner, "alice");
    }

    #[test]
    fn non_admin_cannot_mint() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("admin", &[]), InstantiateMsg { admin: "admin".into() }).unwrap();
        let err = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("eve", &[]),
            ExecuteMsg::Mint { to: "eve".into(), card: sample_card(), instance_id: "inst-2".into() },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized));
    }

    #[test]
    fn owner_can_transfer() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("admin", &[]), InstantiateMsg { admin: "admin".into() }).unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("admin", &[]),
            ExecuteMsg::Mint { to: "alice".into(), card: sample_card(), instance_id: "inst-3".into() },
        )
        .unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("alice", &[]),
            ExecuteMsg::Transfer { instance_id: "inst-3".into(), to: "bob".into() },
        )
        .unwrap();
        let owner: String = cosmwasm_std::from_json(
            query(deps.as_ref(), mock_env(), QueryMsg::Owner { instance_id: "inst-3".into() }).unwrap(),
        )
        .unwrap();
        assert_eq!(owner, "bob");
    }

    #[test]
    fn non_owner_cannot_transfer() {
        let mut deps = mock_dependencies();
        instantiate(deps.as_mut(), mock_env(), mock_info("admin", &[]), InstantiateMsg { admin: "admin".into() }).unwrap();
        execute(
            deps.as_mut(),
            mock_env(),
            mock_info("admin", &[]),
            ExecuteMsg::Mint { to: "alice".into(), card: sample_card(), instance_id: "inst-4".into() },
        )
        .unwrap();
        let err = execute(
            deps.as_mut(),
            mock_env(),
            mock_info("eve", &[]),
            ExecuteMsg::Transfer { instance_id: "inst-4".into(), to: "eve".into() },
        )
        .unwrap_err();
        assert!(matches!(err, ContractError::Unauthorized));
    }
}
