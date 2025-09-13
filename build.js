import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildApp() {
  console.log('Starting build process...');
  
  // Ensure public directory exists
  const publicDir = path.join(__dirname, 'public');
  await fs.ensureDir(publicDir);
  
  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  await fs.ensureDir(dataDir);
  
  // Check if index.html exists
  const indexPath = path.join(publicDir, 'index.html');
  const indexExists = await fs.pathExists(indexPath);
  console.log(`index.html exists: ${indexExists}`);
  
  if (!indexExists) {
    console.error('ERROR: index.html not found in public directory!');
    process.exit(1);
  }
  
  // Check if logo.png exists
  const logoPath = path.join(publicDir, 'logo.png');
  const logoExists = await fs.pathExists(logoPath);
  console.log(`logo.png exists: ${logoExists}`);
  
  if (!logoExists) {
    console.error('WARNING: logo.png not found in public directory!');
  }
  
  // Initialize state.json if it doesn't exist
  const statePath = path.join(dataDir, 'state.json');
  const stateExists = await fs.pathExists(statePath);
  console.log(`state.json exists: ${stateExists}`);
  
  if (!stateExists) {
    console.log('Creating initial state.json file...');
    await fs.writeJson(statePath, { 
      clients: [], 
      bookings: [], 
      sig: String(Date.now()) 
    }, { spaces: 2 });
  }
  
  console.log('Build process completed successfully!');
}

buildApp().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});