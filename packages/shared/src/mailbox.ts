import { PACK_CAPACITY } from "./progression";

export interface GiftMail {
  id: string;
  title: string;
  message: string;
  packs: number;
  createdAt: number;
  claimedAt?: number;
}

export interface MailboxProfile {
  packs: number;
  lastPackAt: number;
  mailbox?: GiftMail[];
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

/** One atomic profile update: either the entire gift fits, or nothing changes. */
export function claimMail<T extends MailboxProfile>(
  profile: T,
  id: string,
  now = Date.now(),
): T {
  const mail = profile.mailbox?.find((mail) => mail.id === id);
  if (!mail) throw Error("Không tìm thấy thư này.");
  if (mail.claimedAt !== undefined) return profile;
  const queued = queuedPackCount(profile, now);
  if (queued + mail.packs > PACK_CAPACITY)
    throw Error(
      `Hàng chờ còn ${PACK_CAPACITY - queued} chỗ. Cần ${mail.packs} chỗ trống để nhận toàn bộ quà.`,
    );
  const elapsed = Math.floor(Math.max(0, now - profile.lastPackAt) / 60_000);
  const packs = queued + mail.packs;
  return {
    ...profile,
    packs,
    lastPackAt:
      packs >= PACK_CAPACITY ? now : profile.lastPackAt + elapsed * 60_000,
    mailbox: profile.mailbox!.map((existing) =>
      existing.id === id ? { ...existing, claimedAt: now } : existing,
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
    mails.set(mail.id, old?.claimedAt !== undefined ? old : mail);
  }
  return [...mails.values()];
}
