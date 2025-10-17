# Health Tracker - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
1. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier available)
2. A [Clerk](https://clerk.com) account for authentication (free tier available)
3. A [Vercel](https://vercel.com) account (recommended for Next.js deployment)

## Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select your preferred cloud provider and region
   - Name your cluster (default is fine)

3. **Create a Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password (save these!)
   - Grant "Read and write to any database" privileges

4. **Whitelist IP Addresses**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, you can restrict this later

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/health-tracker?retryWrites=true&w=majority`

## Step 2: Set Up Clerk Authentication

1. **Create a Clerk Account**
   - Go to https://clerk.com
   - Sign up for a free account

2. **Create an Application**
   - Click "Create Application"
   - Name it "Health Tracker"
   - Choose your preferred social login options (Google, GitHub, etc.)
   - Click "Create Application"

3. **Get API Keys**
   - In your Clerk dashboard, go to "API Keys"
   - Copy the "Publishable Key" (starts with `pk_test_`)
   - Copy the "Secret Key" (starts with `sk_test_`)

4. **Configure Clerk Settings** (Optional)
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Enable/disable authentication methods as needed
   - Go to "Appearance" to customize the sign-in/sign-up UI

## Step 3: Configure Environment Variables

1. **Create `.env.local` file** in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in the values** in `.env.local`:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/health-tracker?retryWrites=true&w=majority

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx

   # Clerk URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

## Step 4: Test Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   - Navigate to http://localhost:3000
   - Test sign up and login
   - Add some test data to verify MongoDB connection

## Step 5: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**:
   - In the "Configure Project" section
   - Add all environment variables from your `.env.local`
   - **Important**: Do NOT include `.env.local` in your repository!

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your project settings
   - Add environment variables when prompted

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 6: Post-Deployment Configuration

### Update Clerk URLs

1. Go to your Clerk dashboard
2. Navigate to "Domains"
3. Add your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
4. This ensures authentication redirects work correctly

### Test Your Deployment

1. Visit your deployed URL
2. Test user registration and login
3. Add blood pressure, weight, and blood sugar readings
4. Test PDF export functionality
5. Verify data persistence

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key (client-side) | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in page URL | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up page URL | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up | `/` |

## Troubleshooting

### MongoDB Connection Issues
- Verify your IP address is whitelisted in MongoDB Atlas
- Check your connection string is correct
- Ensure the database user has proper permissions

### Clerk Authentication Issues
- Verify environment variables are set correctly
- Check Clerk dashboard for any configuration warnings
- Ensure your deployment URL is added to Clerk domains

### Build Failures
- Check Vercel build logs for specific errors
- Verify all dependencies are in `package.json`
- Ensure TypeScript types are correct

### Data Not Persisting
- Verify MongoDB connection in production
- Check Vercel function logs
- Ensure user is authenticated before making API calls

## Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Clerk**:
   - Add custom domain to Clerk dashboard
   - Update environment variables if needed

## Monitoring and Maintenance

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor page views, performance, and errors

### MongoDB Monitoring
- Use MongoDB Atlas monitoring dashboard
- Set up alerts for database usage
- Monitor connection pool and queries

### Backup Strategy
- MongoDB Atlas provides automated backups on paid tiers
- For free tier, consider periodic manual exports
- Use the CSV export feature in the app for data backup

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use strong database passwords**
3. **Regularly update dependencies**: `npm update`
4. **Enable 2FA** on Clerk and MongoDB accounts
5. **Monitor API usage** and set rate limits if needed
6. **Keep Clerk and MongoDB IPs restricted** in production

## Support

For issues or questions:
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- MongoDB: https://docs.mongodb.com
- Clerk: https://clerk.com/docs

## Next Steps

Once deployed, consider:
- Setting up custom domain
- Enabling analytics
- Adding more health metrics
- Implementing data export/import features
- Adding health reports and insights
- Sharing features for doctors

---

**Congratulations! Your Health Tracker app is now live! 🎉**

