"use client";

import dynamic from "next/dynamic";

const GameShell = dynamic(() => import("@/components/GameShell"), { ssr: false });

export default function Home() {
  return <GameShell />;
}
