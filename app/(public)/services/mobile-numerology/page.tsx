import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import MobileNumerologyClient from "./MobileNumerologyClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Service - Dr. PPS Tomar | Vastu Arya",
  description: "Expert Vastu and astrology service by IVAF Certified Dr. PPS Tomar.",
  path: "/services/mobile-numerology",
});

export default function Page() { return <MobileNumerologyClient />; }
