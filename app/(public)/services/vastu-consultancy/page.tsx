import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import VastuConsultancyClient from "./VastuConsultancyClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Service - Dr. PPS Tomar | Vastu Arya",
  description: "Expert Vastu and astrology service by IVAF Certified Dr. PPS Tomar.",
  path: "/services/vastu-consultancy",
});

export default function Page() { return <VastuConsultancyClient />; }
