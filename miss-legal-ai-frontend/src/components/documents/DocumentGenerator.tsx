// Document Generation Interface Component for MISS Legal AI
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Mic, 
  MicOff, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Volume2,
  FileCheck,
  Languages,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentData {
  // Common fields
  documentType?: string;
  language?: string;
  state?: string;
  
  // Tenancy Agreement fields
  landlordName?: string;
  tenantName?: string;
  propertyAddress?: string;
  rentAmount?: number;
  duration?: number;
  startDate?: string;
  depositAmount?: number;
  
  // Affidavit fields
  deponentName?: string;
  facts?: string;
  purpose?: string;
  location?: string;
  swornDate?: string;
  
  // Power of Attorney fields
  grantorName?: string;
  attorneyName?: string;
  powers?: string;
  
  [key: string]: any;
}

interface DocumentGenerationProgress {
  stage: 'extracting' | 'validating' | 'generating' | 'formatting' | 'completed' | 'error';
  percentage: number;
  message: string;
}

interface ValidationResult {
  isCompliant: boolean;
  warnings: string[];
  missingRequirements: string[];
  recommendations: string[];
  complianceScore: number;
}

interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  status: string;
  confidence: number;
}

export default function DocumentGenerator() {
  const { toast } = useToast();
  
  // State management
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [selectedState, setSelectedState] = useState<string>('Lagos');
  const [activeTab, setActiveTab] = useState<string>('voice');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Document generation state
  const [extractedData, setExtractedData] = useState<DocumentData>({});
  const [generationProgress, setGenerationProgress] = useState<DocumentGenerationProgress | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Preview state
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data for manual entry
  const [formData, setFormData] = useState<DocumentData>({});
  
  // Clarification state
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  const documentTypes = [
    { value: 'tenancy_agreement', label: 'Tenancy Agreement', description: 'Residential or commercial property rental agreement' },
    { value: 'affidavit', label: 'Affidavit', description: 'Sworn statement of facts for legal purposes' },
    { value: 'power_of_attorney', label: 'Power of Attorney', description: 'Legal authority to act on behalf of another person' }
  ];

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'pidgin', label: 'Nigerian Pidgin' },
    { value: 'yoruba', label: 'Yoruba' },
    { value: 'hausa', label: 'Hausa' },
    { value: 'igbo', label: 'Igbo' }
  ];

  const nigerianStates = [
    'Lagos', 'Abuja', 'Kano', 'Rivers', 'Kaduna', 'Oyo', 'Edo', 'Delta', 'Anambra', 'Imo',
    'Abia', 'Enugu', 'Cross River', 'Akwa Ibom', 'Bayelsa', 'Benue', 'Borno', 'Ebonyi',
    'Ekiti', 'Gombe', 'Jigawa', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Ogun',
    'Ondo', 'Osun', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Adamawa', 'Bauchi'
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // Speech recognition available
    }
  }, []);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak clearly about your legal document requirements.",
      });
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);

      toast({
        title: "Recording Stopped",
        description: "Processing your voice input...",
      });

      // Simulate transcription (in real app, this would call speech-to-text API)
      setTimeout(() => {
        setTranscript("I want to create a tenancy agreement for my property at 123 Lagos Street. The tenant is John Doe and the rent is 500,000 naira per year.");
      }, 2000);
    }
  };

  // Extract data from voice transcript
  const extractFromVoice = async () => {
    if (!transcript || !selectedDocumentType) {
      toast({
        title: "Missing Information",
        description: "Please select document type and provide voice input.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      // Simulate API call to voice extraction endpoint
      const response = await fetch('/api/documents/voice-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocumentType,
          transcript,
          language: selectedLanguage,
          state: selectedState,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.data.extractedData);
        setValidationResult(result.data.validation);
        setClarificationQuestions(result.data.clarificationQuestions || []);

        toast({
          title: "Data Extracted",
          description: `Confidence: ${Math.round((result.data.confidence || 0) * 100)}%`,
        });
      } else {
        throw new Error(result.error?.message || 'Extraction failed');
      }
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract data from voice",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Generate document preview
  const generatePreview = async () => {
    const dataToUse = activeTab === 'voice' ? extractedData : formData;

    if (!selectedDocumentType || Object.keys(dataToUse).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide document data before previewing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/documents/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocumentType,
          data: dataToUse,
          language: selectedLanguage,
          state: selectedState,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPreviewContent(result.data.preview);
        setShowPreview(true);
      } else {
        throw new Error(result.error?.message || 'Preview generation failed');
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to generate preview",
        variant: "destructive",
      });
    }
  };

  // Generate final document
  const generateDocument = async () => {
    const dataToUse = activeTab === 'voice' ? extractedData : formData;

    if (!selectedDocumentType || Object.keys(dataToUse).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide document data before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      stage: 'extracting',
      percentage: 10,
      message: 'Starting document generation...',
    });

    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocumentType,
          extractedData: dataToUse,
          language: selectedLanguage,
          state: selectedState,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedDocument(result.data.document);
        setValidationResult(result.data.validationResults);
        setGenerationProgress({
          stage: 'completed',
          percentage: 100,
          message: 'Document generated successfully!',
        });

        toast({
          title: "Document Generated",
          description: `${result.data.document.title} created successfully.`,
        });
      } else {
        throw new Error(result.error?.message || 'Document generation failed');
      }
    } catch (error) {
      setGenerationProgress({
        stage: 'error',
        percentage: 0,
        message: error instanceof Error ? error.message : 'Generation failed',
      });

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Download document
  const downloadDocument = async (format: 'pdf' | 'word' = 'pdf') => {
    if (!generatedDocument) {
      toast({
        title: "No Document",
        description: "Please generate a document first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/documents/${generatedDocument.id}/download?format=${format}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedDocument.title}.${format === 'word' ? 'docx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: `${generatedDocument.title}.${format === 'word' ? 'docx' : 'pdf'} is downloading.`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Handle form input changes
  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Render document type specific form fields
  const renderFormFields = () => {
    switch (selectedDocumentType) {
      case 'tenancy_agreement':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landlordName">Landlord Name</Label>
              <Input
                id="landlordName"
                value={formData.landlordName || ''}
                onChange={(e) => handleFormDataChange('landlordName', e.target.value)}
                placeholder="Full name of landlord"
              />
            </div>
            <div>
              <Label htmlFor="tenantName">Tenant Name</Label>
              <Input
                id="tenantName"
                value={formData.tenantName || ''}
                onChange={(e) => handleFormDataChange('tenantName', e.target.value)}
                placeholder="Full name of tenant"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="propertyAddress">Property Address</Label>
              <Textarea
                id="propertyAddress"
                value={formData.propertyAddress || ''}
                onChange={(e) => handleFormDataChange('propertyAddress', e.target.value)}
                placeholder="Complete address of the property"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="rentAmount">Annual Rent (₦)</Label>
              <Input
                id="rentAmount"
                type="number"
                value={formData.rentAmount || ''}
                onChange={(e) => handleFormDataChange('rentAmount', parseFloat(e.target.value) || 0)}
                placeholder="Annual rent in Naira"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (months)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ''}
                onChange={(e) => handleFormDataChange('duration', parseInt(e.target.value) || 0)}
                placeholder="Tenancy duration"
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleFormDataChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="depositAmount">Security Deposit (₦)</Label>
              <Input
                id="depositAmount"
                type="number"
                value={formData.depositAmount || ''}
                onChange={(e) => handleFormDataChange('depositAmount', parseFloat(e.target.value) || 0)}
                placeholder="Security deposit amount"
              />
            </div>
          </div>
        );

      case 'affidavit':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deponentName">Deponent Name</Label>
              <Input
                id="deponentName"
                value={formData.deponentName || ''}
                onChange={(e) => handleFormDataChange('deponentName', e.target.value)}
                placeholder="Full name of person making affidavit"
              />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={formData.purpose || ''}
                onChange={(e) => handleFormDataChange('purpose', e.target.value)}
                placeholder="Purpose of affidavit"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="facts">Facts</Label>
              <Textarea
                id="facts"
                value={formData.facts || ''}
                onChange={(e) => handleFormDataChange('facts', e.target.value)}
                placeholder="Detailed facts being sworn to"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleFormDataChange('location', e.target.value)}
                placeholder="Where affidavit is being sworn"
              />
            </div>
            <div>
              <Label htmlFor="swornDate">Date</Label>
              <Input
                id="swornDate"
                type="date"
                value={formData.swornDate || ''}
                onChange={(e) => handleFormDataChange('swornDate', e.target.value)}
              />
            </div>
          </div>
        );

      case 'power_of_attorney':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grantorName">Grantor Name</Label>
              <Input
                id="grantorName"
                value={formData.grantorName || ''}
                onChange={(e) => handleFormDataChange('grantorName', e.target.value)}
                placeholder="Person granting the power"
              />
            </div>
            <div>
              <Label htmlFor="attorneyName">Attorney Name</Label>
              <Input
                id="attorneyName"
                value={formData.attorneyName || ''}
                onChange={(e) => handleFormDataChange('attorneyName', e.target.value)}
                placeholder="Person receiving the power"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="powers">Powers Granted</Label>
              <Textarea
                id="powers"
                value={formData.powers || ''}
                onChange={(e) => handleFormDataChange('powers', e.target.value)}
                placeholder="Specific powers being granted"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Select a document type to see input fields
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Legal Document Generator</h1>
        <p className="text-gray-600">Create professional Nigerian legal documents with AI assistance</p>
      </div>

      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Configuration
          </CardTitle>
          <CardDescription>
            Choose the type of legal document you want to create
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        {lang.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="state">Nigerian State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nigerianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {state}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Input Methods */}
      {selectedDocumentType && (
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>
              Provide document details using voice or manual entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Input
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-4">
                <div className="space-y-4">
                  {/* Voice Recording Controls */}
                  <div className="flex flex-col items-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-5 w-5" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-5 w-5" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </div>

                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-sm">Recording... Speak clearly about your document</span>
                      </div>
                    )}

                    {audioBlob && !isRecording && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Recording captured</span>
                      </div>
                    )}
                  </div>

                  {/* Transcript Display */}
                  {transcript && (
                    <div className="space-y-2">
                      <Label>Voice Transcript</Label>
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Your voice transcript will appear here..."
                        rows={4}
                        className="bg-gray-50"
                      />
                      <Button
                        onClick={extractFromVoice}
                        disabled={isExtracting || !transcript}
                        className="flex items-center gap-2"
                      >
                        {isExtracting ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin" />
                            Extracting Data...
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-4 w-4" />
                            Extract Document Data
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Extracted Data Display */}
                  {Object.keys(extractedData).length > 0 && (
                    <div className="space-y-2">
                      <Label>Extracted Information</Label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {Object.entries(extractedData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium text-gray-700">{key}:</span>
                              <span className="text-gray-900">{value?.toString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clarification Questions */}
                  {clarificationQuestions.length > 0 && (
                    <div className="space-y-4">
                      <Label>Please provide additional information:</Label>
                      {clarificationQuestions.map((question, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm">{question}</Label>
                          <Input
                            value={clarificationAnswers[question] || ''}
                            onChange={(e) => setClarificationAnswers(prev => ({
                              ...prev,
                              [question]: e.target.value
                            }))}
                            placeholder="Your answer..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                {renderFormFields()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Legal Validation
              <Badge variant={validationResult.isCompliant ? "default" : "destructive"}>
                {Math.round(validationResult.complianceScore * 100)}% Compliant
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.missingRequirements.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <strong>Missing Requirements:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.missingRequirements.map((req, index) => (
                        <li key={index} className="text-sm">{req}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.recommendations.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {validationResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Generation Progress */}
      {generationProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{generationProgress.message}</span>
                <span>{generationProgress.percentage}%</span>
              </div>
              <Progress value={generationProgress.percentage} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Actions */}
      {selectedDocumentType && (
        <Card>
          <CardHeader>
            <CardTitle>Document Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button
              onClick={generatePreview}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Document
            </Button>

            <Button
              onClick={generateDocument}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Document
                </>
              )}
            </Button>

            {generatedDocument && (
              <>
                <Button
                  onClick={() => downloadDocument('pdf')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>

                <Button
                  onClick={() => downloadDocument('word')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Word
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Modal/Panel */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Preview</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Document Info */}
      {generatedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Document Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-gray-600">{generatedDocument.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant="outline">{generatedDocument.status}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Confidence</Label>
                <p className="text-sm text-gray-600">
                  {Math.round(generatedDocument.confidence * 100)}%
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Legal Disclaimer</Label>
              <p className="text-xs text-gray-500 mt-1">
                This document was generated by AI and should be reviewed by a qualified Nigerian lawyer 
                before use in any legal proceedings. The accuracy and completeness cannot be guaranteed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
