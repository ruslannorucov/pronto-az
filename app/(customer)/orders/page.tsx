"use client";

import dynamic from "next/dynamic";

const OrdersClient = dynamic(() => import("./OrdersClient"), {
  ssr: false,
});

export default function OrdersPage() {
  return <OrdersClient />;
}