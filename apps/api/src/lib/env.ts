import fs from 'fs';
import path from 'path';

export function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) return;
        
        const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
        if (match && match[1]) {
          const key = match[1];
          let value = match[2] || '';
          // Strip quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = value.trim();
          }
        }
      });
      console.log(`Loaded environment variables from: ${envPath}`);
      return;
    }
  }
  console.warn('No .env file found to load programmatically.');
}
