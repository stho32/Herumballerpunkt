#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 18 LTS (required for this project)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
node --version
npm --version

# Navigate to workspace directory
cd /mnt/persist/workspace

# Install project dependencies
npm install

# Add npm global bin to PATH in user profile
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> $HOME/.profile
echo 'export PATH="./node_modules/.bin:$PATH"' >> $HOME/.profile

# Source the profile to make PATH changes available
source $HOME/.profile

# Verify Vite and Vitest are available
npx vite --version
npx vitest --version

echo "Development environment setup complete!"