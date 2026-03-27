"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Props = {
  onChange: (filters: { search?: string; status?: string }) => void;
};

const statuses = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Pending", value: "PENDING" },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Closed", value: "CLOSED" },
];

export const CaseFilters = ({ onChange }: Props) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const propagate = (next: { search?: string; status?: string }) => {
    onChange({ search, status, ...next });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Input
        className="md:max-w-sm"
        placeholder="Search matters or clients"
        value={search}
        onChange={(event) => {
          const value = event.target.value;
          setSearch(value);
          propagate({ search: value });
        }}
      />
      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value);
          propagate({ status: value || undefined });
        }}
      >
        <TabsList>
          {statuses.map((option) => (
            <TabsTrigger value={option.value} key={option.label}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button
        variant="outline"
        onClick={() => {
          setSearch("");
          setStatus("");
          onChange({});
        }}
      >
        Reset
      </Button>
    </div>
  );
};
