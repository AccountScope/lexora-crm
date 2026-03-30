"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MatterFiltersProps {
  onFilterChange?: (filters: {
    search?: string;
    status?: string;
    practiceArea?: string;
    assignedTo?: string;
  }) => void;
}

export function MatterFilters({ onFilterChange }: MatterFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [practiceArea, setPracticeArea] = useState<string>("all");
  const [assignedTo, setAssignedTo] = useState<string>("all");

  const applyFilters = () => {
    onFilterChange?.({
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      practiceArea: practiceArea !== "all" ? practiceArea : undefined,
      assignedTo: assignedTo !== "all" ? assignedTo : undefined,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPracticeArea("all");
    setAssignedTo("all");
    onFilterChange?.({});
  };

  const activeFilterCount = [
    search,
    status !== "all" && status,
    practiceArea !== "all" && practiceArea,
    assignedTo !== "all" && assignedTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar + Quick Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search matters by name, number, or client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Auto-apply search as user types
              setTimeout(() => applyFilters(), 300);
            }}
            className="pl-10 pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => {
                setSearch("");
                applyFilters();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={status} onValueChange={(v) => {
          setStatus(v);
          setTimeout(() => applyFilters(), 0);
        }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Advanced Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your matter search
                </p>
              </div>

              <div className="space-y-3">
                {/* Practice Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Practice Area</label>
                  <Select value={practiceArea} onValueChange={setPracticeArea}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="litigation">Litigation</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="ip">Intellectual Property</SelectItem>
                      <SelectItem value="family">Family Law</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assigned To</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      <SelectItem value="me">Assigned to Me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="sarah">Sarah Mitchell</SelectItem>
                      <SelectItem value="james">James Wilson</SelectItem>
                      <SelectItem value="emma">Emma Thompson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
                <Button className="flex-1" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear {activeFilterCount}
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary">
              Search: "{search}"
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearch("");
                  applyFilters();
                }}
              />
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="secondary">
              Status: {status}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => {
                  setStatus("all");
                  applyFilters();
                }}
              />
            </Badge>
          )}
          {practiceArea !== "all" && (
            <Badge variant="secondary">
              Area: {practiceArea}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => {
                  setPracticeArea("all");
                  applyFilters();
                }}
              />
            </Badge>
          )}
          {assignedTo !== "all" && (
            <Badge variant="secondary">
              Assigned: {assignedTo}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => {
                  setAssignedTo("all");
                  applyFilters();
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
