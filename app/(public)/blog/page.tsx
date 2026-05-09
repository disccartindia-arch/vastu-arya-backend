import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import BlogClient from "./BlogClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Shastra Blog - Tips, Remedies and Expert Insights | Vastu Arya",
  description: "Read expert articles on Vastu Shastra, Astrology, Numerology and spiritual living by Dr. PPS Tomar. Practical tips, remedies and guidance for a harmonious life.",
  path: "/blog",
});

export default function Page() { return <BlogClient />; }
