import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = buildMetadata({
  title: "Checkout | Vastu Arya",
  description: "",
  path: "/checkout",
  noIndex: true,
});

export default function Page() { return <CheckoutClient />; }
