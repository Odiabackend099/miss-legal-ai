# Legal Document Generation System

## Overview

The Legal Document Generation System is a comprehensive AI-powered solution for creating legally compliant Nigerian legal documents with voice-to-document conversion capabilities. The system supports three main document types: Tenancy Agreements, Affidavits, and Power of Attorney documents.

## Architecture

### Core Components

1. **DocumentGenerator** - Main orchestrator for document generation workflow
2. **VoiceExtractor** - Extracts structured data from voice transcripts using GPT-4o
3. **TemplateManager** - Manages legal document templates and Handlebars processing
4. **LegalValidator** - Validates documents against Nigerian legal requirements
5. **PDFGenerator** - Creates professional PDF and Word documents

### Data Flow

```
Voice Input → Speech Recognition → VoiceExtractor → DocumentData
    ↓
DocumentData → LegalValidator → ValidationResult
    ↓
DocumentData + Template → TemplateManager → ProcessedContent
    ↓
ProcessedContent → PDFGenerator → PDF/Word Documents
```

## Features

### Voice-to-Document Conversion

- **Multi-language Support**: English, Nigerian Pidgin, Yoruba, Hausa, Igbo
- **Context-aware Extraction**: Understands Nigerian naming conventions, locations, currency
- **Iterative Clarification**: Asks follow-up questions for missing information
- **Confidence Scoring**: Provides confidence metrics for extracted data

### Legal Compliance

- **Nigerian Law Integration**: Complies with Nigerian Evidence Act 2011, Property Laws, etc.
- **State-specific Requirements**: Supports different requirements for all 36 Nigerian states + FCT
- **Stamp Duty Calculation**: Automatic calculation based on document type and state
- **Witness Requirements**: Validates witness and notarization requirements
- **Legal Language**: Uses proper Nigerian legal terminology and formatting

### Document Templates

- **Handlebars Templates**: Dynamic content insertion with helpers
- **Multi-format Output**: PDF, Word, and plain text formats
- **Professional Formatting**: Legal document formatting standards
- **Customizable**: Support for additional clauses and customizations

## API Endpoints

### Document Generation

#### POST `/api/documents/generate`
Generate a legal document from voice or structured data.

**Request Body:**
```json
{
  "documentType": "tenancy_agreement",
  "language": "english",
  "state": "Lagos",
  "voiceTranscript": "I want to create a tenancy agreement...",
  "extractedData": {
    "landlordName": "John Doe",
    "tenantName": "Jane Smith",
    "propertyAddress": "123 Lagos Street",
    "rentAmount": 500000,
    "duration": 12,
    "startDate": "2024-01-01"
  },
  "templateId": "optional-template-id",
  "customizations": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc-uuid",
      "title": "Tenancy Agreement - 123 Lagos Street",
      "content": "TENANCY AGREEMENT\n\nTHIS AGREEMENT...",
      "status": "draft",
      "confidence": 0.95
    },
    "validationResults": {
      "isCompliant": true,
      "warnings": [],
      "missingRequirements": [],
      "complianceScore": 0.95
    },
    "processingTimeMs": 3500
  }
}
```

#### POST `/api/documents/voice-extract`
Extract structured data from voice transcript.

**Request Body:**
```json
{
  "documentType": "affidavit",
  "transcript": "I want to make an affidavit. My name is Dr. Emeka...",
  "language": "english",
  "state": "Lagos"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedData": {
      "deponentName": "Dr. Emeka Nwankwo",
      "facts": "I am the legitimate owner of vehicle ABC-123-DE",
      "purpose": "Insurance purposes",
      "location": "Lagos"
    },
    "validation": {
      "isComplete": false,
      "missingRequiredFields": ["swornDate"],
      "suggestions": ["Please provide the date for the affidavit"]
    },
    "clarificationQuestions": [
      "What date should be used for swearing this affidavit?"
    ],
    "confidence": 0.87
  }
}
```

#### POST `/api/documents/preview`
Generate document preview before final creation.

**Request Body:**
```json
{
  "documentType": "power_of_attorney",
  "data": {
    "grantorName": "John Doe",
    "attorneyName": "Jane Smith",
    "powers": "General business management"
  },
  "language": "english",
  "state": "Lagos"
}
```

#### GET `/api/documents/:id/download`
Download generated document as PDF or Word.

**Query Parameters:**
- `format`: "pdf" or "word"

### Template Management

#### GET `/api/documents/templates`
Get available templates for document generation.

**Query Parameters:**
- `type`: Document type filter
- `language`: Language filter
- `state`: State filter

### Legal Validation

#### POST `/api/documents/validate`
Validate document data for legal compliance.

#### GET `/api/documents/legal-requirements/:documentType`
Get legal requirements for specific document type and state.

## Document Types

### 1. Tenancy Agreement

**Required Fields:**
- `landlordName`: Full name of property owner
- `tenantName`: Full name of tenant
- `propertyAddress`: Complete property address
- `rentAmount`: Annual rent in Nigerian Naira
- `duration`: Tenancy duration in months
- `startDate`: Tenancy commencement date

**Optional Fields:**
- `depositAmount`: Security deposit amount
- `endDate`: Tenancy end date (calculated if not provided)
- `propertyType`: Residential/Commercial
- `specialClauses`: Additional agreement terms
- `noticePeriod`: Notice period for termination

**Legal Requirements:**
- Two adult witnesses required
- Stamp duty payment (varies by state)
- Compliance with state tenancy laws

### 2. Affidavit

**Required Fields:**
- `deponentName`: Person making the affidavit
- `facts`: Facts being sworn to
- `purpose`: Purpose of the affidavit
- `location`: Where affidavit is being sworn
- `swornDate`: Date of swearing

**Optional Fields:**
- `deponentAddress`: Deponent's address
- `deponentOccupation`: Deponent's occupation
- `witnessName`: Witness name
- `additionalFacts`: Supporting facts

**Legal Requirements:**
- Commissioner for Oaths or Notary Public
- Reference to Criminal Code Section 117
- Proper oath language ("I do hereby make oath and say")
- Official seal required

### 3. Power of Attorney

**Required Fields:**
- `grantorName`: Person granting the power
- `attorneyName`: Person receiving the power
- `powers`: Specific powers being granted
- `purpose`: Purpose for granting power

**Optional Fields:**
- `grantorAddress`: Grantor's address
- `attorneyAddress`: Attorney's address
- `duration`: Duration of power
- `limitations`: Limitations on powers
- `executionDate`: Date of execution

**Legal Requirements:**
- Two adult witnesses required
- Notarial acknowledgment recommended
- Clear specification of powers
- Revocation procedures

## Nigerian Legal Context

### State-Specific Requirements

#### Lagos State
- **Stamp Duty**: 0.78% for tenancy agreements, ₦50 for affidavits, ₦1,000 for POA
- **Authority**: Lagos State Internal Revenue Service
- **Specific Laws**: Lagos State Tenancy Law

#### Federal Capital Territory (Abuja)
- **Stamp Duty**: 0.5% for tenancy agreements, ₦50 for affidavits, ₦1,000 for POA
- **Authority**: FCT Internal Revenue Service
- **Specific Laws**: FCT tenancy regulations

#### Other States
- **Default Rates**: Vary by state
- **Local Authorities**: State Internal Revenue Services
- **Compliance**: State-specific legal requirements

### Legal Compliance Features

1. **NDPR Compliance**: Data protection and retention policies
2. **Evidence Act 2011**: Affidavit requirements and procedures
3. **Stamp Duties Act**: Proper stamp duty calculation and payment
4. **Property Laws**: State-specific property and tenancy laws
5. **Criminal Code**: Reference to false statement penalties

## Voice Processing

### Nigerian Context Handling

1. **Name Recognition**:
   - Nigerian naming conventions (Yoruba, Igbo, Hausa names)
   - Titles: Chief, Alhaji, Alhaja, Dr., Prof., etc.
   - Cultural variations in name ordering

2. **Location Processing**:
   - Nigerian addresses and landmarks
   - State and LGA recognition
   - Common location abbreviations (GRA, VI, etc.)

3. **Currency Handling**:
   - Naira amount recognition
   - Shorthand notation (e.g., "500k" = 500,000)
   - Written numbers to digit conversion

4. **Language Variations**:
   - Nigerian English variations
   - Pidgin English processing
   - Code-switching between languages

### Extraction Prompts

The system uses specialized GPT-4o prompts for each document type:

```javascript
// Example for Tenancy Agreement
const tenancyPrompt = `
You are an expert Nigerian legal document assistant. Extract information 
from this conversation about a tenancy agreement. Pay attention to:

1. Nigerian naming conventions and titles
2. Lagos/Nigerian addresses and locations  
3. Naira currency amounts and Nigerian date formats
4. Property types common in Nigeria

Return structured JSON with extracted data.
`;
```

## Error Handling

### Common Error Types

1. **Extraction Errors**:
   - Invalid voice transcript
   - Unrecognized document type
   - Missing critical information

2. **Validation Errors**:
   - Non-compliant document data
   - Missing legal requirements
   - State-specific violations

3. **Generation Errors**:
   - Template processing failures
   - PDF generation issues
   - Database save errors

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_GENERATION_FAILED",
    "message": "Failed to generate document",
    "details": "Specific error details"
  }
}
```

## Security Considerations

### Data Protection

1. **Encryption**: End-to-end encryption for sensitive document data
2. **Access Control**: User-specific document access
3. **Audit Logging**: Complete audit trail for document operations
4. **NDPR Compliance**: Nigerian data protection requirements
5. **Retention Policies**: Automatic data deletion per user preferences

### Legal Disclaimers

All generated documents include appropriate disclaimers:

> "This document was generated by AI and should be reviewed by a qualified Nigerian lawyer before use in any legal proceedings. The accuracy and completeness cannot be guaranteed."

## Performance Optimization

### Caching Strategy

1. **Template Caching**: Compiled Handlebars templates
2. **Validation Rules**: Cached legal validation rules
3. **State Requirements**: Cached state-specific requirements

### Processing Optimization

1. **Concurrent Processing**: Parallel validation and generation
2. **Resource Pooling**: PDF generation resource management
3. **Progress Tracking**: Real-time progress updates

## Testing

### Test Coverage

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: End-to-end workflow testing
3. **Legal Compliance Tests**: Validation against legal requirements
4. **Multi-language Tests**: Different language processing
5. **State-specific Tests**: Various Nigerian state requirements

### Test Data

The system includes comprehensive test data covering:

- Various Nigerian names and locations
- Different property types and amounts
- Multiple languages and dialects
- Edge cases and error conditions

## Deployment

### Environment Variables

```bash
# OpenAI API for voice extraction
OPENAI_API_KEY=your_openai_key

# Supabase for data storage
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Document generation settings
PDF_GENERATION_TIMEOUT=30000
VOICE_EXTRACTION_TIMEOUT=15000
```

### Production Considerations

1. **Scaling**: Horizontal scaling for high document volume
2. **Monitoring**: Document generation metrics and alerts
3. **Backup**: Document and template backup strategies
4. **Updates**: Legal template updates and versioning

## Usage Examples

### Voice Input Examples

#### Tenancy Agreement (English)
```
"I want to create a tenancy agreement for my property. The landlord is 
Chief Adebayo Johnson and the tenant is Miss Grace Okafor. The property 
is located at 45 Admiralty Way, Lekki Phase 1, Lagos State. The annual 
rent is one million naira and the agreement is for two years starting 
from March 1st, 2024."
```

#### Affidavit (Pidgin)
```
"I wan make affidavit say I be the owner of this motor. My name na 
Emeka Nwankwo and the motor registration number na ABC-123-DE. 
I need am for insurance matter."
```

#### Power of Attorney (Formal)
```
"I need to create a power of attorney document. I am James Okafor 
and I want to grant power to my brother David Okafor to manage my 
business affairs while I travel abroad. He should be able to sign 
contracts, manage bank accounts, and handle property transactions."
```

### API Usage Examples

#### Generate Document from Voice

```javascript
const response = await fetch('/api/documents/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + userToken
  },
  body: JSON.stringify({
    documentType: 'tenancy_agreement',
    voiceTranscript: voiceInput,
    language: 'english',
    state: 'Lagos'
  })
});

const result = await response.json();
console.log('Generated document:', result.data.document);
```

#### Extract and Validate Data

```javascript
// First, extract data from voice
const extractResponse = await fetch('/api/documents/voice-extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentType: 'affidavit',
    transcript: voiceTranscript,
    language: 'english'
  })
});

const extractResult = await extractResponse.json();

// Then validate the extracted data
const validateResponse = await fetch('/api/documents/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentType: 'affidavit',
    data: extractResult.data.extractedData,
    state: 'Lagos'
  })
});

const validationResult = await validateResponse.json();
```

## Future Enhancements

### Planned Features

1. **Additional Document Types**:
   - Wills and Estate documents
   - Business incorporation documents
   - Employment contracts
   - Loan agreements

2. **Enhanced AI Capabilities**:
   - Multi-turn conversation handling
   - Context-aware clarifications
   - Legal advice suggestions
   - Document comparison and review

3. **Advanced Legal Features**:
   - Legal precedent integration
   - Case law references
   - Regulatory update notifications
   - Court filing preparation

4. **Integration Expansions**:
   - E-signature integration
   - Legal database connections
   - Government API integrations
   - Blockchain document verification

### Roadmap

- **Q2 2024**: Additional document types
- **Q3 2024**: Enhanced multi-language support
- **Q4 2024**: Legal precedent integration
- **Q1 2025**: Blockchain verification

## Support and Maintenance

### Documentation Updates

- Legal requirement changes
- Template updates and improvements
- API endpoint modifications
- Security policy updates

### Community Contributions

The system is designed to be extensible for:

- New document types
- Additional languages
- State-specific customizations
- Template improvements

For technical support or contributions, refer to the project repository and documentation.
