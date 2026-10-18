"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Detail</h1>
      <Card>
        <CardHeader>
          <CardTitle>Job ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted">Job tracking coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}