// app/(public)/book-appointment/page.tsx — Fix #4: Wrong canonical URL corrected
import type { Metadata } from "next";
import { buildMetadata, bookAppointmentJsonLd } from "@/lib/seo";
import BookAppointmentClient from "./BookAppointmentClient";

export const metadata: Metadata = buildMetadata({
  title:       "Book a Vastu Consultation - Dr. PPS Tomar | From Rs.11",
  description: "Book a Vastu Shastra, Astrology, or Numerology consultation with IVAF Certified Expert Dr. PPS Tomar. Online and in-person sessions. Starting from just Rs.11. 45000+ satisfied clients.",
  path:        "/book-appointment",  // Fix #4: was "/services/book-appointment" — wrong canonical
});

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookAppointmentJsonLd) }}
      />
      <BookAppointmentClient />
    </>
  );
}
