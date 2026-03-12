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
} from "lucide-react";
import { ThemeSwitcher } from "@/components/examples/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/examples/language-switcher";
import { LoginButton } from "@/components/examples/login-button";

const Home = async ({ params }: BasePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const nav = await getTranslations("Nav");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Transfer<span className="text-primary">GR</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              {nav("howItWorks")}
            </a>
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
              {nav("services")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <LoginButton />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/book" className="gap-1.5">
                {nav("bookNow")}
                <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="container mx-auto px-4 py-24 md:py-36 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                {t("hero.title")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="text-base px-8 h-12">
                  <Link href="/book" className="gap-2">
                    {t("hero.cta")}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              {t("howItWorks.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
                { step: "2", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
                { step: "3", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-4">
                  <div className="mx-auto size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              {t("services.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Plane, title: t("services.airport"), desc: t("services.airportDesc") },
                { icon: Building2, title: t("services.city"), desc: t("services.cityDesc") },
                { icon: Ship, title: t("services.port"), desc: t("services.portDesc") },
                { icon: Map, title: t("services.tours"), desc: t("services.toursDesc") },
              ].map((service) => (
                <div
                  key={service.title}
                  className="group rounded-xl border bg-card p-6 space-y-4 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <service.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why TransferGR */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              {t("why.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {[
                { icon: BadgeDollarSign, title: t("why.price"), desc: t("why.priceDesc") },
                { icon: UserCheck, title: t("why.drivers"), desc: t("why.driversDesc") },
                { icon: MapPin, title: t("why.tracking"), desc: t("why.trackingDesc") },
                { icon: Headphones, title: t("why.support"), desc: t("why.supportDesc") },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="shrink-0 size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">{t("cta.title")}</h2>
              <p className="text-lg text-muted-foreground">{t("cta.subtitle")}</p>
              <Button asChild size="lg" className="text-base px-8 h-12">
                <Link href="/book" className="gap-2">
                  {t("cta.button")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TransferGR. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/book" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
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
