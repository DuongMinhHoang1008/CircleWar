import { z } from "zod";
import { CLASSES } from "./balance";
import { CHARACTER_IDS, CATALOG_ITEMS } from "./catalog";
import { xpForNextLevel } from "./progression";
import { DEFAULT_SHRINK_SECONDS } from "./arena";
export const PROTOCOL = 4;
export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    maxPlayers: z.number().int().min(2).max(20),
    teamSize: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    preparationSeconds: z.number().int().min(10).max(120),
    shrinkSeconds: z.number().int().min(10).max(60),
    spectators: z.boolean(),
    comeback: z.boolean(),
  })
  .strict();
export const DEFAULT_SETTINGS: z.infer<typeof settingsSchema> = {
  name: "Đấu trường Chaos",
  maxPlayers: 20,
  // Kept on the wire for compatibility with saved rooms and older clients.
  // Each new player starts with one unit; field capacity is upgraded in-game.
  teamSize: 1,
  preparationSeconds: 30,
  shrinkSeconds: DEFAULT_SHRINK_SECONDS,
  spectators: true,
  comeback: true,
};
const target = z.number().int().min(0).max(2);
export const actionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("JOIN"),
      name: z.string().trim().min(1).max(24),
      spectator: z.boolean().optional(),
    })
    .strict(),
  z.object({ type: z.literal("LEAVE") }).strict(),
  z
    .object({ type: z.literal("SET_CONFIG"), settings: settingsSchema })
    .strict(),
  z
    .object({
      type: z.literal("SELECT"),
      classes: z.array(z.enum(CLASSES)).min(1).max(3),
    })
    .strict(),
  z
    .object({
      type: z.literal("SELECT_CHARACTERS"),
      characters: z.array(z.enum(CHARACTER_IDS)).min(1).max(3),
    })
    .strict(),
  z
    .object({
      type: z.literal("TEAM_CHOICE"),
      trait: z.string().max(40).optional(),
      bond: z.string().max(4).optional(),
      group: z.string().max(4).optional(),
      representatives: z.array(target).max(3).optional(),
    })
    .strict(),
  z.object({ type: z.literal("WEAPON_UPGRADE"), target }).strict(),
  z
    .object({
      type: z.literal("UNEQUIP"),
      target,
      equipment: z.number().int().min(0).max(3),
    })
    .strict(),
  z.object({ type: z.literal("READY"), ready: z.boolean() }).strict(),
  z.object({ type: z.literal("START") }).strict(),
  z.object({ type: z.literal("REMATCH") }).strict(),
  z.object({ type: z.literal("SET_MODE"), mode: z.enum(["pvp", "campaign"]) }).strict(),
  z.object({ type: z.literal("SET_TEAM"), characters: z.array(z.enum(CHARACTER_IDS)).min(1).max(3) }).strict(),
  z.object({
    type: z.literal("SYNC_PROFILE"),
    cards: z.array(z.object({ characterId: z.enum(CHARACTER_IDS), level: z.number().int().min(1).max(10), xp: z.number().int().min(0).max(xpForNextLevel(9) - 1) }).strict()).max(CHARACTER_IDS.length),
    itemCards: z.array(z.object({ itemId: z.string().regex(/^item_[0-9]+$/), level: z.number().int().min(1).max(10), xp: z.number().int().min(0).max(xpForNextLevel(9) - 1) }).strict()).max(CATALOG_ITEMS.length),
    team: z.array(z.enum(CHARACTER_IDS)).min(1).max(3),
    equipment: z.array(z.object({ characterId: z.enum(CHARACTER_IDS), items: z.array(z.string().regex(/^item_[0-9]+$/)).max(3) }).strict()).max(3),
    campaignStage: z.number().int().min(0),
  }).strict(),
  z.object({ type: z.literal("CLAIM_PACK") }).strict(),
  z.object({ type: z.literal("OPEN_PACK"), kind: z.enum(["normal", "boss"]).optional() }).strict(),
  z.object({ type: z.literal("CLAIM_MISSION"), mission: z.enum(["draw", "win", "campaign"]) }).strict(),
  z
    .object({ type: z.literal("BUY"), offer: z.number().int().min(0).max(4) })
    .strict(),
  z
    .object({
      type: z.literal("MOVE_UNIT"),
      source: z.enum(["field", "bench"]),
      sourceIndex: z.number().int().min(0).max(4),
      destination: z.enum(["field", "bench"]),
      destinationIndex: z.number().int().min(0).max(4),
    })
    .strict(),
  z.object({ type: z.literal("UPGRADE_CAPACITY") }).strict(),
  z
    .object({
      type: z.literal("EQUIP"),
      inventory: z.number().int().min(0).max(99),
      target,
      replace: z.number().int().min(0).max(3).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("REWARD"),
      choice: z.number().int().min(0).max(3),
      target,
      replace: z.number().int().min(0).max(3).optional(),
    })
    .strict(),
  z.object({ type: z.literal("UPGRADE"), target }).strict(),
  z.object({ type: z.literal("REROLL") }).strict(),
  z
    .object({
      type: z.literal("RELIEF"),
      target,
      replace: z.number().int().min(0).max(3).optional(),
    })
    .strict(),
]);
export const envelopeSchema = z
  .object({
    protocol: z.literal(4),
    round: z.number().int().min(0),
    requestId: z.string().uuid(),
    action: actionSchema,
  })
  .strict();
export type Action = z.infer<typeof actionSchema>;
export type Settings = z.infer<typeof settingsSchema>;
