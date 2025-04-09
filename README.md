# OCR-Based CRVS Form Digitization Backend

This specialized Node.js service provides Optical Character Recognition (OCR) capabilities for the CRVS Form Digitization platform. It functions as a dedicated microservice that processes scanned forms, extracts data according to predefined schemas, and applies correction logic to improve accuracy. This service is designed to work in conjunction with the main CRVS Backend API, which handles authentication, workspaces, and other application functions.

<!-- RAZIN when writing about a file (for example use `c.cpp` instead of c.cpp) -->

## Features

- **Form Processing**: Accepts PDFs or images via URL and extracts data from predefined fields
- **OCR Engine**: Uses tesseract.js to perform text recognition on specific form regions
<!-- RAZIN NOt sure if tesseract.js was the actual name -->
- **Field Types**: Supports text (word/character-based), numeric, date, and checkbox fields
<!-- RAZIN numeric ar date alada kore check kore kina mone nai amar. ektu dekhe nish -->
- **Correction Layer**: Validates OCR output (e.g., dates, numbers, addresses) and provides suggestions using string matching and a reference database
<!-- RAZIN fuzzy **string** matching -->
- **API Endpoint**: Exposes a POST endpoint to trigger OCR and correction workflows
- **Database Storage**: Persists processed data using Prisma ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **OCR**: tesseract.js
- **Image Processing**: Jimp (checkbox detection), node-poppler (PDF to JPG conversion)
- **Database**: Prisma ORM with PostgreSQL
- **HTTP Client**: Axios (file downloads)
- **Configuration**: Schema-driven (crvs-schema.json), environment variables (.env)

## Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **Python 3**: Required for field_creator.py
- **Tesseract**: OCR engine (install instructions below)
- **Poppler**: For PDF conversion (install via system package manager)
- **PostgreSQL**: Database for storing OCR results (configure via Prisma)
- **Python Libraries**: Pillow (`pip install Pillow`)
<!-- RAZIN I don't think Pillow was needed -->

## Installation

### Clone the Repository:

```bash
git clone https://github.com/your-username/crvs-ocr-backend.git
cd crvs-ocr-backend
```

### Install Tesseract:

- **Windows**: Download and install from Tesseract at UB Mannheim.
- **macOS**: `brew install tesseract`
- **Linux**: `sudo apt-get install tesseract-ocr`

### Install Poppler:

- **Windows**: Install via Poppler for Windows and add to PATH.
- **macOS**: `brew install poppler`
- **Linux**: `sudo apt-get install poppler-utils`

### Install Node.js Dependencies:

```bash
npm install
```

### Configure Environment:

Create a `.env` file in the root directory:

```
PORT=5074
DATABASE_URL="postgresql://user:password@localhost:5432/crvs_db?schema=public"
```

Adjust DATABASE_URL to match your PostgreSQL setup.

### Set Up Database:

Initialize Prisma schema:

```bash
npx prisma migrate dev --name init
```

### Generate Field Schema (Optional):

Run the Python script to create crvs-schema.json:

<!-- RAZIN: `region.csv`, not `crvs-schema.json` -->

```bash
python3 field_creator.py
```

Ensure Pillow is installed (`pip install Pillow`).

## Usage

### Start the Server:

```bash
node index.js
```

The server will run at http://localhost:5074.

### Send a Request:

Use a tool like Postman or cURL to send a POST request to http://localhost:5074/:

```bash
curl -X POST http://localhost:5074/ \
-H "Content-Type: application/json" \
-d '{"form_id": "123", "url": "https://example.com/form.pdf", "workspace_id": "ws1", "eiin": "456"}'
```

#### Request Body:

- `form_id`: Unique form identifier (string)
- `url`: URL to the PDF/image file (string)
- `workspace_id`: Workspace identifier (string/number)
- `eiin`: Educational institution identifier (string/number)

#### Response:

On success (200 OK), returns a JSON object with processed form data:

```json
{
  "FIELD_NAME_1": {
    "text": "OCR Output",
    "correction_needed": true,
    "suggestions": ["Suggestion1", "Suggestion2"],
    "errors": "Invalid format"
  },
  "FIELD_NAME_2": { ... }
}
```

## Workflow

1. **File Download**: Downloads the form file from the provided URL
2. **PDF Conversion**: Converts PDFs to JPG images (pages 1 and 2)
3. **OCR Processing**: Extracts data from regions defined in crvs-schema.json
   <!-- RAZIN should be region.json -->
   - Text fields: Word or character-based OCR
   - Checkboxes: Brightness comparison for detection
4. **Correction**: Validates data (e.g., dates, addresses) and suggests corrections
5. **Storage**: Saves results to the database via Prisma
6. **Response**: Returns the processed data to the client

## Project Structure

```
ocr-app/
├── correction/         # Correction logic and utilities
├── db-query/          # Database queries for correction reference data
├── ocr/               # OCR processing and API endpoint
├── schema/            # Field schema (crvs-schema.json) and base images
├── prisma/            # Prisma schema and migrations
├── index.js           # Server entry point
└── .env               # Environment variables
```

## Dependencies

- express: API framework
- axios: File downloads
- tesseract.js: OCR processing
- jimp: Image manipulation
- node-poppler: PDF conversion
- @prisma/client: Database ORM
- dotenv: Environment variables

## Configuration

- **crvs-schema.json**: Defines form fields, regions, types, and correction rules
- **.env**: Stores PORT and DATABASE_URL

## Integration with CRVS Backend API

This OCR service is designed to work as a separate microservice that the main CRVS Backend API calls when forms need OCR processing. The main backend handles user authentication, workspace management, and the overall form lifecycle, while this service focuses exclusively on the OCR and data extraction process.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## Potential Enhancements

- **Scalability**: Add parallel processing for high-volume OCR tasks
- **Error Handling**: Improve robustness for file download or OCR failures
- **Schema Editor**: Build a UI to edit crvs-schema.json dynamically
- **Caching**: Cache reference database queries for performance
