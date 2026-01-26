import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { documentService } from "../../services/documentService";
import { Document } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent" | "shared">(
    "all",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = React.useCallback(async () => {
    if (user) {
      try {
        const data = await documentService.getDocuments();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const newDoc = await documentService.uploadDocument({
          name: file.name,
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          content: base64,
          shared: activeFilter === "shared",
        });
        setDocuments((prev) => [newDoc, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Upload failed. please try again.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleToggleShare = async (id: string) => {
    try {
      const updated = await documentService.toggleShare(id);
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? updated : doc)),
      );
      toast.success(
        updated.shared ? "Document shared" : "Document sharing disabled",
      );
    } catch (error) {
      console.error("Share toggle failed:", error);
    }
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = doc.content;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "shared" && doc.shared) ||
      (activeFilter === "recent" &&
        new Date(doc.createdAt) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days

    return matchesSearch && matchesFilter;
  });

  const usedStorage = documents.reduce((acc, doc) => {
    const size = parseFloat(doc.size);
    return isNaN(size) ? acc : acc + size;
  }, 0);
  const totalStorage = 100; // 100 MB for demo

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">
            Manage your startup's important files and materials
          </p>
        </div>

        <div>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">
                  {usedStorage.toFixed(1)} MB
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((usedStorage / totalStorage) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limit</span>
                <span className="font-medium text-gray-900">
                  {totalStorage} MB
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Quick Access
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeFilter === "all"
                      ? "text-primary-700 bg-primary-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Files
                </button>
                <button
                  onClick={() => setActiveFilter("recent")}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeFilter === "recent"
                      ? "text-primary-700 bg-primary-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Recent Files
                </button>
                <button
                  onClick={() => setActiveFilter("shared")}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeFilter === "shared"
                      ? "text-primary-700 bg-primary-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Shared for Investors
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar */}
          <Card>
            <CardBody className="p-3">
              <Input
                placeholder="Search your documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                startAdornment={<Search size={18} className="text-gray-400" />}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-medium text-gray-900 capitalize">
                {activeFilter === "all" ? "All Files" : `${activeFilter} Files`}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Filter size={14} />}
                >
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="p-2.5 bg-primary-50 rounded-lg mr-4 group-hover:bg-primary-100 transition-colors">
                        <FileText size={24} className="text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          {doc.shared && (
                            <Badge variant="primary" size="sm" rounded>
                              Public
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="uppercase font-medium">
                            {doc.type}
                          </span>
                          <span>{doc.size}</span>
                          <span>
                            Uploaded{" "}
                            {format(parseISO(doc.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-primary-600"
                          aria-label="Download"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-2 ${doc.shared ? "text-primary-600" : "text-gray-400"} hover:text-primary-600`}
                          aria-label="Share"
                          onClick={() => handleToggleShare(doc.id)}
                          title={
                            doc.shared ? "Stop sharing" : "Share with investors"
                          }
                        >
                          <Share2 size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-error-600"
                          aria-label="Delete"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      No documents found
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Upload your pitch deck or business plan to get started.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      leftIcon={<Upload size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Now
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
