// import "./globals.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Festival 2K25",
    default: "Festival 2K25 - Arts & Sports Festival",
  },
  description:
    "Join Festival 2K25 Arts & Sports Festival with 135 talented students competing across 200+ programs in three dynamic teams: Sumud, Aqsa, and Inthifada.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      poppins: ['Poppins', 'sans-serif'],
                    },
                    animation: {
                      'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                      'shimmer': 'shimmer 2s ease-in-out infinite',
                    },
                    keyframes: {
                      fadeInUp: {
                        '0%': { opacity: '0', transform: 'translateY(30px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' },
                      },
                      shimmer: {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' },
                      },
                    },
                  }
                }
              }
            `,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${poppins.variable} font-poppins`}>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
