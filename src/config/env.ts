// Environment configuration
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
  TWELVE_DATA_API_KEY: import.meta.env.VITE_TWELVE_DATA_API_KEY,
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID'
] as const;

const optionalEnvVars = [
  'VITE_GEMINI_API_KEY',
  'VITE_ALPHA_VANTAGE_API_KEY',
  'VITE_TWELVE_DATA_API_KEY'
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Warn about missing optional variables
  const missingOptional = optionalEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missingOptional.length > 0 && env.IS_DEVELOPMENT) {
    console.warn(
      `Missing optional environment variables: ${missingOptional.join(', ')}`
    );
  }
}

// Call validation on module load
if (env.IS_PRODUCTION) {
  validateEnv();
}