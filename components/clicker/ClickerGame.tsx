"use client";

import ClickerArea from "./ClickerArea";
import LiveDropsFeed from "./LiveDropsFeed";
import XPStatsBar from "./XPStatsBar";
import AutoclickerPanel from "./AutoclickerPanel";

export default function ClickerGame() {
  return (
    <div className="flex flex-col items-center w-full">
      <ClickerArea />
      <AutoclickerPanel />
      <LiveDropsFeed />
      <XPStatsBar />
    </div>
  );
}
