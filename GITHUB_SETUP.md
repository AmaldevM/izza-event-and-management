# GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com and log in to your account
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in repository details:
   - **Repository name**: `izza-catering-mobile` (or your preferred name)
   - **Description**: "IZZA Catering & Event Management System - React Native Mobile App with Firebase"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
cd "d:/IZZA caters and Events"

# Set the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/izza-catering-mobile.git

# Rename default branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Alternative: Using SSH** (if you have SSH keys set up):
```bash
git remote add origin git@github.com:YOUR_USERNAME/izza-catering-mobile.git
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Refresh your GitHub repository page
2. You should see all your project files
3. The README.md will be displayed on the repository home page

## Important Notes

- Replace `YOUR_USERNAME` with your actual GitHub username
- If prompted for credentials, enter your GitHub username and password (or personal access token)
- For better security, consider setting up SSH keys or using a personal access token instead of password

## Troubleshooting

### If you get an authentication error:
GitHub no longer accepts password authentication. You need to:
1. Create a **Personal Access Token**: GitHub Settings → Developer settings → Personal access tokens → Generate new token
2. Use the token as your password when prompted

### If the remote already exists:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/izza-catering-mobile.git
```

## Next Steps

After pushing to GitHub:
1. Update `firebase.config.ts` with your actual Firebase credentials
2. Run `npm install` to install dependencies
3. Test the app with `npm start`
4. Scan the QR code with Expo Go app on your phone
