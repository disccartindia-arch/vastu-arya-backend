import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PaymentSuccessClient from "./PaymentSuccessClient";

export const metadata: Metadata = buildMetadata({
  title: "Payment Success | Vastu Arya",
  description: "",
  path: "/payment-success",
  noIndex: true,
});

export default function Page() { return <PaymentSuccessClient />; }
