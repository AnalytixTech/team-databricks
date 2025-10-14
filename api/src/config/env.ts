import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  SOFT_RESERVE_WINDOW_HOURS: number;
  FRONTEND_URL: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '5000'), 10),
  MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/fleetly'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRE: getEnvVar('JWT_EXPIRE', '7d'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRE: getEnvVar('JWT_REFRESH_EXPIRE', '30d'),
  // Optional services - will work with placeholder values
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID', 'not-configured'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET', 'not-configured'),
  GOOGLE_CALLBACK_URL: getEnvVar('GOOGLE_CALLBACK_URL', 'http://localhost:5000/api/auth/google/callback'),
  SENDGRID_API_KEY: getEnvVar('SENDGRID_API_KEY', 'not-configured'),
  SENDGRID_FROM_EMAIL: getEnvVar('SENDGRID_FROM_EMAIL', 'noreply@fleetly.com'),
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME', 'not-configured'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY', 'not-configured'),
  CLOUDINARY_API_SECRET: getEnvVar('CLOUDINARY_API_SECRET', 'not-configured'),
  PAYSTACK_SECRET_KEY: getEnvVar('PAYSTACK_SECRET_KEY', 'not-configured'),
  PAYSTACK_PUBLIC_KEY: getEnvVar('PAYSTACK_PUBLIC_KEY', 'not-configured'),
  SOFT_RESERVE_WINDOW_HOURS: parseInt(getEnvVar('SOFT_RESERVE_WINDOW_HOURS', '24'), 10),
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
};

