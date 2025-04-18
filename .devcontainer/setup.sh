#!/bin/bash
set -e

echo "🔧 Setting up Jira Kanban Board dependencies..."

# Create .npmrc file with configuration
cat > .npmrc << EOL
legacy-peer-deps=true
strict-peer-dependencies=false
EOL

# Update package.json to use compatible versions
node .devcontainer/update-package.js

# Install dependencies
npm install

echo "✅ Setup complete! You can now run 'npm run dev' to start the development server."
