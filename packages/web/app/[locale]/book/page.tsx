import { setRequestLocale } from "next-intl/server";
import { BookingFlow } from "@/components/booking/booking-flow";
import Script from "next/script";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="beforeInteractive"
      />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <BookingFlow />
      </div>
    </>
  );
}
