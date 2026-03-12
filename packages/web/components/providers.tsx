"use client";

import { SessionProvider } from "next-auth/react";
import { AbstractIntlMessages,NextIntlClientProvider } from "next-intl";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

import { DialogProvider } from "@/components/dialog-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type Props = {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
};

export const Providers = ({ children, messages, locale }: Props) => {
  return (
    <SessionProvider>
      <NextThemesProvider
        {...{ attribute: "class", defaultTheme: "system", enableSystem: true, disableTransitionOnChange: true } as ThemeProviderProps}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <DialogProvider />
          <Toaster />
        </NextIntlClientProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
};
