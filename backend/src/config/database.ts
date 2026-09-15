import { testConnection } from './supabase';

const connectDB = async (): Promise<boolean> => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('\n❌ Failed to connect to Supabase');
      console.error('💡 Please check the error messages above and fix the configuration.');
      console.error('   The server will continue to run, but database operations may fail.\n');
      // Don't exit - allow server to start even if DB connection fails
      // This allows the user to fix the config and restart
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ Error connecting to Supabase:', error.message);
    console.error('💡 Please check your environment variables and network connection.');
    console.error('   The server will continue to run, but database operations may fail.\n');
    // Don't exit - allow server to start even if DB connection fails
    return false;
  }
  return true;
};

export default connectDB;
