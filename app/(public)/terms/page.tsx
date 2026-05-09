import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import TermsClient from "./TermsClient";

export const metadata: Metadata = buildMetadata({
  title: "Terms and Conditions | Vastu Arya",
  description: "Read the Vastu Arya terms and conditions governing use of our website and services.",
  path: "/terms",
});

export default function Page() { return <TermsClient />; }
