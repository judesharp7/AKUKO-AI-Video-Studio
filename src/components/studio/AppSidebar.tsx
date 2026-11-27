"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Settings,
  Plus,
  Coins,
  Film,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: FolderOpen },
  { href: "/templates", label: "Templates", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ creditBalance = 250, plan = "creator" }: { creditBalance?: number; plan?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl studio-gradient shadow-lg">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">AKUKO</span>
            <span className="block text-[11px] text-[#A1A1AA]">AI Video Studio</span>
          </div>
        </Link>

        <Link
          href="/projects/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl studio-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" />
          Create New Video
        </Link>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#1F1F29] text-white border border-[#26262F]"
                    : "text-[#A1A1AA] hover:bg-[#15151C] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-[#26262F] bg-[#15151C] p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A1A1AA] capitalize">{plan} Plan</span>
          <Link href="/settings" className="text-[#7C5CFF] hover:underline">
            Top up
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#F59E0B]" />
          <span className="font-mono text-base font-semibold text-white">{creditBalance}</span>
          <span className="text-xs text-[#A1A1AA]">credits</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-[#26262F] bg-[#0B0B10] px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg studio-gradient">
            <Film className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">AKUKO</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="rounded-lg border border-[#26262F] bg-[#15151C] p-2 text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            className="h-full w-64 border-r border-[#26262F] bg-[#0B0B10]"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#26262F] bg-[#0B0B10] lg:block">
        {navContent}
      </aside>
    </>
  );
}

