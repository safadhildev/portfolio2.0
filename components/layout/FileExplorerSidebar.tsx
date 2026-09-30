"use client";

import { SECTION_HREF } from "@/components/constants";
import { useActiveHash } from "@/components/useActiveHash";
import { Icon } from "@/components/ui/Icon";
import { WindowChrome } from "@/components/ui/WindowChrome";

const FILES = [
  { icon: "file-tsx", name: "home.tsx", href: SECTION_HREF.HOME },
  { icon: "file-json", name: "about.json", href: SECTION_HREF.ABOUT },
  { icon: "file-markdown", name: "experience.md", href: SECTION_HREF.EXPERIENCE },
  {
    icon: "file-markdown",
    name: "projects.md",
    href: SECTION_HREF.PROJECTS,
  },
  { icon: "file-shell", name: "contact.sh", href: SECTION_HREF.CONTACT },
];

interface FileExplorerSidebarProps {
  visibleHrefs: ReadonlySet<string>;
}

export function FileExplorerSidebar({ visibleHrefs }: FileExplorerSidebarProps) {
  const hash = useActiveHash();
  const files = FILES.filter((file) => visibleHrefs.has(file.href));

  return (
    <aside
      data-aos="slide-right"
      data-aos-delay={0}
      className={`hidden lg:z-10 lg:fixed lg:top-[85px] lg:bottom-[70px] lg:left-5 lg:block lg:w-[250px]`}
    >
      <WindowChrome
        filename="EXPLORER"
        accentColor="#FFD84D"
        className="h-full"
        bodyClassName="flex h-full flex-col p-[18px]"
      >
        <div className="flex items-center justify-between pb-[15px]">
          <span className="font-mono text-[13px] font-bold text-ink">
            SAF-PORTFOLIO
          </span>
          <Icon name="folder-chevron" size={14} />
        </div>
        <nav className="flex flex-1 flex-col gap-[10px]">
          {files.map((file) => {
            const isActive = hash === file.href;

            return (
              <a
                key={file.name}
                href={file.href}
                className={`flex h-[31px] cursor-pointer items-center gap-2 px-2 text-[13px] font-mono ${
                  isActive ? "bg-mint" : "bg-cream hover:bg-[#f0ede0]"
                }`}
              >
                <Icon name={file.icon} size={16} />
                <span className="text-ink">{file.name}</span>
              </a>
            );
          })}
        </nav>
        <div className="my-[15px] h-0.5 w-full bg-ink" />
        <p className="font-mono text-xs text-muted">⌘ main • portfolio-v2</p>
      </WindowChrome>
    </aside>
  );
}
