"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type ProgressiveImageProps = {
  alt: string;
  className: string;
  highQuality: number;
  immediateHighQuality?: boolean;
  lowQuality: number;
  rootMargin?: string;
  sizes: string;
  src: string;
  wrapperClassName?: string;
};

export const ProgressiveImage = ({
  alt,
  className,
  highQuality,
  immediateHighQuality = false,
  lowQuality,
  rootMargin = "320px 0px",
  sizes,
  src,
  wrapperClassName = "",
}: ProgressiveImageProps) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [shouldUpgrade, setShouldUpgrade] = useState(immediateHighQuality);
  const [highLoaded, setHighLoaded] = useState(immediateHighQuality);

  useEffect(() => {
    if (immediateHighQuality || shouldUpgrade) {
      return;
    }

    const element = shellRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldUpgrade(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [immediateHighQuality, rootMargin, shouldUpgrade]);

  return (
    <div ref={shellRef} className={`site-progressive-image-shell ${wrapperClassName}`.trim()}>
      <Image
        fill
        alt={alt}
        className={`${className} site-progressive-image-layer${highLoaded ? " is-hidden" : ""}`}
        quality={immediateHighQuality ? highQuality : lowQuality}
        sizes={sizes}
        src={src}
      />
      {shouldUpgrade && !immediateHighQuality ? (
        <Image
          fill
          alt={alt}
          className={`${className} site-progressive-image-layer site-progressive-image-layer-high${highLoaded ? " is-visible" : ""}`}
          onLoad={() => setHighLoaded(true)}
          quality={highQuality}
          sizes={sizes}
          src={src}
        />
      ) : null}
    </div>
  );
};