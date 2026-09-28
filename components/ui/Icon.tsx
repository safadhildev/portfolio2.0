import Image from "next/image";
import { iconSources } from "@/components/ui/icon-sources";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
  color?: string;
}

function hasStroke(svg: string) {
  return /stroke="(?!none\b)/.test(svg);
}

function withStrokeColor(svg: string, size: number, color: string) {
  const stroked = svg.replace(
    /stroke="(?!none\b)[^"]*"/g,
    `stroke="${color}"`,
  );
  return stroked.replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
    const next = attrs
      .replace(/\swidth="[^"]*"/, "")
      .replace(/\sheight="[^"]*"/, "");
    return `<svg${next} width="${size}" height="${size}">`;
  });
}

export function Icon({
  name,
  size = 16,
  className,
  alt = "",
  color,
}: IconProps) {
  const source = iconSources[name];

  if (color && source && hasStroke(source)) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`inline-block shrink-0 ${className ?? ""}`}
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: withStrokeColor(source, size, color) }}
      />
    );
  }

  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}
