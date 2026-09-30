import { track } from "@vercel/analytics";
import { Icon } from "@/components/ui/Icon";
import { RESUME_ROUTE } from "@/lib/resume";

interface ResumeButtonProps {
  className?: string;
}

/**
 * Opens the resume PDF in a new tab via the counting /resume route.
 * Plain <a> on purpose: next/link would prefetch and the route counts opens.
 */
export function ResumeButton({ className = "" }: ResumeButtonProps) {
  return (
    <a
      href={RESUME_ROUTE}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => {
        track("resume_button_clicked");
      }}
      className={`buttonBounceAnim btn-press inline-flex h-[42px] min-w-[120px] items-center justify-center gap-[5px] rounded-md border-2 border-ink bg-white px-4 font-tag-mono text-xs font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:min-w-[250px] md:text-base ${className}`}
    >
      My Resume
      <Icon name="external-link" color="#151515" size={18} alt="" />
      <span className="sr-only">(PDF, opens in a new tab)</span>
    </a>
  );
}
