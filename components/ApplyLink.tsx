import { CONTACT } from "@/lib/site";

/**
 * Links to Russell's secure ALCOVA HomeHub application (external), opening in a
 * new tab so the user keeps the site open. Used for every "Get pre-qualified"
 * style CTA. Pass button styling via className.
 */
export function ApplyLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={CONTACT.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
