import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const metadata: Metadata = buildMetadata({
  title:       "Vastu Shastra and Astrology Consultancy by Dr. PPS Tomar - IVAF Certified",
  description: "India most trusted Vastu Shastra and Astrology platform. Dr. PPS Tomar - IVAF Certified Expert - has transformed 73000+ homes and businesses. Book from just Rs.11.",
  path:        "/",
});

export default function Page() {
  return <HomeClient />;
}
