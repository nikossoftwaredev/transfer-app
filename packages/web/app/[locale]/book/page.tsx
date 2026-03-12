import { setRequestLocale } from "next-intl/server";
import { BookingFlow } from "@/components/booking/booking-flow";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-y-auto">
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        async
      />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/4 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-500/4 rounded-full blur-[128px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative min-h-full flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          <BookingFlow />
        </div>
      </div>
    </div>
  );
}
