export type Rarity = "common" | "rare" | "legendary";

export interface Card {
  card_id: string;
  name: string;
  rarity: Rarity;
  attack: number;
  defense: number;
  hp_cost: number;
  ability: string | null;
}

export interface CardInstance {
  card_id: string;
  instance_id: string;
  owner: string;
}
