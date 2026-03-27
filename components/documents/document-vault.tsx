"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDocuments, useDocumentUpload } from "@/lib/hooks/use-documents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UploadCloud } from "lucide-react";

interface Props {
  matterId?: string;
  clientId?: string;
}

export const DocumentVault = ({ matterId, clientId }: Props) => {
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<string | undefined>(undefined);
  const filters = useMemo(() => ({ matterId, clientId, search }), [matterId, clientId, search]);
  const { data, isFetching } = useDocuments(filters);
  const uploader = useDocumentUpload(filters);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "metadata",
          JSON.stringify({
            matterId,
            clientId,
            classification: "FIRM_CONFIDENTIAL",
            documentType: "EVIDENCE",
          })
        );
        await uploader.mutateAsync(formData);
      }
    },
    [clientId, matterId, uploader]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const documents = data?.data ?? [];
  const folders = useMemo(() => {
    const unique = Array.from(new Set(documents.map((doc) => doc.documentType ?? "General")));
    return unique;
  }, [documents]);
  const visibleDocuments = documents.filter((doc) => {
    if (!folder) return true;
    return (doc.documentType ?? "General") === folder;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Document vault</CardTitle>
          <p className="text-sm text-muted-foreground">Classified storage with chain-of-custody tracking.</p>
        </div>
        <Input
          placeholder="Search documents"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="lg:max-w-sm"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop files here or click to browse.
          </p>
          <Button variant="secondary" className="mt-3" disabled={uploader.isLoading}>
            {uploader.isLoading ? "Uploading..." : "Select files"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!folder ? "default" : "outline"}
            onClick={() => setFolder(undefined)}
          >
            All folders
          </Button>
          {folders.map((name) => (
            <Button
              key={name}
              size="sm"
              variant={folder === name ? "default" : "outline"}
              onClick={() => setFolder(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && (
              <TableRow>
                <TableCell colSpan={5}>Refreshing vault…</TableCell>
              </TableRow>
            )}
            {visibleDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{doc.classification}</Badge>
                </TableCell>
                <TableCell>{doc.status}</TableCell>
                <TableCell>
                  {doc.latestVersion
                    ? `${(doc.latestVersion.fileSizeBytes / 1024).toFixed(1)} KB`
                    : "—"}
                </TableCell>
                <TableCell>
                  {doc.latestVersion?.createdAt
                    ? format(new Date(doc.latestVersion.createdAt), "dd MMM yyyy")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
