import { HOME_FAQ } from "@/lib/faq-content";
import { MARKETING_CONTENT_DATE_MODIFIED } from "@/lib/marketing-metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    name: "AORTrack",
    legalName: "GetNorthPath",
    url: getSiteUrl(),
    description:
      "Free Canada PR milestone tracker with AOR-month cohorts and community timelines from GetNorthPath.",
    parentOrganization: {
      "@type": "Organization",
      name: "GetNorthPath",
      url: "https://www.getnorthpath.com",
    },
    sameAs: ["https://www.getnorthpath.com", "https://www.getnorthpath.com/tools/pr-tracker"],
  };
}

export function webSiteJsonLd() {
  return {
    "@type": "WebSite",
    name: "AORTrack",
    url: getSiteUrl(),
    description:
      "Track every PR milestone from AOR to PR card, join your AOR-month cohort, and browse real community timelines.",
    publisher: { "@type": "Organization", name: "AORTrack", url: getSiteUrl() },
    inLanguage: "en-CA",
    dateModified: MARKETING_CONTENT_DATE_MODIFIED,
  };
}

export function faqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }> = HOME_FAQ,
) {
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq"),
    url: absoluteUrl("/#faq"),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function homeJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), webSiteJsonLd(), faqPageJsonLd()],
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
