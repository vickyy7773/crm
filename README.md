# CRM Lead Manager

A modern CRM application for managing student leads for studying abroad.

## Features

- **CSV Import**: Import student leads from CSV files
- **Lead Management**: View, filter, and search through all leads
- **Real-time Stats**: Dashboard showing key metrics
- **Backend API**: Node.js/Express API with JSON file storage

## Setup Instructions

### 1. Install Dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Start the Application

You need to run both the frontend and backend servers.

#### Terminal 1 - Backend Server
```bash
cd backend
npm start
```
The backend will start on `http://localhost:5000`

#### Terminal 2 - Frontend Server
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

### 3. Import Data

1. Navigate to the Import page
2. Download the CSV template
3. Fill in your lead data
4. Upload the CSV file
5. Preview the data
6. Click "Import to Database"

## CSV Format

Your CSV file should have the following columns:

- **name**: Student's full name
- **phone**: Contact phone number
- **city**: City of residence
- **neet**: NEET score
- **course**: Desired course (e.g., MBBS)
- **destination**: Country of interest
- **remark**: Additional notes
- **source**: Lead source (e.g., Facebook Ad, Google Ad)

Example:
```csv
name,phone,city,neet,course,destination,remark,source
John Doe,+1234567890,New York,520,MBBS,Russia,Interested in premium package,Facebook Ad
Jane Smith,+9876543210,Los Angeles,485,MBBS,Philippines,Looking for basic plan,Google Ad
```

## API Endpoints

- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get a single lead
- `POST /api/leads` - Create a new lead
- `POST /api/leads/import` - Bulk import leads from CSV
- `PUT /api/leads/:id` - Update a lead
- `DELETE /api/leads/:id` - Delete a lead
- `DELETE /api/leads` - Delete all leads

## Project Structure

```
crm/
├── src/                    # Frontend React application
│   ├── pages/
│   │   ├── Import.jsx     # CSV import page
│   │   ├── Leads.jsx      # Leads management page
│   │   └── ...
│   └── ...
├── backend/               # Backend Node.js/Express API
│   ├── server.js         # Main server file
│   ├── routes/
│   │   └── leadRoutes.js # Lead API routes
│   └── data/
│       └── leads.json    # JSON database file
└── package.json          # Frontend dependencies
```

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, CORS
- **Database**: JSON file storage (can be upgraded to MongoDB)

## Notes

- The backend uses a JSON file for data storage. For production, consider upgrading to a proper database like MongoDB or PostgreSQL.
- Make sure both servers are running before trying to import data.
- The application currently stores data in `backend/data/leads.json`.
