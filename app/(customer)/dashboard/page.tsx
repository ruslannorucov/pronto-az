"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DiscoveryClient = dynamic(() => import("./DiscoveryClient"), { ssr: false });
const DashboardClient = dynamic(() => import("./DashboardClient"), { ssr: false });

function DashboardRouter() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "orders") {
    return <DashboardClient />;
  }
  return <DiscoveryClient />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-[80px] bg-[var(--gray-100)] rounded-2xl animate-pulse" />
        ))}
      </div>
    }>
      <DashboardRouter />
    </Suspense>
  );
}