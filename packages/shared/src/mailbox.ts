import { PACK_CAPACITY } from "./progression";

export interface GiftMail {
  id: string;
  title: string;
  message: string;
  packs: number;
  createdAt: number;
  claimedAt?: number;
  claimedPacks?: number;
}

export interface MailboxProfile {
  packs: number;
  lastPackAt: number;
  mailbox?: GiftMail[];
  rewardReserve?: number;
  rewardReceipts?: string[];
}

export function welcomeMail(now = Date.now()): GiftMail {
  return {
    id: "welcome",
    title: "Quà tân thủ",
    message:
      "Chào mừng đến với RiseOn! Nhận 50 pack để bắt đầu bộ sưu tập của bạn.",
    packs: 50,
    createdAt: now,
  };
}

export function updateMail(version: string, now = Date.now()): GiftMail {
  return {
    id: `update:${version}`,
    title: `Quà cập nhật v${version}`,
    message:
      "Cảm ơn bạn đã đồng hành cùng RiseOn. Gửi bạn 50 pack để khám phá bản cập nhật mới!",
    packs: 50,
    createdAt: now,
  };
}

export function deliverMail<T extends MailboxProfile>(
  profile: T,
  mail: GiftMail,
): T {
  if (profile.mailbox?.some((existing) => existing.id === mail.id))
    return profile;
  return { ...profile, mailbox: [...(profile.mailbox || []), mail] };
}

export function queuedPackCount(
  profile: Pick<MailboxProfile, "packs" | "lastPackAt">,
  now = Date.now(),
) {
  return Math.min(
    PACK_CAPACITY,
    profile.packs + Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000),
  );
}

/** Credit what fits and persist the remaining gift in the same profile update. */
export function claimMail<T extends MailboxProfile>(
  profile: T,
  id: string,
  now = Date.now(),
): T {
  const mail = profile.mailbox?.find((mail) => mail.id === id);
  if (!mail) throw Error("Không tìm thấy thư này.");
  if (mail.claimedAt !== undefined) return profile;
  const queued = queuedPackCount(profile, now);
  const accepted = Math.min(PACK_CAPACITY - queued, mail.packs - (mail.claimedPacks || 0));
  if (!accepted) throw Error("Hàng chờ đã đầy. Mở bớt pack để nhận quà.");
  const elapsed = Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000);
  const packs = queued + accepted;
  return {
    ...profile,
    packs,
    lastPackAt:
      packs >= PACK_CAPACITY ? now : profile.lastPackAt + elapsed * 60_000,
    mailbox: profile.mailbox!.map((existing) =>
      existing.id === id ? { ...existing, claimedPacks: (existing.claimedPacks || 0) + accepted, ...((existing.claimedPacks || 0) + accepted === existing.packs ? { claimedAt: now } : {}) } : existing,
    ),
  };
}

export function validMailbox(value: unknown): value is GiftMail[] {
  return (
    Array.isArray(value) &&
    value.length <= 200 &&
    new Set(value.map((mail) => mail?.id)).size === value.length &&
    value.every(
      (mail) =>
        mail &&
        typeof mail.id === "string" &&
        mail.id.length > 0 &&
        mail.id.length <= 100 &&
        typeof mail.title === "string" &&
        mail.title.length <= 150 &&
        typeof mail.message === "string" &&
        mail.message.length <= 1000 &&
        Number.isSafeInteger(mail.packs) &&
        mail.packs > 0 &&
        mail.packs <= PACK_CAPACITY &&
        (mail.claimedPacks === undefined || Number.isSafeInteger(mail.claimedPacks) && mail.claimedPacks >= 0 && mail.claimedPacks <= mail.packs) &&
        Number.isSafeInteger(mail.createdAt) &&
        mail.createdAt >= 0 &&
        (mail.claimedAt === undefined ||
          (Number.isSafeInteger(mail.claimedAt) &&
            mail.claimedAt >= mail.createdAt)),
    )
  );
}

/** A delayed profile save must not make an already claimed letter claimable again. */
export function mergeMailbox(
  previous: GiftMail[] = [],
  incoming: GiftMail[] = [],
): GiftMail[] {
  const mails = new Map(previous.map((mail) => [mail.id, mail]));
  for (const mail of incoming) {
    const old = mails.get(mail.id);
    mails.set(mail.id, old?.claimedAt !== undefined ? old : { ...mail, claimedPacks: Math.max(old?.claimedPacks || 0, mail.claimedPacks || 0) });
  }
  return [...mails.values()];
}

/** Receipt, immediate credit and overflow are committed together; retries are no-ops. */
export function awardPacks<T extends MailboxProfile>(profile: T, amount: number, receipt: string, now = Date.now()): T {
  if (!Number.isSafeInteger(amount) || amount < 0 || !receipt) throw Error("Phần thưởng không hợp lệ.");
  if (profile.rewardReceipts?.includes(receipt)) return profile;
  const queued = queuedPackCount(profile, now), accepted = Math.min(PACK_CAPACITY - queued, amount);
  const elapsed = Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000);
  return { ...profile, packs: queued + accepted, lastPackAt: queued + accepted >= PACK_CAPACITY ? now : profile.lastPackAt + elapsed * 60_000,
    rewardReserve: (profile.rewardReserve || 0) + amount - accepted, rewardReceipts: [...(profile.rewardReceipts || []), receipt].slice(-5000) };
}
export function claimReserve<T extends MailboxProfile>(profile: T, now = Date.now()): T {
  const queued = queuedPackCount(profile, now), accepted = Math.min(PACK_CAPACITY - queued, profile.rewardReserve || 0);
  if (!accepted) return profile;
  const elapsed = Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000);
  return { ...profile, packs: queued + accepted, rewardReserve: (profile.rewardReserve || 0) - accepted, lastPackAt: queued + accepted >= PACK_CAPACITY ? now : profile.lastPackAt + elapsed * 60_000 };
}

/** Challenge overflow is an actual inbox letter; the reserve remains a lossless fallback for a full inbox. */
export function awardPacksToMailbox<T extends MailboxProfile>(profile: T, amount: number, receipt: string, now = Date.now()): T {
  const awarded = awardPacks(profile, amount, receipt, now);
  if (awarded === profile) return profile;
  let overflow = (awarded.rewardReserve || 0) - (profile.rewardReserve || 0);
  const mailbox = [...(awarded.mailbox || [])];
  let part = 0;
  while (overflow > 0 && mailbox.length < 200) {
    const packs = Math.min(PACK_CAPACITY, overflow);
    mailbox.push({ id: `reward:${receipt}:${part++}`, title: "Thưởng chinh phục", message: "Hàng chờ không còn đủ chỗ. Phần thưởng thử thách của bạn được giữ trong thư này; mở bớt pack để nhận.", packs, createdAt: now });
    overflow -= packs;
  }
  return { ...awarded, mailbox, rewardReserve: (profile.rewardReserve || 0) + overflow };
}
