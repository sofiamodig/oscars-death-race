import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";

export type AllTimeTab = "years" | "nominations" | "suggestion";

export const AllTimeTabLayout = ({ tab, children }: { tab: AllTimeTab; children: ReactNode }) => (
  <>
    <Head>
      <title>Oscars death race</title>
      <meta name="description" content="Oscars death race" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    </Head>
    <main className="mb-20">
      <nav className="mb-6 flex gap-2 border-b border-neutral-300 dark:border-neutral-700" role="tablist" aria-label="All-time views">
        {(["years", "nominations", "suggestion"] as const).map((tabName) => (
          <Link
            key={tabName}
            href={`/all-time/${tabName}`}
            role="tab"
            aria-selected={tab === tabName}
            className={`border-b-2 px-3 py-2 font-semibold capitalize ${tab === tabName ? "border-[#b39930] text-[#897b2c] dark:border-[#968242] dark:text-[#968242]" : "border-transparent bg-transparent text-neutral-600 hover:text-[#897b2c] dark:text-neutral-300 dark:hover:text-[#605227]"}`}
          >
            {tabName === "suggestion" ? "Suggestion" : tabName}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  </>
);
