import { setRequestLocale } from "next-intl/server";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingMap } from "@/components/booking/booking-map";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]">
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        async
      />

      {/* Full-screen map background */}
      <BookingMap />

      {/* Bottom sheet overlay */}
      <div className="absolute inset-x-0 bottom-0 top-[30vh] pointer-events-none z-10">
        <div className="h-full pointer-events-auto overflow-y-auto rounded-t-3xl bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10">
          {/* Drag handle */}
          <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pb-8">
            <BookingFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
