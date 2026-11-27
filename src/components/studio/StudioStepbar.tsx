"use client";

import Link from "next/link";
import { Check, Coins, ArrowLeft } from "lucide-react";

const STEPS = [
  { key: "characters", label: "Characters", path: "characters" },
  { key: "story", label: "Story & Script", path: "story" },
  { key: "scenes", label: "Scenes", path: "scenes" },
  { key: "generate", label: "Generate", path: "generate" },
  { key: "editor", label: "Editor", path: "editor" },
  { key: "export", label: "Export", path: "export" },
] as const;

export function StudioStepbar({
  projectId,
  projectName,
  currentStep,
  creditBalance = 250,
}: {
  projectId: string;
  projectName: string;
  currentStep: string;
  creditBalance?: number;
}) {
  const activeIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <header className="sticky top-0 z-30 border-b border-[#26262F] bg-[#0B0B10]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262F] bg-[#15151C] px-2.5 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[260px]">
              {projectName || "Untitled Project"}
            </p>
          </div>
        </div>

        <nav aria-label="Studio workflow steps" className="flex items-center gap-1 overflow-x-auto py-1">
          {STEPS.map((step, idx) => {
            const isCurrent = step.key === currentStep;
            const isCompleted = activeIdx > idx;
            return (
              <Link
                key={step.key}
                href={`/projects/${projectId}/${step.path}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  isCurrent
                    ? "studio-gradient text-white shadow-sm"
                    : isCompleted
                    ? "bg-[#15151C] text-[#22C55E] border border-[#22C55E]/30"
                    : "bg-[#15151C] text-[#A1A1AA] border border-[#26262F] hover:text-white"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="font-mono text-[11px] opacity-75">{idx + 1}</span>
                )}
                {step.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#26262F] bg-[#15151C] px-3 py-1.5 text-xs font-medium text-white hover:border-[#7C5CFF] transition"
        >
          <Coins className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span className="font-mono">{creditBalance}</span>
          <span className="text-[#A1A1AA]">credits</span>
        </Link>
      </div>
    </header>
  );
}

