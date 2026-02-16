/**
 * Swagger/OpenAPI Configuration
 * Loads and merges Swagger spec from YAML files
 * Resolves $ref paths to proper JSON pointers
 * @module config/swagger
 */

import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load main swagger spec
const swaggerSpec = YAML.load(path.join(__dirname, '../../swagger/swagger.yaml'));

// Load components/schemas
const schemas = YAML.load(path.join(__dirname, '../../swagger/components/schemas.yaml'));

// Load auth paths
const authPaths = YAML.load(path.join(__dirname, '../../swagger/paths/auth.yaml'));

// Load user paths
const userPaths = YAML.load(path.join(__dirname, '../../swagger/paths/user.yaml'));

// Merge schemas into components
if (!swaggerSpec.components) {
  swaggerSpec.components = {};
}
swaggerSpec.components.schemas = {
  ...schemas.schemas,
  ...(swaggerSpec.components.schemas || {}),
};

// Function to resolve $ref paths in an object
function resolveRefs(obj, basePath = '') {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, basePath));
  }

  const resolved = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      // Convert YAML relative paths to JSON pointers
      // ../components/schemas.yaml#/LoginRequest -> #/components/schemas/LoginRequest
      if (value.includes('../components/schemas.yaml#/')) {
        resolved[key] = value.replace('../components/schemas.yaml#/', '#/components/schemas/');
      } else if (value.includes('#/')) {
        resolved[key] = value; // Already a JSON pointer
      } else {
        resolved[key] = basePath + value; // Relative to current path
      }
    } else {
      resolved[key] = resolveRefs(value, basePath);
    }
  }
  return resolved;
}

// Merge paths - add auth paths under /api/v1/auth
Object.keys(authPaths).forEach(key => {
  const resolvedPath = resolveRefs(authPaths[key]);
  swaggerSpec.paths[`/api/v1/auth${key}`] = resolvedPath;
});

// Merge paths - add user paths under /api/v1/user
Object.keys(userPaths).forEach(key => {
  const resolvedPath = resolveRefs(userPaths[key]);
  swaggerSpec.paths[`/api/v1/user${key}`] = resolvedPath;
});

// Also resolve refs in main paths if any
if (swaggerSpec.paths) {
  for (const key of Object.keys(swaggerSpec.paths)) {
    swaggerSpec.paths[key] = resolveRefs(swaggerSpec.paths[key]);
  }
}

export { swaggerSpec };
