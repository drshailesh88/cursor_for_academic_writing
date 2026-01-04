/**
 * MSW Server Setup
 *
 * Creates a mock server for intercepting API requests during tests.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create the server with default handlers
export const server = setupServer(...handlers);

// Export for use in tests that need to add custom handlers
export { handlers };
