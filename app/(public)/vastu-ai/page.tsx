import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import VastuAIClient from "./VastuAIClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu AI - AI-Powered Vastu Guidance | Vastu Arya",
  description: "Get instant Vastu Shastra guidance powered by AI, trained on Dr. PPS Tomar expertise. Ask your Vastu questions and get personalised answers anytime.",
  path: "/vastu-ai",
});

export default function Page() { return <VastuAIClient />; }
