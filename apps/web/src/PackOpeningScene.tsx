import React, { Component, memo, useState, type CSSProperties, type ReactNode } from "react";

type PackPull = { id: string; kind: string; tier: string; rarity: string };

export const unpackStepMs = (count: number) => count <= 5 ? 360 : count <= 10 ? 240 : count <= 25 ? 140 : 75;

export function PackArtwork({ className = "", assetBase = import.meta.env?.BASE_URL || "/" }: { className?: string; assetBase?: string }) {
  return <div className={`pack-booster ${className}`.trim()} aria-label="Gói thẻ RiseOn Collector Series">
    <i className="booster-crimp" />
    <i className="booster-inner-light" aria-hidden="true" />
    <span className="booster-edition">RISEON · COLLECTOR SERIES</span>
    <img className="booster-logo" src={`${assetBase}riseon-pack-logo.png`} alt="RiseOn Game Studio" />
    <strong>ULTIMATE<br />TCG</strong>
    <span className="booster-ribbon">ONE CARD · INFINITE BATTLES</span>
    <i className="booster-seal">✦</i>
    <i className="booster-crimp bottom" />
  </div>;
}

export function visiblePackOrders(count: number, opened: number) {
  const start = Math.max(0, opened - 9);
  const end = Math.min(count, opened + 6);
  return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);
}

const PackLayer = memo(function PackLayer({ pull, order, count, startedAt, assetBase }: { pull: PackPull; order: number; count: number; startedAt: number; assetBase?: string }) {
  const [mountedAt] = useState(() => performance.now() - startedAt);
  const step = unpackStepMs(count);
  const tearAt = (order + 0.36) * step - mountedAt;
  const glowAt = tearAt + step * 0.12;
  const style = {
    "--pack-world-y": `${-order * 26}px`, "--pack-world-z": `${-order * 98}px`,
    "--tear-at": `${tearAt}ms`, "--tear-duration": `${step * 0.46}ms`,
    "--glow-at": `${glowAt}ms`, "--strip-duration": `${Math.max(260, step * 0.95)}ms`, zIndex: count - order,
  } as CSSProperties;
  return <article className={`reveal-unpack-pack tier-${pull.tier.toLowerCase()}`} style={style} aria-label={`Pack lớp ${order + 1}, rarity ${pull.rarity}`}>
    <PackArtwork className="reveal-booster" assetBase={assetBase} />
    <i className="pack-open-rim" aria-hidden="true" />
    <div className="pack-mouth-glow" aria-hidden="true">
      <i className="pack-light-haze" /><i className="pack-light-volume" /><i className="pack-light-core" />
      <span className="pack-sparkles">{Array.from({ length: count > 25 ? 2 : 6 }, (_, particle) => <i key={particle} style={{
        "--spark-x": `${[-52, 37, 8, -24, 56, -10][particle]}px`,
        "--spark-rise": `${[64, 98, 76, 116, 86, 124][particle]}px`,
        "--spark-at": `${glowAt + particle * 115}ms`, "--spark-duration": `${1300 + particle * 130}ms`,
      } as CSSProperties} />)}</span>
    </div>
    <i className="pack-torn-strip" aria-hidden="true" />
  </article>;
});

// Packs stay fixed in world space. Only the camera advances. A bounded window
// keeps GPU layers constant even for 100 packs; late mounts use the scene clock.
export function PackOpeningScene({ pulls, openedCount = 0, assetBase }: { pulls: readonly PackPull[]; openedCount?: number; assetBase?: string }) {
  const [startedAt] = useState(() => performance.now());
  const step = unpackStepMs(pulls.length);
  const cameraStart = -0.36;
  const cameraEnd = pulls.length - 0.36;
  const cameraStyle = {
    "--camera-duration": `${pulls.length * step}ms`,
    "--camera-start-y": `${cameraStart * 26}px`,
    "--camera-start-z": `${cameraStart * 98}px`,
    "--camera-end-y": `${cameraEnd * 26}px`,
    "--camera-end-z": `${cameraEnd * 98}px`,
  } as CSSProperties;

  return <div className={`reveal-unpack-track${pulls.length > 25 ? " fast-sequence" : ""}`} aria-label="Chồng pack theo chiều sâu">
    <div className="unpack-camera" style={cameraStyle}>
      {visiblePackOrders(pulls.length, openedCount).map(order => <PackLayer key={order} pull={pulls[pulls.length - 1 - order]} order={order} count={pulls.length} startedAt={startedAt} assetBase={assetBase} />)}
    </div>
  </div>;
}

export class PackAnimationBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <p>Thẻ đã được lưu. Đang chuyển sang kết quả…</p> : this.props.children; }
}
