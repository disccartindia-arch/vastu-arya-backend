import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import VastuStoreClient from "./VastuStoreClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Store - Rudraksha, Gemstones, Yantras and Sacred Items",
  description: "Shop authentic Vastu and spiritual products: Rudraksha, certified gemstones, powerful yantras, sacred malas and divine frames. Curated by Dr. PPS Tomar.",
  path: "/vastu-store",
});

export default function Page() { return <VastuStoreClient />; }
