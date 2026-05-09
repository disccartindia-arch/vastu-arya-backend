import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CategoryClient from "./CategoryClient";

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  return buildMetadata({
    title: "Vastu Store - Sacred Products | Vastu Arya",
    description: "Shop authentic Vastu and spiritual products curated by Dr. PPS Tomar.",
    path: "/vastu-store/" + params.category,
  });
}

export default function Page() { return <CategoryClient />; }
