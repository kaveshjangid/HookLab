# HookLab

A professional dark-theme webhook testing workspace.

## Run locally
Requires Node.js 20+.

```bash
npm install
npm run dev
```
Frontend: http://localhost:5173  
API: http://localhost:4000  
Default test endpoint: `http://localhost:4000/hooks/demo`

Test it:
```bash
curl -X POST http://localhost:4000/hooks/demo -H "Content-Type: application/json" -d "{\"event\":\"payment.success\",\"payment_id\":\"pay_test_123\",\"amount\":79900}"
```

## Features
- Create/delete webhook endpoints
- Capture incoming HTTP requests, headers, query and body
- Request history, search and payload inspector
- Sample test events and request replay
- JSON-file persistence for local development
- Responsive dark dashboard

## Security
This is a development starter, not a production-hardened public service. Avoid real secrets and sensitive customer data. Captured credential headers are redacted. Replay blocks common private/reserved destinations, but production deployments need additional SSRF protections, authentication, rate limiting, retention controls and monitoring. JSON storage is intended for local demos; use a persistent database for multi-user production use.
