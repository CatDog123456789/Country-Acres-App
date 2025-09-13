import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running setup script...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
console.log('Ensuring public directory exists at:', publicDir);
await fs.ensureDir(publicDir);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
console.log('Ensuring data directory exists at:', dataDir);
await fs.ensureDir(dataDir);

// Check if index.html exists
const indexPath = path.join(publicDir, 'index.html');
console.log('Checking if index.html exists at:', indexPath);
const indexExists = await fs.pathExists(indexPath);
console.log('index.html exists:', indexExists);

if (!indexExists) {
  console.error('WARNING: index.html not found in public directory!');
  console.log('Creating a fallback index.html file...');
  
  const fallbackHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>County Acres Pet Resort</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2d9cdb; text-align: center; }
    .card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
    .btn { display: inline-block; background: #2d9cdb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
  </style>
</head>
<body>
  <h1>County Acres Pet Resort</h1>
  
  <div class="card">
    <h2>Application Setup</h2>
    <p>The application is running, but the original index.html file was not found.</p>
    <p>This is a fallback page created during deployment.</p>
    <p>If you're seeing this page, it means the server is working but there might be an issue with the file deployment.</p>
    
    <h3>API Status</h3>
    <p>You can check if the API is working by visiting: <a href="/api/state">/api/state</a></p>
    
    <h3>Troubleshooting</h3>
    <p>Please check the server logs for more information about what might be wrong with the file deployment.</p>
  </div>
</body>
</html>`;

  try {
    await fs.writeFile(indexPath, fallbackHtml);
    console.log('Fallback index.html created successfully');
  } catch (err) {
    console.error('Error creating fallback index.html:', err);
  }
  
  console.log('Listing files in public directory:');
  try {
    const files = await fs.readdir(publicDir);
    console.log(files);
  } catch (err) {
    console.error('Error reading public directory:', err);
  }
}

// Initialize state.json if it doesn't exist
const statePath = path.join(dataDir, 'state.json');
console.log('Checking if state.json exists at:', statePath);
const stateExists = await fs.pathExists(statePath);
console.log('state.json exists:', stateExists);

if (!stateExists) {
  console.log('Creating initial state.json file...');
  await fs.writeJson(statePath, { 
    clients: [], 
    bookings: [], 
    sig: String(Date.now()) 
  }, { spaces: 2 });
  console.log('state.json created successfully');
}

console.log('Setup completed successfully!');