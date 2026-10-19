# Deployment Guide for SN Attarwala

This guide will walk you through the process of deploying the SN Attarwala premium perfume store to Vercel, which is the recommended hosting platform for Next.js applications.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A GitHub account
3. Your Supabase project URL and Anon Key
4. Razorpay API Key ID and Secret

## Step 1: Push Code to GitHub

1. Initialize a git repository if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new repository on GitHub.
3. Push your code to the new repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/yourusername/mumbai-perfume-store.git
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. Log in to your Vercel account.
2. Click on **Add New...** and select **Project**.
3. Import the GitHub repository you just created.
4. In the "Configure Project" step, expand the **Environment Variables** section.

## Step 3: Configure Environment Variables

Add the following environment variables exactly as they appear in your local `.env.local` file:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: The WhatsApp number for the floating button (e.g., `9198XXXXXXXX`)

## Step 4: Build and Deploy

1. Click the **Deploy** button.
2. Vercel will now build your Next.js application. This process usually takes 1-2 minutes.
3. Once completed, you will receive a preview URL and your production URL.

## Step 5: Post-Deployment Steps

1. **Update Supabase Auth Redirects**:
   Go to your Supabase Dashboard -> Authentication -> URL Configuration.
   Add your new Vercel domain to the "Site URL" and "Redirect URLs".
2. **Setup Custom Domain** (Optional):
   In Vercel, go to Settings -> Domains and add your custom domain (e.g., `snattarwala.in`).

Congratulations! Your premium perfume store is now live!
