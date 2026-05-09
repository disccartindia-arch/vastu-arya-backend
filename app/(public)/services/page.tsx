import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = buildMetadata({
  title: "Vastu Shastra Services - Consultancy, Numerology and Gemstone Guidance",
  description: "Explore expert Vastu Shastra services by Dr. PPS Tomar: Home Vastu, Business Vastu, Mobile Numerology, Gemstone Guidance and more. IVAF Certified. Book from Rs.11.",
  path: "/services",
});

export default function Page() { return <ServicesClient />; }
