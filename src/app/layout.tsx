import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LaunchPilot — Turn Rough Product Ideas into Launch Plans",
  description: "AI product-launch copilot for solo founders and product teams. Turn PRDs, briefs, and ideas into checklist, messaging, and release packs instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafafa] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-[#fafafa]/80 dark:bg-[#0b0f19]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-tighter">
                LP
              </div>
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                LaunchPilot
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 uppercase">
                Hackathon Pack
              </span>
            </div>
            
            <nav className="flex items-center space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
              <div className="h-3 w-px bg-gray-200 dark:bg-gray-800"></div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                v1.0.0
              </span>
              <div className="h-3 w-px bg-gray-200 dark:bg-gray-800"></div>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        {/* Core Layout Main Section */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-6 bg-white dark:bg-[#0b0f19]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>© {new Date().getFullYear()} LaunchPilot.</span>
              <span>•</span>
              <span>Built for solo founders, product managers, and startup teams.</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Instrumented with <span className="font-semibold text-indigo-500 dark:text-indigo-400">Novus.ai</span>
            </div>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
