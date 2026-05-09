import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import AboutClient from "./AboutClient";

export const metadata: Metadata = buildMetadata({
  title: "About Dr. PPS Tomar - IVAF Certified Vastu Expert | Vastu Arya",
  description: "Meet Dr. PPS Tomar - IVAF Certified Vastu Shastra Expert and Astrologer with 20+ years of experience. 73000+ clients transformed across India.",
  path: "/about",
});

export default function Page() { return <AboutClient />; }
