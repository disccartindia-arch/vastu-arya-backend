import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PaymentFailureClient from "./PaymentFailureClient";

export const metadata: Metadata = buildMetadata({
  title: "Payment Failed | Vastu Arya",
  description: "",
  path: "/payment-failure",
  noIndex: true,
});

export default function Page() { return <PaymentFailureClient />; }
