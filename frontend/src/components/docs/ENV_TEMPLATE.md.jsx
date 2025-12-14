# ============================================
# BACKEND .env FILE
# ============================================
# Copy this to a file named ".env" in your backend folder
# Replace the placeholder values with your actual credentials

# Supabase Configuration
# Get these from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# JWT Secret (make this a random long string)
JWT_SECRET=your-super-secret-jwt-key-make-this-long-and-random

# Server Port (optional, defaults to 3001)
PORT=3001


# ============================================
# FRONTEND .env FILE  
# ============================================
# Create a separate .env file in your frontend folder with:

VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key