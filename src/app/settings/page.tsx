"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import { AppSidebar } from "@/components/studio/AppSidebar";
import type { CreditLedgerEntry, UserProfile } from "@/types/database";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [buying, setBuying] = useState(false);

  const { data } = useQuery<{ user: UserProfile; ledger: CreditLedgerEntry[] }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  const user = data?.user;
  const ledger = data?.ledger ?? [];

  async function handleBuyCredits(credits: number) {
    setBuying(true);
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "purchase", credits }),
      });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#0B0B10]">
      <AppSidebar creditBalance={user?.credit_balance} plan={user?.plan} />
      <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Account, Credits &amp; Billing</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Manage your studio plan, top up credits via Paystack or Stripe, and audit your credit ledger.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-[#A1A1AA]">Current Balance</span>
              <span className="inline-flex items-center gap-1 text-xs text-[#22C55E]">
                <CheckCircle2 className="h-3.5 w-3.5" /> {user?.email_verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <Coins className="h-6 w-6 text-[#F59E0B]" />
              <span className="font-mono text-3xl font-bold text-white">{user?.credit_balance ?? 0}</span>
              <span className="text-sm text-[#A1A1AA]">credits</span>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Account: {user?.email} • Plan: <span className="capitalize text-white">{user?.plan}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#7C5CFF]" />
              Top Up Studio Credits
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[100, 300, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={buying}
                  onClick={() => handleBuyCredits(amt)}
                  className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3 text-center hover:border-[#7C5CFF] transition"
                >
                  <span className="font-mono text-base font-bold text-white">+{amt}</span>
                  <span className="block text-[11px] text-[#A1A1AA]">credits</span>
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
              Paystack / Flutterwave (Nigeria) &amp; Stripe (International) supported
            </p>
          </div>
        </div>

        {/* Append-only Credit Ledger */}
        <section className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Credit Ledger (Audit Trail)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#26262F] text-[#A1A1AA]">
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Delta</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26262F]">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 capitalize text-white">{entry.reason}</td>
                    <td className="py-2.5 text-[#A1A1AA]">{entry.description || "Studio operation"}</td>
                    <td className={`py-2.5 font-mono font-semibold ${entry.delta >= 0 ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td className="py-2.5 font-mono text-[#A1A1AA]">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

