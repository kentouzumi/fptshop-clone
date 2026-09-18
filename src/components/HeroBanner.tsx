"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface BannerData {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
}

export default function HeroBanner({ banners }: { banners: BannerData[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const current = banners[index];
  if (!current) return null;

  const image = (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm sm:aspect-[3/1]">
      <Image
        src={current.imageUrl}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1152px"
        className="object-cover"
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-8">
      {current.linkUrl ? <Link href={current.linkUrl}>{image}</Link> : image}

      {banners.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-accent" : "w-2 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
