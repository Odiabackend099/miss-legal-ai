// Documents Page for MISS Legal AI
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import DocumentGenerator from '@/components/documents/DocumentGenerator';

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'review' | 'final' | 'signed';
  createdAt: string;
  updatedAt: string;
  confidence?: number;
}

const DocumentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('library');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock documents data
  useEffect(() => {
    // In a real app, this would fetch from the API
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: 'Tenancy Agreement - Lagos Property',
        type: 'tenancy_agreement',
        status: 'final',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:45:00Z',
        confidence: 0.95,
      },
      {
        id: '2',
        title: 'Affidavit of Identity',
        type: 'affidavit',
        status: 'draft',
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
        confidence: 0.87,
      },
      {
        id: '3',
        title: 'Power of Attorney - Business Management',
        type: 'power_of_attorney',
        status: 'review',
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T16:30:00Z',
        confidence: 0.92,
      },
    ];
    setDocuments(mockDocuments);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'final':
        return 'bg-green-100 text-green-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'tenancy_agreement':
        return 'Tenancy Agreement';
      case 'affidavit':
        return 'Affidavit';
      case 'power_of_attorney':
        return 'Power of Attorney';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getDocumentTypeLabel(doc.type).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'tenancy_agreement', label: 'Tenancy Agreements' },
    { value: 'affidavit', label: 'Affidavits' },
    { value: 'power_of_attorney', label: 'Power of Attorney' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Legal Documents</h1>
          <p className="text-gray-300">Generate, manage, and download your legal documents with AI assistance</p>
        </div>
        
        <Button 
          className="glow-button"
          onClick={() => setActiveTab('create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Document
        </Button>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="library" className="flex items-center gap-2 text-white data-[state=active]:text-purple-900">
              <FileText className="h-4 w-4" />
              Document Library
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2 text-white data-[state=active]:text-purple-900">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          {/* Document Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {documentTypes.map((type) => (
                        <option key={type.value} value={type.value} className="bg-gray-800 text-white">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Grid */}
            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((document) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="glass-card hover:glow transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2 text-white">
                              {document.title}
                            </CardTitle>
                            <CardDescription className="mt-1 text-gray-300">
                              {getDocumentTypeLabel(document.type)}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Status and Confidence */}
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(document.status)}>
                            {document.status}
                          </Badge>
                          {document.confidence && (
                            <span className="text-sm text-gray-400">
                              {Math.round(document.confidence * 100)}% confident
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Created {formatDate(document.createdAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Updated {formatDate(document.updatedAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white hover:bg-white/10">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white hover:bg-white/10">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">No documents found</h3>
                      <p className="text-gray-400">
                        {searchQuery || filterType !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Create your first legal document to get started.'
                        }
                      </p>
                    </div>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="glow-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            {documents.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">Document Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{documents.length}</div>
                      <div className="text-sm text-gray-400">Total Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {documents.filter(d => d.status === 'final' || d.status === 'signed').length}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {documents.filter(d => d.status === 'draft' || d.status === 'review').length}
                      </div>
                      <div className="text-sm text-gray-400">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(documents.reduce((sum, d) => sum + (d.confidence || 0), 0) / documents.length * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">Avg. Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create Document Tab */}
          <TabsContent value="create">
            <Card className="glass-card">
              <CardContent className="p-0">
                <DocumentGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DocumentsPage;