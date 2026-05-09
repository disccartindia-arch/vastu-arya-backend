import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import VastuFeedClient from "./VastuFeedClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Feed - Daily Vastu and Astrology Updates | Vastu Arya",
  description: "Stay updated with daily Vastu Shastra tips, astrology insights and spiritual guidance from Dr. PPS Tomar. Your daily dose of Vastu wisdom.",
  path: "/vastu-feed",
});

export default function Page() { return <VastuFeedClient />; }
