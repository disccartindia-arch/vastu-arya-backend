import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy | Vastu Arya",
  description: "Read the Vastu Arya privacy policy to understand how we collect, use and protect your personal information.",
  path: "/privacy",
});

export default function Page() { return <PrivacyClient />; }
