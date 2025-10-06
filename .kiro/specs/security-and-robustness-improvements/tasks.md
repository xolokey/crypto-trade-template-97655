# Implementation Plan

- [x] 1. Backend Security Foundation
  - Create global exception handler middleware to centralize error handling
  - Implement custom exception classes (ValidationException, NotFoundException, etc.)
  - Add structured logging with request context
  - _Requirements: 2.1, 2.2, 7.1, 7.2_

- [ ] 2. Input Validation and Sanitization
  - [x] 2.1 Create input validation middleware for API requests
    - Implement validation for stock symbols, prices, quantities, and user IDs
    - Add string sanitization to prevent injection attacks
    - _Requirements: 1.3, 2.1_

  - [ ] 2.2 Add FluentValidation library and create validators
    - Create validators for CreateAlertDto and UpdateAlertDto
    - Create validators for portfolio and watchlist DTOs
    - _Requirements: 1.3, 3.1_

  - [ ] 2.3 Write unit tests for validation logic
    - Test valid and invalid inputs
    - Test edge cases and boundary conditions
    - _Requirements: 1.3_

- [ ] 3. Secure CORS Configuration
  - [x] 3.1 Update CORS policy to use environment-specific origins
    - Remove AllowAnyOrigin() from Program.cs
    - Configure allowed origins from appsettings.json
    - Add support for wildcard subdomains in non-production
    - _Requirements: 1.2, 10.3_

  - [ ] 3.2 Add CORS configuration validation at startup
    - Validate that allowed origins are configured
    - Fail fast if configuration is missing in production
    - _Requirements: 10.4_

- [ ] 4. Rate Limiting Implementation
  - [ ] 4.1 Install and configure AspNetCoreRateLimit package
    - Add rate limiting middleware to Program.cs
    - Configure Redis-backed rate limiting for distributed scenarios
    - _Requirements: 8.1, 8.2_

  - [ ] 4.2 Configure rate limits per endpoint
    - Set different limits for authenticated vs anonymous users
    - Add rate limit headers to responses
    - Implement Retry-After header for rate-limited requests
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ] 4.3 Write integration tests for rate limiting
    - Test rate limit enforcement
    - Test rate limit headers
    - _Requirements: 8.1, 8.2_

- [ ] 5. Database Query Security
  - [x] 5.1 Audit all database queries for SQL injection vulnerabilities
    - Review setup-database.sql and migration files
    - Ensure all queries use parameterized statements
    - _Requirements: 1.1_

  - [x] 5.2 Update any raw SQL queries to use parameterized queries
    - Replace string concatenation with parameters
    - Use Entity Framework's built-in protections where possible
    - _Requirements: 1.1_

- [ ] 6. Frontend Form Validation
  - [x] 6.1 Create reusable form validation hook
    - Implement useFormValidation hook with generic type support
    - Add support for field-level and form-level validation
    - Include touched state tracking for better UX
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 6.2 Create validation schemas for forms
    - Create alertValidationSchema for price alerts
    - Create portfolioValidationSchema for portfolio entries
    - Add validation for all numeric inputs
    - _Requirements: 3.1, 3.2_

  - [x] 6.3 Update CreateAlertDialog with validation
    - Integrate useFormValidation hook
    - Add inline error messages for invalid inputs
    - Prevent submission with invalid data
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 6.4 Update AddToPortfolioDialog with validation
    - Integrate useFormValidation hook
    - Add inline error messages for quantity and price
    - Validate that values are positive numbers
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 6.5 Create ErrorMessage component for consistent error display
    - Design user-friendly error message component
    - Add icon and styling for visibility
    - _Requirements: 3.3_

  - [ ] 6.6 Write unit tests for validation hooks and schemas
    - Test validation logic for all schemas
    - Test useFormValidation hook behavior
    - _Requirements: 3.1, 3.2_

- [ ] 7. Enhanced Error Handling
  - [ ] 7.1 Update backend controllers to return specific error responses
    - Update MarketDataController error handling
    - Update PriceAlertsController error handling
    - Return appropriate HTTP status codes (400, 404, 500)
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 Implement retry logic with exponential backoff in frontend
    - Create fetchWithRetry utility function
    - Add retry logic to API service calls
    - Don't retry on client errors (4xx)
    - _Requirements: 2.4_

  - [x] 7.3 Enhance ErrorBoundary component
    - Add better fallback UI with error details
    - Add "Try Again" button to recover from errors
    - Log errors to monitoring service
    - _Requirements: 2.5_

  - [ ] 7.4 Create toast notification system for API errors
    - Display user-friendly error messages in toasts
    - Show success messages for completed actions
    - _Requirements: 2.3_

- [ ] 8. WebSocket Security Implementation
  - [ ] 8.1 Convert WebSocket server to use WSS (WebSocket Secure)
    - Update server.js to use HTTPS server
    - Load SSL certificates from environment variables
    - Configure for both development and production
    - _Requirements: 4.1, 4.3_

  - [ ] 8.2 Implement origin validation for WebSocket connections
    - Add verifyClient callback to validate origin header
    - Load allowed origins from environment variables
    - Reject unauthorized connections with 403 status
    - Log rejected connection attempts
    - _Requirements: 4.2, 4.4_

  - [ ] 8.3 Create connection rate limiter for WebSocket server
    - Implement ConnectionRateLimiter class
    - Limit connections per IP address
    - Track connection timestamps and enforce limits
    - _Requirements: 4.2, 4.4_

  - [ ] 8.4 Update frontend to connect to WSS endpoint
    - Change WebSocket URL from ws:// to wss://
    - Update websocketService.ts configuration
    - Handle SSL certificate errors in development
    - _Requirements: 4.1, 4.3_

  - [ ] 8.5 Write integration tests for WebSocket security
    - Test origin validation
    - Test connection rate limiting
    - Test SSL/TLS encryption
    - _Requirements: 4.2, 4.3_

- [ ] 9. Data Fetching Optimization
  - [ ] 9.1 Install and configure React Query
    - Add @tanstack/react-query package
    - Set up QueryClient with appropriate defaults
    - Configure stale time, cache time, and retry settings
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 9.2 Create custom hooks using React Query
    - Create useStockQuote hook for single stock
    - Create useMultipleQuotes hook for batch requests
    - Create useMarketIndices hook for indices
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 9.3 Refactor AIEnhancedDashboard to use React Query
    - Replace useState/useEffect with React Query hooks
    - Coordinate data fetching to avoid redundant requests
    - Implement proper loading and error states
    - _Requirements: 5.1, 5.4_

  - [ ] 9.4 Implement batch request coordinator
    - Create BatchRequestCoordinator class
    - Queue individual requests and flush in batches
    - Integrate with React Query
    - _Requirements: 5.3_

  - [ ] 9.5 Write tests for data fetching optimization
    - Test request deduplication
    - Test caching behavior
    - Test batch coordination
    - _Requirements: 5.3_

- [ ] 10. Connection Resilience
  - [ ] 10.1 Implement automatic WebSocket reconnection
    - Create ResilientWebSocket class
    - Add exponential backoff for reconnection attempts
    - Track reconnection attempts and max retries
    - _Requirements: 9.1, 9.2_

  - [ ] 10.2 Add resubscription logic after reconnection
    - Store active subscriptions
    - Resubscribe to symbols after successful reconnection
    - _Requirements: 9.2_

  - [ ] 10.3 Update websocketService to use ResilientWebSocket
    - Replace native WebSocket with ResilientWebSocket
    - Handle connection state changes
    - Update ConnectionStatusIndicator to show reconnection status
    - _Requirements: 9.1, 9.2_

  - [ ] 10.4 Add offline data handling
    - Display cached data when backend is unavailable
    - Show warning indicator for stale data
    - Provide manual refresh option
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 11. Database Seeding Optimization
  - [ ] 11.1 Create batch insert service for stock seeding
    - Implement seedStocksInBatches function
    - Process stocks in batches of 50-100 records
    - Add delay between batches to avoid overwhelming database
    - _Requirements: 6.1, 6.2_

  - [ ] 11.2 Add error handling and progress reporting
    - Track successful and failed insertions
    - Log progress after each batch
    - Return summary of seeding operation
    - _Requirements: 6.2, 6.3_

  - [ ] 11.3 Update seed-stocks Supabase function
    - Replace single insert with batch processing
    - Add timeout handling for long-running operations
    - Support resuming from last successful batch
    - _Requirements: 6.4, 6.5_

  - [ ] 11.4 Write tests for batch seeding logic
    - Test batch processing
    - Test error handling
    - Test progress reporting
    - _Requirements: 6.1, 6.2_

- [ ] 12. Logging and Monitoring
  - [ ] 12.1 Enhance structured logging in backend
    - Add request/response logging middleware
    - Log all API calls with method, path, and status
    - Include correlation IDs for request tracking
    - _Requirements: 7.1, 7.2_

  - [ ] 12.2 Add performance logging
    - Log slow queries that exceed threshold
    - Log API calls that take longer than expected
    - Track and log WebSocket connection events
    - _Requirements: 7.3, 7.4_

  - [ ] 12.3 Implement health check endpoints
    - Create comprehensive health check for backend API
    - Add database and Redis connectivity checks
    - Create health check endpoint for WebSocket server
    - _Requirements: 7.5_

  - [ ] 12.4 Add monitoring dashboard or integration
    - Set up application insights or similar monitoring
    - Configure alerts for critical errors
    - Track key metrics (request rate, error rate, response time)
    - _Requirements: 7.1, 7.2, 7.4_

- [ ] 13. Configuration Management
  - [ ] 13.1 Create environment-specific configuration files
    - Set up appsettings.Development.json
    - Set up appsettings.Staging.json
    - Set up appsettings.Production.json
    - _Requirements: 10.3_

  - [ ] 13.2 Implement configuration validation at startup
    - Create ConfigurationValidator class
    - Validate required settings on application start
    - Fail fast with clear error messages for missing config
    - _Requirements: 10.4_

  - [ ] 13.3 Update environment variable documentation
    - Document all required environment variables
    - Provide example .env files for each environment
    - Add configuration guide to README
    - _Requirements: 10.1, 10.2_

  - [ ] 13.4 Enable production optimizations
    - Disable debug logging in production
    - Enable response compression
    - Configure HSTS and other security headers
    - _Requirements: 10.5_

- [ ] 14. Security Testing
  - [ ] 14.1 Write SQL injection prevention tests
    - Test parameterized queries
    - Attempt SQL injection attacks
    - Verify input sanitization
    - _Requirements: 1.1_

  - [ ] 14.2 Write CORS security tests
    - Test allowed origins
    - Test rejected origins
    - Verify CORS headers
    - _Requirements: 1.2_

  - [ ] 14.3 Write rate limiting tests
    - Test rate limit enforcement
    - Test rate limit bypass attempts
    - Verify rate limit headers
    - _Requirements: 8.1, 8.2_

  - [ ] 14.4 Write WebSocket security tests
    - Test origin validation
    - Test connection limits
    - Test unauthorized access attempts
    - _Requirements: 4.2, 4.4_

- [ ] 15. Documentation and Deployment
  - [ ] 15.1 Create security documentation
    - Document security features and configurations
    - Provide security best practices guide
    - Document incident response procedures
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 15.2 Create deployment guide
    - Document SSL certificate setup
    - Provide production deployment checklist
    - Document environment variable configuration
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 15.3 Update README with security improvements
    - List all security enhancements
    - Provide configuration examples
    - Add troubleshooting section
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [ ] 15.4 Perform security audit and penetration testing
    - Conduct thorough security review
    - Test all security measures
    - Document findings and remediation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.2_
