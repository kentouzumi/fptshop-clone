"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  basePrice: number;
}

export default function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok || requestId !== requestIdRef.current) return;
        const data: Suggestion[] = await res.json();
        if (requestId !== requestIdRef.current) return;
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // bỏ qua lỗi mạng tạm thời, người dùng vẫn có thể bấm Enter để search bình thường
      }
    }, 250);
  }

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToProduct(suggestions[activeIndex].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
      </svg>
      <input
        type="text"
        name="search"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        placeholder="Tìm kiếm sản phẩm..."
        className="w-full rounded-l-full border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToProduct(s.slug)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                i === activeIndex ? "bg-zinc-100" : ""
              }`}
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt={s.name} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-100" />
              )}
              <span className="flex-1 truncate">{s.name}</span>
              <span className="shrink-0 text-xs font-medium text-accent">
                {s.basePrice.toLocaleString("vi-VN")}đ
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
