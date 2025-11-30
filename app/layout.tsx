import type { Metadata } from "next";
import { Poppins, Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOS Emocional 24h - Seu escudo contra decisões que você vai se arrepender",
  description:
    "Intervenção emocional com IA 24h por dia. Evite mensagens impulsivas, analise conversas e identifique red flags. Método Thiago Lins no seu bolso.",
  keywords: [
    "relacionamentos",
    "autoestima",
    "intervenção emocional",
    "thiago lins",
    "red flags",
    "ghosting",
    "manipulação emocional",
    "análise de conversa",
  ],
  authors: [{ name: "Thiago Lins" }],
  creator: "Thiago Lins",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://sosemocional.com",
    title: "SOS Emocional 24h by Thiago Lins",
    description:
      "Seu escudo contra decisões que você vai se arrepender. Intervenção emocional com IA 24h.",
    siteName: "SOS Emocional 24h",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOS Emocional 24h by Thiago Lins",
    description:
      "Seu escudo contra decisões que você vai se arrepender. Intervenção emocional com IA 24h.",
    creator: "@tl.marques",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" className={`${poppins.variable} ${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
        <body className="font-body antialiased bg-bg-base text-text-primary transition-colors duration-300">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster
              position="top-center"
              expand={true}
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast: 'bg-bg-secondary border-border-default text-text-primary',
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
