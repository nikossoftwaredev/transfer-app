"use client";

import { AlertCircle, ArrowLeft, Loader2, Lock,Phone } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/lib/i18n/navigation";
import { Link } from "@/lib/i18n/navigation";

interface DriverLoginFormProps {
  translations: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    signInButton: string;
    backLink: string;
    errorInvalid: string;
    errorGeneric: string;
  };
}

export const DriverLoginForm = ({ translations: t }: DriverLoginFormProps) => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullPhone = `+30${phone.replace(/\s/g, "")}`;
      const result = await signIn("driver-login", {
        phone: fullPhone,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError(t.errorInvalid);
      } else if (result?.ok) {
        router.push("/driver");
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="text-2xl font-bold tracking-tight">
          Transfer<span className="text-primary">GR</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="size-3.5" />
              {t.phoneLabel}
            </Label>
            <div className="flex gap-2">
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                +30
              </div>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <Lock className="size-3.5" />
              {t.pinLabel}
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder={t.pinPlaceholder}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={loading || !phone || pin.length < 4}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t.signInButton
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <Link href="/auth/signin">
            <ArrowLeft className="size-3.5" />
            {t.backLink}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
