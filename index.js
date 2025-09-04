const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = 'appEZQLiRm9cfnVkP'; // Growth AI base
const AIRTABLE_API = 'https://api.airtable.com/v0';

// Logging system
const logs = [];
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message, type };
  logs.push(logEntry);
  console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  // Keep only last 100 logs
  if (logs.length > 100) logs.shift();
}

app.get('/', (req, res) => {
  res.json({
    status: 'active',
    purpose: 'Create Task Lists table in Growth AI Airtable base',
    endpoints: [
      'GET / - This status page',
      'GET /health - Health check',
      'GET /logs - View recent logs',
      'POST /test - Test table creation',
      'POST /create-table - Create the Task Lists table'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/logs', (req, res) => {
  res.json({ logs: logs.slice(-20) }); // Return last 20 logs
});

app.post('/test', async (req, res) => {
  try {
    log('Testing Airtable connection...');
    
    // Test connection by getting base schema
    const response = await axios.get(`${AIRTABLE_API}/meta/bases/${BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      }
    });
    
    log('✅ Airtable connection successful');
    res.json({ 
      success: true, 
      message: 'Connection test successful',
      baseId: BASE_ID,
      existingTables: response.data.tables.length
    });
  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, 'error');
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/create-table', async (req, res) => {
  try {
    log('Creating Task Lists table...');
    
    const tableData = {
      name: 'Task Lists',
      fields: [
        {
          name: 'Task Name',
          type: 'singleLineText'
        },
        {
          name: 'Assigned To',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Vanessa', color: 'blueLight2' },
              { name: 'Blake', color: 'cyanLight2' },
              { name: 'Beau', color: 'tealLight2' },
              { name: 'Chris', color: 'greenLight2' },
              { name: 'Liam', color: 'yellowLight2' },
              { name: 'Tevon', color: 'orangeLight2' }
            ]
          }
        },
        {
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Not Started', color: 'grayLight2' },
              { name: 'In Progress', color: 'yellowLight2' },
              { name: 'Review', color: 'orangeLight2' },
              { name: 'Completed', color: 'greenLight2' },
              { name: 'On Hold', color: 'redLight2' }
            ]
          }
        },
        {
          name: 'Priority',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Low', color: 'grayLight2' },
              { name: 'Medium', color: 'yellowLight2' },
              { name: 'High', color: 'orangeLight2' },
              { name: 'Urgent', color: 'redLight2' }
            ]
          }
        },
        {
          name: 'Due Date',
          type: 'date',
          options: {
            dateFormat: {
              name: 'local'
            }
          }
        },
        {
          name: 'Description',
          type: 'multilineText'
        },
        {
          name: 'Progress %',
          type: 'number',
          options: {
            precision: 0
          }
        },
        {
          name: 'Date Created',
          type: 'createdTime',
          options: {
            dateFormat: {
              name: 'local'
            },
            includeTime: true
          }
        },
        {
          name: 'Last Modified',
          type: 'lastModifiedTime',
          options: {
            dateFormat: {
              name: 'local'
            },
            includeTime: true
          }
        },
        {
          name: 'Time Estimate (Hours)',
          type: 'number',
          options: {
            precision: 1
          }
        },
        {
          name: 'Tags',
          type: 'multipleSelects',
          options: {
            choices: [
              { name: 'Development', color: 'blueLight2' },
              { name: 'Marketing', color: 'greenLight2' },
              { name: 'Design', color: 'purpleLight2' },
              { name: 'Client Work', color: 'orangeLight2' },
              { name: 'Admin', color: 'grayLight2' },
              { name: 'Research', color: 'cyanLight2' },
              { name: 'Meeting', color: 'yellowLight2' }
            ]
          }
        },
        {
          name: 'Notes',
          type: 'multilineText'
        }
      ]
    };

    const response = await axios.post(`${AIRTABLE_API}/meta/bases/${BASE_ID}/tables`, tableData, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Task Lists table created successfully!');
    log(`Table ID: ${response.data.id}`);
    
    res.json({
      success: true,
      message: 'Task Lists table created successfully!',
      tableId: response.data.id,
      tableName: response.data.name,
      fieldsCreated: response.data.fields.length,
      details: {
        assignees: ['Vanessa', 'Blake', 'Beau', 'Chris', 'Liam', 'Tevon'],
        statuses: ['Not Started', 'In Progress', 'Review', 'Completed', 'On Hold'],
        priorities: ['Low', 'Medium', 'High', 'Urgent'],
        features: [
          'Task assignments to team members',
          'Progress tracking with percentage',
          'Due dates and time estimates',
          'Priority levels and status tracking',
          'Tags for categorization',
          'Detailed notes and descriptions',
          'Automatic creation and modification timestamps'
        ]
      }
    });

  } catch (error) {
    log(`❌ Failed to create table: ${error.message}`, 'error');
    if (error.response) {
      log(`API Error: ${JSON.stringify(error.response.data)}`, 'error');
    }
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Auto-create table on startup
app.listen(process.env.PORT || 3000, async () => {
  console.log('Server started. Creating Task Lists table...');
  
  try {
    const tableData = {
      name: 'Task Lists',
      fields: [
        {
          name: 'Task Name',
          type: 'singleLineText'
        },
        {
          name: 'Assigned To',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Vanessa', color: 'blueLight2' },
              { name: 'Blake', color: 'cyanLight2' },
              { name: 'Beau', color: 'tealLight2' },
              { name: 'Chris', color: 'greenLight2' },
              { name: 'Liam', color: 'yellowLight2' },
              { name: 'Tevon', color: 'orangeLight2' }
            ]
          }
        },
        {
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Not Started', color: 'grayLight2' },
              { name: 'In Progress', color: 'yellowLight2' },
              { name: 'Review', color: 'orangeLight2' },
              { name: 'Completed', color: 'greenLight2' },
              { name: 'On Hold', color: 'redLight2' }
            ]
          }
        },
        {
          name: 'Priority',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Low', color: 'grayLight2' },
              { name: 'Medium', color: 'yellowLight2' },
              { name: 'High', color: 'orangeLight2' },
              { name: 'Urgent', color: 'redLight2' }
            ]
          }
        },
        {
          name: 'Due Date',
          type: 'date',
          options: {
            dateFormat: {
              name: 'local'
            }
          }
        },
        {
          name: 'Description',
          type: 'multilineText'
        },
        {
          name: 'Progress %',
          type: 'number',
          options: {
            precision: 0
          }
        },
        {
          name: 'Date Created',
          type: 'createdTime',
          options: {
            dateFormat: {
              name: 'local'
            },
            includeTime: true
          }
        },
        {
          name: 'Last Modified',
          type: 'lastModifiedTime',
          options: {
            dateFormat: {
              name: 'local'
            },
            includeTime: true
          }
        },
        {
          name: 'Time Estimate (Hours)',
          type: 'number',
          options: {
            precision: 1
          }
        },
        {
          name: 'Tags',
          type: 'multipleSelects',
          options: {
            choices: [
              { name: 'Development', color: 'blueLight2' },
              { name: 'Marketing', color: 'greenLight2' },
              { name: 'Design', color: 'purpleLight2' },
              { name: 'Client Work', color: 'orangeLight2' },
              { name: 'Admin', color: 'grayLight2' },
              { name: 'Research', color: 'cyanLight2' },
              { name: 'Meeting', color: 'yellowLight2' }
            ]
          }
        },
        {
          name: 'Notes',
          type: 'multilineText'
        }
      ]
    };

    await axios.post(`${AIRTABLE_API}/meta/bases/${BASE_ID}/tables`, tableData, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Task Lists table created automatically on startup!');
  } catch (error) {
    log(`❌ Auto-creation failed: ${error.message}`, 'error');
  }
});