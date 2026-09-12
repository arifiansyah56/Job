import { getAccessToken } from './auth';

const SPREADSHEET_ID_KEY = 'job_auto_apply_spreadsheet_id';

// Find or Create the Spreadsheet
export const initSpreadsheet = async (): Promise<string | null> => {
  const existingId = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (existingId) return existingId;

  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  // Create a new spreadsheet
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Job Applications Dashboard',
      },
      sheets: [
        {
          properties: {
            title: 'Applications',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('Failed to create spreadsheet', await res.text());
    return null;
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  
  // Create Headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A1:F1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [['Date', 'Job Title', 'Company', 'Link', 'HR Email', 'Status']],
    }),
  });

  localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);
  return spreadsheetId;
};

// Append a row
export const saveApplicationToSheets = async (
  jobTitle: string,
  company: string,
  link: string,
  hrEmail: string,
  status: string
) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const spreadsheetId = await initSpreadsheet();
  if (!spreadsheetId) throw new Error('Spreadsheet ID not found');

  const date = new Date().toISOString().split('T')[0];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Applications!A:F:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[date, jobTitle, company, link, hrEmail, status]],
      }),
    }
  );

  if (!res.ok) {
    console.error('Failed to append row', await res.text());
    throw new Error('Failed to save to Google Sheets');
  }

  return await res.json();
};

export const getSpreadsheetLink = () => {
  const id = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (id) {
    return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  }
  return null;
};
