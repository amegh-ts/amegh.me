// One entry per page. The layout builds each page's <head>, nav, breadcrumbs,
// JSON-LD and the sitemap from this file, so titles, dates and the person
// details are written once.
//
// When you change a page's content, update its `modified` date (ISO 8601 with
// time zone). It feeds dateModified, article:modified_time and sitemap lastmod.

export const SITE = "https://amegh.me";

export const person = {
  "@type": "Person",
  "@id": `${SITE}/#person`,
  name: "Amegh",
  alternateName: ["Amegh T S", "Amegh TS", "ameghts", "amegh-ts"],
  url: `${SITE}/`,
  image: `${SITE}/amegh-ts.webp`,
  jobTitle: "Full-Stack Developer",
  description:
    "Full-stack developer in Kozhikode, Kerala, building booking, payment and admin systems with Next.js and Node.js.",
  worksFor: { "@type": "Organization", name: "Oppam", url: "https://oppam.com" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "University of Calicut" },
  address: { "@type": "PostalAddress", addressLocality: "Kozhikode", addressRegion: "Kerala", addressCountry: "IN" },
  email: "mailto:hey@amegh.me",
  knowsAbout: ["Next.js", "React", "TypeScript", "Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Stripe", "Razorpay", "n8n"],
  sameAs: [
    "https://www.linkedin.com/in/amegh-ts/",
    "https://github.com/amegh-ts",
    "https://x.com/amegh_t",
    "https://www.instagram.com/_._amegh/",
    "https://peerlist.io/ameghts",
    "https://dev.to/ameghts",
    "https://hashnode.com/@ameghts",
  ],
};

const CREATED = "2026-11-14T15:12:45+05:30";
const UPDATED = "2026-11-24T18:00:00+05:30";

export const pages = {
  "/": {
    kind: "home",
    title: "Amegh | Full-Stack Developer in Kerala – Amegh T S",
    description:
      "Amegh T S is a full-stack developer in Kozhikode, Kerala, building booking, payment and admin systems with Next.js, Node.js and PostgreSQL.",
    ogTitle: "Amegh – Full-Stack Developer",
    ogDescription:
      "I build products end-to-end, from database to interface. Booking, payment and admin systems with Next.js, Node.js and PostgreSQL.",
    twitterDescription: "I build products end-to-end, from database to interface.",
    modified: UPDATED,
  },
  "/about": {
    kind: "about",
    title: "About Amegh – Full-Stack Developer, Kozhikode",
    description:
      "About Amegh (Amegh T S), a full-stack developer in Kozhikode, Kerala: how he works, his role at Oppam, experience since 2023, education, tools and profiles.",
    crumbs: [["Home", "/"], ["About"]],
    created: CREATED,
    modified: UPDATED,
  },
  "/work": {
    kind: "work",
    title: "Work and case studies – Amegh",
    description:
      "Case studies by Amegh T S, a full-stack developer in Kozhikode, Kerala: Oppam payments and admin, Club Travalet, Finance App and UniTide.",
    crumbs: [["Home", "/"], ["Work"]],
    modified: UPDATED,
  },
  "/work/oppam": {
    kind: "case",
    name: "Oppam",
    title: "Oppam payments and admin – case study by Amegh",
    description:
      "Case study by Amegh: payments, pricing, HR modules and admin work on Oppam, an online counselling platform, with Stripe, Razorpay, Next.js and Node.js.",
    crumbs: [["Home", "/"], ["Work", "/work"], ["Oppam"]],
    created: CREATED,
    modified: UPDATED,
  },
  "/work/club-travalet": {
    kind: "case",
    name: "Club Travalet",
    title: "Club Travalet travel portal – Amegh",
    description:
      "Case study by Amegh: building the Next.js frontend and SEO of Club Travalet, a travel booking portal for tour packages, memberships and holidays.",
    crumbs: [["Home", "/"], ["Work", "/work"], ["Club Travalet"]],
    created: CREATED,
    modified: UPDATED,
  },
  "/work/finance-app": {
    kind: "case",
    name: "Finance App",
    title: "Finance App with bank-SMS import – Amegh",
    description:
      "How Amegh built an expense tracker with Next.js 15, MongoDB and a Flutter Android companion that turns bank SMS messages into transactions through n8n.",
    crumbs: [["Home", "/"], ["Work", "/work"], ["Finance App"]],
    created: CREATED,
    modified: UPDATED,
  },
  "/work/unitide": {
    kind: "case",
    name: "UniTide",
    title: "UniTide task management – Amegh",
    description:
      "Case study by Amegh: UniTide, a team workspace for projects, tasks, chat, calendar and timesheets, built with Next.js 16, TanStack Query and MongoDB.",
    crumbs: [["Home", "/"], ["Work", "/work"], ["UniTide"]],
    created: CREATED,
    modified: UPDATED,
  },
  "/404": {
    kind: "404",
    title: "Page not found – Amegh",
    description: "This page doesn't exist on amegh.me.",
    crumbs: [["Home", "/"], ["Not found"]],
    noindex: true,
    modified: UPDATED,
  },
};
