# Combat balance v24

The executable character and item budgets live in
`packages/shared/src/combat-balance.ts`. Catalog descriptions, Inspector-style
stat popups, `computeStats`, and combat consume that shared data. The original
role-specific legacy skill switch has been removed; it previously described
actions that the active generic skill implementation did not execute.

## Character budgets and rarity

All 33 characters have separate HP, damage, armor, movement, attack interval,
weapon reach, critical chance, energy generation and passive values. Tanks trade
damage for durability; fighters use physical reach; controllers slow through
projectile hits; rangers trade durability for range; supports contribute shields
and healing; the assassin trades survivability for speed and burst.

Numbers in the profile table use a T1 reference budget. Current rarity supplies
4% per tier above T1, plus up to 2% progress within a rarity. Character growth
scales HP and attack, rather than multiplying movement, crit, armor and crit
damage simultaneously. There is no additional lifetime-level/evolution stat
grant. Printed T2 at its first level and evolved T1 at its T2 milestone use the
same multiplier. All level-10 GOD cards use the same multiplier, regardless of
printed rarity. Distinct stat distributions and role actions remain distinct.

## Armor, shields and recovery

Armor is percentage damage reduction, capped at 60%. A raw 100 damage hit against
10% armor becomes 90. A remaining 30 shield absorbs 30, leaving 60 HP damage.
Shields have independent expiry layers and a total cap of 100. Absorbed hits
still generate combat energy. Thorns cannot recursively reflect; burns from
different sources coexist, while the same source refreshes its duration.

Super strength improves actual damage, healing and shields. Recovery scaling is
capped at 150% so late-round damage ramps can resolve defensive mirrors. Offensive
damage continues using the normal Super and round-tempo limits. Ranged damage
still requires projectile contact; melee actions retain physical reach checks.

## Items and upgrades

All 33 items have a combined stat/effect budget at the T1 reference. Their current
rarity and upgrade progress scale both modifiers and triggered effects. Item
levels are stored on each fighter and survive checkpoints. Affinity adds 8% effectiveness plus a bounded identity effect from `affinity.ts`. Each of the 33 matching items has a real proc with an explicit cooldown and finite uses. Descriptions scale to the actual item level; transformation items retain their form/skill bonuses.

The popup shows the owned item's current level, evolved rarity, actual stat
modifiers and triggered effect, plus next-level values. Integer rounding can
leave a small individual stat unchanged at an intermediate level; the effect
multiplier and milestone upgrades remain visible. Utility items are situational:
cleanse, energy, stability and ally protection do not have the same duel value as
permanent damage or HP.

## Synergy stacking

Every eligible class/race, friend group, pair and trio activates automatically.
Different sources add their percentage bonuses and retain independent proc
counters/cooldowns. Reapplying the same source refreshes that source instead of
creating unlimited stacks. Within one group's tier ladder, its highest eligible
tier is used. Distinct characters count once for composition; duplicate copies
do not manufacture additional members. Normal global stat/shield/energy limits
still apply.

## Presentation and economy

The arena assigns up to 20 distinct team colors and displays team number, player
name and color name in a legend. Shields have a blue bar separate from HP.
Pack storage is capped by shared `PACK_CAPACITY = 150` in browser, profile
validation/recharge, room rewards and claims. The initial grant remains 50;
multi-open choices are 1/3/5/10/20/50/100. Existing profiles remain valid.

## Reproducible validation

- `npm test`: deterministic combat, progression, item effects, replay and synergy
  coverage, including simultaneous pair/trio/group activation.
- `npm exec -- tsx tests/performance/balance-audit.ts`: all roster matchups with
  mirrored spawn sides, controlled three-unit teams, and all 33 max-level items across
  six mirrored GOD character fixtures. Writes `reports/balance-audit.json`.
- `npm exec -- tsx tests/integration/balance-browser.ts`: requires local web and
  Worker; checks 100-pack recharge/overflow, evolved item previews and named team
  colors on desktop/mobile using an isolated test profile.

Audit win rates are fixed-seed simulation observations, not live-player win-rate
claims. Supports are evaluated in teams as well as duels. The report includes
unresolved matches so they cannot be hidden in aggregate rates.

Start new battles after upgrading to v24; older engine snapshots/replays retain
the existing version mismatch protection.

The roster audit uses an explicitly recorded rectangular fixture (120000 × 72000,
10-second wall schedule) to compare roles and equipment. The campaign audit uses
the current default square arena (72000 × 72000) and 20-second wall schedule.


## Campaign bosses (21 October 2026)

`packages/shared/src/campaign.ts` is shared by local campaigns and room campaigns.
Every fifth stage replaces the enemy squad with a single boss. Its body radius
is 2800 instead of 1700 (about 65% larger), including collision and rendering.
HP scales with player squad size; attack rises modestly and movement slows 6%.
No modifiers apply outside a campaign config. Boss effects persist in base stats.

Normal enemies use exactly computeStats(loadout), with no threat normalization or stage multiplier. Twelve curated lineups rotate tank/burst, control, ranged, sustain and transformation strategies. From stage 6, each enemy carries one matching item at its displayed level. Levels and item levels cap at 10, so later normal stages rotate strategy without increasing stats beyond player rules. The preview exposes enemies, equipment, strategy and counter advice.

Every fifth stage is a boss, with squad-size HP/attack bonuses. Every tenth stage is a hard boss (+15% boss HP, +8% boss ATK). Only bosses receive these exceptions. Ordinary wins grant 5 normal packs; boss wins keep 15 normal packs and add 1 Boss Pack (3 on hard bosses). Boss packs have separate, non-regenerating storage and never advance/reset normal-pack pity.

| Pack | Common (includes RAC) | Rare | Epic | Legendary |
| --- | ---: | ---: | ---: | ---: |
| Normal | 84% | 14% | 1.7% | 0.3% |
| Boss | 66% | 14% | 17% | 3% |

These are rarity-bucket probabilities, shared by characters and items, independent of the number of cards per bucket. Each eligible card is uniform within its bucket. GOD is evolution-only. Normal-pack pity after 19 common draws uses 85% Rare / 13% Epic / 2% Legendary; after 99 draws below Epic, the 100th draw guarantees the highest available tier. An exhausted bucket falls to the next higher available tier, otherwise the highest remaining. Max-level cards are excluded before debit. Browser and room actions share packs.ts. Both draw balances and rewards are committed before reveal animation and recovered through the profile journal/cloud save.

Tất cả quỳ xuống requires either Sếp Chốt Đơn or Đẳng Cấp Aura, plus a distinct eligible ally. Either anchor's Super buffs other living members in range, using one shared cooldown/use budget. G14 now executes its documented speed tier; G15 links Phonk/Robot, G16 links the three new legends, and G17 links the cooking supports.

The balance audit includes all 33 bare cards at level 10 on mirrored sides, 16 controlled three-unit opponent samples per card on both sides, every item against bare mirror fixtures, and all 33 characters with their own item at levels 1 and 10. Counter lists are recorded per card; unfinished battles remain visible. Campaign audit evaluates early and capped strategies at equal displayed levels, on the default square map, including distant stages 999 and 10001. Offline results are calibration samples, not live-player win rates.


## Individual identities (v24)

All 33 roster passives are defined in `character-abilities.ts`, consumed by the catalog and real combat hooks. They replace the shared every-four-hit class proc. Triggers include surviving damage, qualifying hits, consecutive targets, casts, kills, ally emergencies, walls, contact, start and timed pulses. Conditions, finite-use limits and cooldowns are persisted in fighter memory and checked after restoring checkpoints. See `CHARACTER_IDENTITIES.md` for the complete card list.

The five specialized legendary kits use the same shared role budgets. Aura supports nearby allies; duplicate aura fields use the strongest modifier. King temporarily extends the physical weapon, including targeting, collision and rendering. Radiation requires projectile contact, caps at three stacks across all sources, reduces recovery by at most 24%, respects armor/shields and stops when its source dies. Bang Chủ has one fixed, telegraphed field, with exact three/four damage pulses and an escapable radius. Jake fires colliding food projectiles and heals living allies within range. Healing cannot resurrect or exceed maximum HP.

Held custom weapon SVGs #26–33 point upward, with a bottom grip. Arena rotation maps that axis to the same radial direction used by weapon collision. Traveling projectiles point right in their atlas and rotate separately to velocity.
