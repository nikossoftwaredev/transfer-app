import { getTranslations, setRequestLocale } from "next-intl/server";
import { BasePageProps } from "@/types/page-props";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import {
  Plane,
  Building2,
  Ship,
  Map,
  BadgeDollarSign,
  UserCheck,
  MapPin,
  Headphones,
  ArrowRight,
  ChevronRight,
  Users,
  Briefcase,
  Star,
  Shield,
  Clock,
  Phone,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/examples/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/examples/language-switcher";
import { LoginButton } from "@/components/examples/login-button";
import { PhoneMockup } from "@/components/landing/phone-mockup";

const fleet = [
  {
    name: "Mercedes E Class",
    tags: ["Business Class"],
    capacity: 3,
    luggage: 3,
    price: 55,
    description: "BMW 5 Series, Cadillac XTS or similar",
  },
  {
    name: "Mercedes S Class",
    tags: ["Business", "VIP", "Premium"],
    capacity: 3,
    luggage: 3,
    price: 85,
    description: "BMW 7, Audi A8, Cadillac Escalade or similar",
  },
  {
    name: "Mercedes Vito",
    tags: ["Family", "Group Travel"],
    capacity: 7,
    luggage: 7,
    price: 65,
    description: "Ford Custom, Chevrolet Suburban or similar",
  },
  {
    name: "Mercedes V Class",
    tags: ["Family", "Group", "Premium"],
    capacity: 6,
    luggage: 6,
    price: 75,
    description: "Cadillac Escalade or similar",
  },
  {
    name: "Mercedes Sprinter",
    tags: ["Group Travel", "Large Groups"],
    capacity: 16,
    luggage: 16,
    price: 95,
    description: "Ford Transit or similar",
  },
];

const Home = async ({ params }: BasePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const nav = await getTranslations("Nav");

  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── Navbar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-transparent bg-transparent transition-all duration-300 backdrop-blur-none [&:has(+main_.hero-sentinel:not(:hover))]:border-border/40 [&:has(+main_.hero-sentinel:not(:hover))]:bg-background/80 [&:has(+main_.hero-sentinel:not(:hover))]:backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Transfer<span className="text-amber-400">GR</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#fleet" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              Fleet
            </a>
            <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              {nav("howItWorks")}
            </a>
            <a href="#services" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
              {nav("services")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <LoginButton />
            <Button asChild size="sm" className="hidden sm:inline-flex bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0">
              <Link href="/book" className="gap-1.5">
                {nav("bookNow")}
                <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0f]">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-slate-500/[0.03] rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/[0.02] rounded-full blur-[150px]" />
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left: Text */}
              <div className="space-y-8 animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-glow" />
                  <span className="text-amber-400/90 text-xs font-medium tracking-wide uppercase">
                    Available 24/7 across Greece
                  </span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
                  {t("hero.title")}
                </h1>

                <p className="text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed">
                  {t("hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button asChild size="lg" className="text-base px-8 h-13 bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0 shadow-lg shadow-amber-500/20">
                    <Link href="/book" className="gap-2">
                      {t("hero.cta")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base px-8 h-13 border-white/10 text-white hover:bg-white/5 hover:text-white">
                    <a href="#fleet" className="gap-2">
                      Explore Fleet
                      <ChevronRight className="size-4" />
                    </a>
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-amber-400/60" />
                    <span className="text-white/40 text-sm">Licensed &amp; Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-amber-400/60" />
                    <span className="text-white/40 text-sm">4.9 Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-amber-400/60" />
                    <span className="text-white/40 text-sm">On-time guarantee</span>
                  </div>
                </div>
              </div>

              {/* Right: Phone Mockup */}
              <div className="flex justify-center lg:justify-end animate-fade-up delay-300">
                <PhoneMockup />
              </div>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
        </section>

        {/* ─── Stats Bar ───────────────────────────────────────── */}
        <section className="relative bg-[#0a0a0f] border-t border-white/[0.04]">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "2,500+", label: t("stats.trips") },
                { value: "30+", label: t("stats.cities") },
                { value: "4.9", label: t("stats.rating") },
                { value: "24/7", label: t("stats.support") },
              ].map((stat, i) => (
                <div key={stat.label} className={`text-center animate-fade-up delay-${(i + 1) * 100}`}>
                  <div className="font-display text-3xl sm:text-4xl text-amber-400 mb-1">{stat.value}</div>
                  <div className="text-white/40 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Fleet ───────────────────────────────────────────── */}
        <section id="fleet" className="relative bg-[#0a0a0f] py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14 animate-fade-up">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-4">
                {t("fleet.title")}
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                {t("fleet.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {fleet.map((vehicle, i) => (
                <div
                  key={vehicle.name}
                  className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-amber-500/20 hover:bg-white/[0.04] animate-fade-up delay-${(i + 1) * 100}`}
                >
                  {/* Gradient header area */}
                  <div className="relative h-44 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-black" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                    {/* Subtle car silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-32 h-20 text-white/[0.04] group-hover:text-amber-500/[0.06] transition-colors duration-300" viewBox="0 0 120 60" fill="currentColor">
                        <path d="M10 45 C10 45 15 25 35 22 C45 20 55 15 65 15 C75 15 95 20 100 25 C108 32 110 38 110 42 C110 45 108 48 105 48 L95 48 C95 48 93 42 88 42 C83 42 81 48 81 48 L39 48 C39 48 37 42 32 42 C27 42 25 48 25 48 L15 48 C12 48 10 47 10 45Z" />
                      </svg>
                    </div>
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/[0.03] rounded-full blur-[40px] group-hover:bg-amber-500/[0.06] transition-all duration-300" />
                    {/* Tags */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                      {vehicle.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/[0.08] backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-white/60 border border-white/[0.06]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-display text-xl text-white group-hover:text-amber-400 transition-colors duration-300">
                      {vehicle.name}
                    </h3>
                    <div className="flex items-center gap-4 text-white/40 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {vehicle.capacity} {t("fleet.passengers")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="size-3.5" />
                        {vehicle.luggage}
                      </span>
                    </div>
                    <p className="text-white/25 text-sm leading-relaxed">{vehicle.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <div>
                        <span className="text-white/30 text-xs">{t("fleet.from")}</span>
                        <span className="text-amber-400 text-lg font-bold ml-1.5">&euro;{vehicle.price}</span>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 text-xs">
                        <Link href="/book" className="gap-1">
                          {nav("bookNow")} <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────────────── */}
        <section id="how-it-works" className="relative bg-[#0e0e14] border-t border-white/[0.04] py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white text-center mb-16 animate-fade-up">
              {t("howItWorks.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

              {[
                { step: "1", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc"), icon: MapPin },
                { step: "2", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc"), icon: UserCheck },
                { step: "3", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc"), icon: Star },
              ].map((item, i) => (
                <div key={item.step} className={`text-center space-y-4 relative animate-fade-up delay-${(i + 1) * 200}`}>
                  <div className="mx-auto size-16 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-400 flex items-center justify-center relative">
                    <item.icon className="size-7" />
                    <div className="absolute -top-2 -right-2 size-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Services ─────────────────────────────────────────── */}
        <section id="services" className="relative bg-[#0a0a0f] border-t border-white/[0.04] py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white text-center mb-16 animate-fade-up">
              {t("services.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {[
                { icon: Plane, title: t("services.airport"), desc: t("services.airportDesc"), accent: "from-blue-500/10 to-transparent" },
                { icon: Building2, title: t("services.city"), desc: t("services.cityDesc"), accent: "from-emerald-500/10 to-transparent" },
                { icon: Ship, title: t("services.port"), desc: t("services.portDesc"), accent: "from-cyan-500/10 to-transparent" },
                { icon: Map, title: t("services.tours"), desc: t("services.toursDesc"), accent: "from-amber-500/10 to-transparent" },
              ].map((service, i) => (
                <div
                  key={service.title}
                  className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4 hover:border-amber-500/20 hover:bg-white/[0.04] transition-all duration-300 animate-fade-up delay-${(i + 1) * 100}`}
                >
                  {/* Top gradient accent */}
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="size-12 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/60 flex items-center justify-center group-hover:text-amber-400 group-hover:border-amber-500/20 transition-all duration-300">
                    <service.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why TransferGR ───────────────────────────────────── */}
        <section className="relative bg-[#0e0e14] border-t border-white/[0.04] py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white text-center mb-16 animate-fade-up">
              {t("why.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { icon: BadgeDollarSign, title: t("why.price"), desc: t("why.priceDesc") },
                { icon: UserCheck, title: t("why.drivers"), desc: t("why.driversDesc") },
                { icon: MapPin, title: t("why.tracking"), desc: t("why.trackingDesc") },
                { icon: Headphones, title: t("why.support"), desc: t("why.supportDesc") },
              ].map((item, i) => (
                <div key={item.title} className={`flex gap-4 p-5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all duration-300 animate-fade-up delay-${(i + 1) * 100}`}>
                  <div className="shrink-0 size-11 rounded-xl bg-amber-500/[0.08] border border-amber-500/15 text-amber-400 flex items-center justify-center">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-white/30 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────────────── */}
        <section className="relative bg-[#0a0a0f] border-t border-white/[0.04] py-24 md:py-32 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/[0.04] rounded-full blur-[120px]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-up">
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
                {t("cta.title")}
              </h2>
              <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
                {t("cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button asChild size="lg" className="text-base px-10 h-14 bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0 shadow-lg shadow-amber-500/20">
                  <Link href="/book" className="gap-2">
                    {t("cta.button")}
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="bg-[#060609] border-t border-white/[0.04]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold text-white mb-3">
                Transfer<span className="text-amber-400">GR</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed max-w-xs">
                Premium transfer services across Greece. Airport pickups, city transfers, and custom tours.
              </p>
            </div>
            <div>
              <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-3">Services</h4>
              <ul className="space-y-2">
                <li><a href="#services" className="text-white/30 text-sm hover:text-amber-400 transition-colors duration-300">Airport Transfers</a></li>
                <li><a href="#services" className="text-white/30 text-sm hover:text-amber-400 transition-colors duration-300">City Transfers</a></li>
                <li><a href="#services" className="text-white/30 text-sm hover:text-amber-400 transition-colors duration-300">Port Transfers</a></li>
                <li><a href="#services" className="text-white/30 text-sm hover:text-amber-400 transition-colors duration-300">Custom Tours</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-3">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/30 text-sm">
                  <Phone className="size-3.5" /> +30 210 000 0000
                </li>
                <li className="flex items-center gap-2 text-white/30 text-sm">
                  <Clock className="size-3.5" /> 24/7 Available
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} TransferGR. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/book" className="text-xs text-white/20 hover:text-amber-400 transition-colors duration-300">
                {nav("bookNow")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
