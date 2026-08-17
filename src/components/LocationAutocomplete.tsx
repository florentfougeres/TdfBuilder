import { useEffect, useRef, useState } from "react";
import { searchPlaces, type GeocodeResult } from "../services/geocoding";

interface Props {
  value: string;
  placeholder: string;
  onTextChange: (text: string) => void;
  onSelect: (place: GeocodeResult) => void;
}

export default function LocationAutocomplete({ value, placeholder, onTextChange, onSelect }: Props) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await searchPlaces(q);
      if (!cancelled) {
        setResults(found);
        setHighlighted(0);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (r: GeocodeResult) => {
    onSelect(r);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="location-autocomplete" ref={containerRef} onClick={(e) => e.stopPropagation()}>
      <input
        className="stage-name-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            select(results[highlighted]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && results.length > 0 && (
        <ul className="location-suggestions">
          {results.map((r, i) => (
            <li
              key={`${r.lat},${r.lng}`}
              className={i === highlighted ? "highlighted" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                select(r);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
