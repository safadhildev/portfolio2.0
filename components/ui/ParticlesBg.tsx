"use client";

import dynamic from "next/dynamic";
import type { ConfigProp, TypeProp } from "particles-bg";

const ParticlesBgComponent = dynamic(() => import("particles-bg"), {
  ssr: false,
});

export function ParticlesBg({
  type,
  num,
  config,
}: {
  type: TypeProp;
  num?: number;
  config?: ConfigProp;
}) {
  return (
    <div className="absolute inset-0 opacity-20">
      <ParticlesBgComponent type={type} num={num} config={config} />
    </div>
  );
}
