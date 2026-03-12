"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AddressInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onSelect: (address: string, lat: number, lng: number) => void;
}

export const AddressInput = ({
  label,
  value,
  placeholder,
  onSelect,
}: AddressInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onSelectRef = useRef(onSelect);
  const [inputValue, setInputValue] = useState(value);

  // Keep callback ref current without re-running the init effect
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "gr" },
        fields: ["formatted_address", "geometry", "name"],
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const address = place.name
        ? `${place.name}, ${place.formatted_address}`
        : place.formatted_address || "";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setInputValue(address);
      onSelectRef.current(address, lat, lng);
    });

    autocompleteRef.current = autocomplete;
  }, []);

  useEffect(() => {
    // If Google Maps is already loaded, init immediately
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    // Otherwise, poll until it's available (script loads async)
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        initAutocomplete();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [initAutocomplete]);

  return (
    <div>
      {label && (
        <label className="text-xs text-white/40 uppercase tracking-widest mb-1 block">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
      />
    </div>
  );
};
