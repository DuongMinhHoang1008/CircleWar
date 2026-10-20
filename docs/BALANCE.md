# Combat balance v21

The executable character and item budgets live in
`packages/shared/src/combat-balance.ts`. Catalog descriptions, Inspector-style
stat popups, `computeStats`, and combat consume that shared data. The original
role-specific legacy skill switch has been removed; it previously described
actions that the active generic skill implementation did not execute.

## Character budgets and rarity

All 25 characters have separate HP, damage, armor, movement, attack interval,
weapon reach, critical chance, energy generation and passive values. Tanks trade
damage for durability; fighters use physical reach; controllers slow through
projectile hits; rangers trade durability for range; supports contribute shields
and healing; the assassin trades survivability for speed and burst.

Numbers in the profile table use a T1 reference budget. Current rarity supplies
18% per tier above T1, plus up to 6% progress within a rarity. Character growth
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

All 25 items have a combined stat/effect budget at the T1 reference. Their current
rarity and upgrade progress scale both modifiers and triggered effects. Item
levels are stored on each fighter and survive checkpoints. Affinity adds 8%
effectiveness to the same budget, rather than unrelated flat bonuses.

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
Pack storage is capped by shared `PACK_CAPACITY = 100` in browser, profile
validation/recharge, room rewards and claims. The initial grant remains 10;
multi-open choices are 1/3/5/10/20/50/100. Existing profiles remain valid.

## Reproducible validation

- `npm test`: deterministic combat, progression, item effects, replay and synergy
  coverage, including simultaneous pair/trio/group activation.
- `npm exec -- tsx tests/performance/balance-audit.ts`: all roster matchups with
  mirrored spawn sides, controlled three-unit teams, and all 25 GOD items across
  six mirrored GOD character fixtures. Writes `reports/balance-audit.json`.
- `npm exec -- tsx tests/integration/balance-browser.ts`: requires local web and
  Worker; checks 100-pack recharge/overflow, evolved item previews and named team
  colors on desktop/mobile using an isolated test profile.

Audit win rates are fixed-seed simulation observations, not live-player win-rate
claims. Supports are evaluated in teams as well as duels. The report includes
unresolved matches so they cannot be hidden in aggregate rates.

Start new battles after upgrading to v21; older engine snapshots/replays retain
the existing version mismatch protection.

v22 retains these combat budgets and introduces a smaller square default arena
and a 20-second wall schedule. The v21 audit in `reports/balance-audit.json` uses
its explicitly recorded rectangular fixture; it is not a measurement of the new
default map. See `docs/REPLAY_FORMAT.md` for v22 geometry and VFX details.
