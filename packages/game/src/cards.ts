import type { Card } from "@ryft/types";

export const RYFT_CARDS: Card[] = [
  { card_id: "ryft_001", name: "Ashveil Soldier", rarity: "common", attack: 4, defense: 3, hp_cost: 2, ability: null },
  { card_id: "ryft_002", name: "Tidecaller", rarity: "common", attack: 3, defense: 5, hp_cost: 2, ability: null },
  { card_id: "ryft_003", name: "Stoneborn Pilgrim", rarity: "common", attack: 2, defense: 6, hp_cost: 2, ability: null },
  { card_id: "ryft_004", name: "Thornwalker", rarity: "common", attack: 5, defense: 2, hp_cost: 2, ability: null },
  { card_id: "ryft_005", name: "Duskmoth Scout", rarity: "common", attack: 3, defense: 3, hp_cost: 1, ability: null },
  { card_id: "ryft_006", name: "Hollow Priest", rarity: "common", attack: 2, defense: 4, hp_cost: 1, ability: null },
  { card_id: "ryft_007", name: "Emberstrike Warden", rarity: "rare", attack: 7, defense: 4, hp_cost: 3, ability: "On play, deal 2 burn that ignores defense." },
  { card_id: "ryft_008", name: "Frostbound Huntress", rarity: "rare", attack: 6, defense: 5, hp_cost: 3, ability: "Chill: enemy's next attack does half damage." },
  { card_id: "ryft_009", name: "Stormtongue Oracle", rarity: "rare", attack: 5, defense: 6, hp_cost: 3, ability: "Reveals the top card of the opponent each turn." },
  { card_id: "ryft_010", name: "Hollow Crown", rarity: "rare", attack: 8, defense: 3, hp_cost: 4, ability: "When this falls, draw one card from the wilds." },
  { card_id: "ryft_011", name: "The Unbroken", rarity: "legendary", attack: 10, defense: 8, hp_cost: 5, ability: "Immune to commons. Heals 3 each turn." },
  { card_id: "ryft_012", name: "Voidmother", rarity: "legendary", attack: 9, defense: 7, hp_cost: 5, ability: "Reveal and silence a hidden card from the opponent." },
];

export const CARD_BY_ID = new Map(RYFT_CARDS.map((c) => [c.card_id, c] as const));

export function dealHand(size = 5): Card[] {
  const pool = [...RYFT_CARDS];
  const hand: Card[] = [];
  for (let i = 0; i < size && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    hand.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return hand;
}

export const RARITY_COLOR: Record<Card["rarity"], number> = {
  common: 0x7a7f8c,
  rare: 0x4aa3ff,
  legendary: 0xffb84a,
};

export const RARITY_GLOW: Record<Card["rarity"], string> = {
  common: "#7a7f8c",
  rare: "#4aa3ff",
  legendary: "#ffb84a",
};
