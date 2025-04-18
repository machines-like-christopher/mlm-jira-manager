const fs = require("fs")
const path = require("path")

// Read the package.json file
const packageJsonPath = path.join(__dirname, "..", "package.json")
let packageJson

try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
  packageJson = JSON.parse(packageJsonContent)
} catch (error) {
  console.error("Error reading package.json:", error)
  process.exit(1)
}

// Define the dependencies to update/add
const dependenciesToUpdate = {
  react: "^18.2.0",
  "react-dom": "^18.2.0",
  "date-fns": "^3.6.0",
}

// Update the dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  ...dependenciesToUpdate,
}

// Add overrides to ensure consistent versions
packageJson.overrides = {
  ...packageJson.overrides,
  react: "^18.2.0",
  "react-dom": "^18.2.0",
  "date-fns": "^3.6.0",
}

// Write the updated package.json back to disk
try {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")
  console.log("✅ Successfully updated package.json with compatible dependencies")
} catch (error) {
  console.error("Error writing package.json:", error)
  process.exit(1)
}
