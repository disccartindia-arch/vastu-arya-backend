import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SmartLayoutClient from "./SmartLayoutClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Service - Dr. PPS Tomar | Vastu Arya",
  description: "Expert Vastu and astrology service by IVAF Certified Dr. PPS Tomar.",
  path: "/services/smart-layout",
});

export default function Page() { return <SmartLayoutClient />; }
