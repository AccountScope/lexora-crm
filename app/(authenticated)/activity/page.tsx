"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ActivityFeed } from "@/components/activity/activity-feed";

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const filteredActivities = activities?.filter((activity: any) =>
    search ? activity.description.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">Recent system activity and updates</p>
      </div>

      <div className="flex gap-4">
        <div className="w-64">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="case">Cases</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="time">Time Entries</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search activities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActivities && filteredActivities.length > 0 ? (
        <ActivityFeed activities={filteredActivities} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No activities found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
