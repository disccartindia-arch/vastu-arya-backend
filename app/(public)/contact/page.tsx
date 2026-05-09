import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const metadata: Metadata = buildMetadata({
  title: "Contact Vastu Arya - Reach Dr. PPS Tomar | +91-7000343804",
  description: "Contact Dr. PPS Tomar for Vastu Shastra, Astrology and Numerology consultations. Call +91-7000343804 or book online. Office in New Delhi, India.",
  path: "/contact",
});

export default function Page() { return <ContactClient />; }
