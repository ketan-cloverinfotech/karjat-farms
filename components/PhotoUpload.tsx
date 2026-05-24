"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function PhotoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const arr = Array.from(files);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of arr) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/owner/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          break;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function addManualUrl() {
    const u = manualUrl.trim();
    if (!u) return;
    try {
      new URL(u);
    } catch {
      setError("Invalid URL.");
      return;
    }
    onChange([...value, u]);
    setManualUrl("");
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-green-600 bg-green-50" : "border-stone-300 bg-stone-50 hover:bg-stone-100"
        }`}
      >
        <p className="text-sm text-stone-600">
          {uploading ? "Uploading…" : "Drag & drop photos here, or click to browse"}
        </p>
        <p className="text-xs text-stone-500 mt-1">JPG, PNG, WebP, GIF · up to 5 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="…or paste an image URL"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          className="input flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManualUrl();
            }
          }}
        />
        <button type="button" onClick={addManualUrl} className="btn-outline">
          Add URL
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group rounded-md overflow-hidden border border-stone-200 bg-stone-50">
              <div className="relative aspect-[4/3]">
                <Image src={url} alt="" fill sizes="200px" className="object-cover" unoptimized />
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-green-700 text-white text-[10px] font-medium rounded px-1.5 py-0.5">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="bg-white/90 text-stone-800 rounded px-1.5 text-xs disabled:opacity-30"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="bg-white/90 text-stone-800 rounded px-1.5 text-xs disabled:opacity-30"
                    title="Move right"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="bg-red-600 text-white rounded px-1.5 text-xs"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
