"use client";

import { useState } from "react";
import Image from "next/image";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { TechTag } from "@/components/ui/TechTag";
import { Icon } from "@/components/ui/Icon";
import type { Project } from "@/lib/content";
import { track } from "@vercel/analytics";

interface ProjectCardProps {
  project: Project;
}

function ThumbnailPlaceholder({
  accentColor,
  label,
}: {
  accentColor: string;
  label: string;
}) {
  return (
    <div
      className="relative flex aspect-video w-full items-center justify-center border-b-[3px] border-ink"
      style={{
        backgroundColor: accentColor,
        backgroundImage:
          "repeating-linear-gradient(-45deg, rgba(21,21,21,0.12) 0 2px, transparent 2px 14px)",
      }}
    >
      <div className="flex flex-col items-center gap-2 rounded-md border-[3px] border-ink bg-cream px-4 py-3 shadow-[4px_4px_0_0_#151515]">
        <svg
          aria-hidden="true"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#151515"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
        <span className="font-mono text-[11px] font-bold text-ink">
          {label} · 16:9
        </span>
      </div>
    </div>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const accentColor = project.windowStyles.backgroundColor;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailLabel = `${project.filename.replace(/\.[^.]+$/, "")}.png`;

  return (
    <WindowChrome
      filename={project.filename}
      accentColor={accentColor}
      className={`relative h-full ${project.href ? "cursor-pointer btn-press" : ""}`}
      bodyClassName="flex flex-col transition-transform duration-100"
    >
      {project.thumbnail && !thumbnailFailed ? (
        <div className="relative aspect-video w-full overflow-hidden border-b-[3px] border-ink">
          <Image
            src={project.thumbnail}
            alt={`${project.title} thumbnail`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            onError={() => setThumbnailFailed(true)}
          />
        </div>
      ) : (
        <ThumbnailPlaceholder accentColor={accentColor} label={thumbnailLabel} />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold leading-tight text-ink md:text-2xl">
            {project.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => {
                  track(`${project.id}_card_clicked`);
                }}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </h3>
          <TechTag
            label={project.year}
            accentColor={accentColor}
            className="shrink-0"
          />
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-ink/80">
          {project.description}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1 md:gap-2">
          {project.skills.map((skill) => (
            <TechTag key={skill} label={skill} accentColor={accentColor} />
          ))}
        </div>
      </div>
      {project.links.length > 0 && (
        <div className="flex items-center gap-2 border-t-[3px] border-ink px-4 py-3 md:px-5">
          {project.links.map((link) => (
            <a
              key={`${link.type}-${link.link}`}
              href={link.link || undefined}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={link.type}
              onClick={() => {
                track(`${project.id}_${link.type}_clicked`);
              }}
              className="relative z-10 flex size-9 items-center justify-center rounded-md border-2 border-ink bg-cream shadow-[3px_3px_0_0_#151515] transition-transform duration-100 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none md:size-10"
            >
              <Icon
                name={link.icon}
                size={18}
                alt={link.type}
                color="#000000"
              />
            </a>
          ))}
        </div>
      )}
    </WindowChrome>
  );
}
