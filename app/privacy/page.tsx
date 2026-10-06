import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} uses contact information, analytics, cookies, and advertising services.`,
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-4 text-ink-soft">
        This policy describes how {SITE.name} handles information when you visit this website.
        For questions, contact <a className="text-accent underline" href={CONTACT.emailHref}>{CONTACT.email}</a>.
      </p>

      <div className="article-body mt-10">
        <h2>Information you provide</h2>
        <p>
          This site links to our phone number, email address, and ALCOVA Mortgage&apos;s secure
          application. If you contact us, we use the information you provide to respond to your
          inquiry. Mortgage application information is submitted on ALCOVA&apos;s separate website;
          review its privacy practices before submitting an application there. Please do not send
          sensitive financial information through ordinary email.
        </p>

        <h2>Analytics and site operation</h2>
        <p>
          We use Google Analytics and Ahrefs Web Analytics to understand site traffic and improve
          the website. These services may receive information such as your IP address, browser,
          device, pages visited, and interactions. They may use cookies or similar technologies.
          Our hosting provider may also process technical request data for security and delivery.
          You can manage cookies in your browser. For information about Google&apos;s use of data on
          partner sites, see <a href="https://policies.google.com/technologies/partner-sites">Google&apos;s explanation</a>.
        </p>

        <h2>Advertising</h2>
        <p>
          We plan to use Google AdSense to display ads. When advertising is enabled, third-party
          vendors, including Google, may use cookies to serve ads based on your visits to this and
          other websites. Google&apos;s advertising cookies enable Google and its partners to show
          ads based on those visits. Other ad technology providers may also participate in ad
          delivery. See Google&apos;s <a href="https://support.google.com/adsense/answer/9012903">ad technology partner information</a>
          {" "}for provider details and links to their privacy practices. You can manage personalized ads in <a href="https://myadcenter.google.com/">Google&apos;s Ad Center</a>
          {" "}and opt out of some other vendors at <a href="https://optout.aboutads.info/">YourAdChoices</a>.
          Learn more about <a href="https://support.google.com/adsense/answer/7549925">AdSense cookies</a>.
        </p>

        <h2>Embedded media and outside sites</h2>
        <p>
          Video thumbnails may load from YouTube, and playing a video loads a YouTube embed. Those
          services may receive technical information and use their own cookies. Links to ALCOVA,
          social media, and other websites take you to services with their own privacy practices.
        </p>

        <h2>Your choices and questions</h2>
        <p>
          Browser settings can block or delete cookies, though some features may work differently.
          Where required, an advertising consent message will provide additional choices before
          ads are served. For questions about information you have sent directly to us, contact
          <a href={CONTACT.emailHref}> {CONTACT.email}</a>. You can also visit our <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
