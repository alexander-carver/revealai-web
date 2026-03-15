"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchScreenProps {
  onSearch: (name: string) => void;
}

/**
 * Search Screen - Simple name input screen
 *
 * Features:
 * - Clean centered layout with app title
 * - Search input with icon
 * - Submit button appears when text is entered
 */
export function SearchScreen({ onSearch }: SearchScreenProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 bg-[#f8f8f8]">
      {/* Logo/Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-12 tracking-tight">
        Reveal AI
      </h1>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter full name to search"
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-lg border-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            autoFocus
          />
        </div>
        {searchValue.trim() && (
          <button
            type="submit"
            className="w-full mt-4 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        )}
      </form>
    </div>
  );
}
