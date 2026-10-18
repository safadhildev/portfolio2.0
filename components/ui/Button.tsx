import { track } from "@vercel/analytics";
import { Icon } from "@/components/ui/Icon";

interface ButtonProps {
  className?: string;
  text: string;
  icon?: string;
  href: string;
}


export function Button({ className = "", text, icon, href }: ButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => {
        track("button_clicked");
      }}
      className={`buttonBounceAnim btn-press inline-flex h-[42px] min-w-[120px] items-center justify-center gap-[5px] rounded-md border-2 border-ink bg-white px-4 font-tag-mono text-xs font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:min-w-[250px] md:text-base ${className}`}
    >
      {text}
      {icon && <Icon name={icon} color="#151515" size={18} alt="" />}
      <span className="sr-only">{text}</span>
    </a>
  );
}
