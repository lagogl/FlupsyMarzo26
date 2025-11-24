# AI Enhanced Module

⚠️ **EXPERIMENTAL MODULE - FOR TESTING ONLY**

## Overview

This module enhances DeepSeek AI with full database knowledge, enabling natural language queries and intelligent data analysis.

## Features

- 🧠 **Database Knowledge Base**: AI has complete understanding of all 54 database tables
- 🔍 **Natural Language Queries**: Ask questions in plain language, get SQL queries + insights
- 📊 **Multi-Table Analysis**: AI can join and correlate data across multiple tables
- 💡 **Recommendations**: Get actionable suggestions based on data patterns
- 🔄 **Conversational**: Multi-turn conversations with context retention

## Security Configuration

This module requires API key authentication to prevent unauthorized access.

### Setup API Key

1. Generate a secure random string (minimum 16 characters):
   ```bash
   openssl rand -hex 32
   ```

2. Set environment variable:
   ```bash
   export AI_ENHANCED_API_KEY="your-secure-key-here"
   ```

3. Restart the application

### Using the API

Include the API key in requests via header or query param:

**Header (recommended):**
```bash
curl -H "X-AI-API-Key: your-key" http://localhost:5000/api/ai-enhanced/ask
```

**Query param:**
```bash
curl http://localhost:5000/api/ai-enhanced/ask?apiKey=your-key
```

## API Endpoints

### Public Endpoints
- `GET /api/ai-enhanced/health` - Health check (no auth required)

### Protected Endpoints (require API key)
- `GET /api/ai-enhanced/metadata` - Database metadata
- `GET /api/ai-enhanced/database-description` - Full DB description
- `POST /api/ai-enhanced/ask` - Ask AI a question
- `POST /api/ai-enhanced/execute-query` - Execute AI-generated query
- `POST /api/ai-enhanced/ask-and-execute` - Ask + execute in one step
- `POST /api/ai-enhanced/conversation/ask` - Conversational Q&A
- `DELETE /api/ai-enhanced/conversation/:id` - Clear conversation
- `GET /api/ai-enhanced/tables` - List available tables
- `GET /api/ai-enhanced/tables/:name` - Table details

## Security Features

1. **API Key Authentication** - Prevents unauthorized access
2. **Table Whitelist** - Only 24 safe tables accessible, blocks `users`, `email_config`, etc
3. **Query Validation** - Blocks destructive queries (DROP, DELETE, UPDATE, INSERT, ALTER)
4. **Column Filtering** - Blocks access to `password`, `api_key`, `token`, `secret` columns
5. **Audit Logging** - All queries logged with timestamp
6. **Query Limits** - Automatic LIMIT 1000 on results

## Example Usage

```typescript
// Ask a question
const response = await fetch('/api/ai-enhanced/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-AI-API-Key': 'your-key-here'
  },
  body: JSON.stringify({
    question: 'Quali cestelli crescono più lentamente del previsto?',
    mode: 'analysis'
  })
});

const data = await response.json();
console.log(data.analysis);
console.log(data.sqlQuery);
console.log(data.insights);
console.log(data.recommendations);
```

## Production Deployment

⚠️ **DO NOT deploy to production without:**

1. Implementing full authentication system (session/JWT)
2. Adding role-based authorization (admin-only access)
3. Rate limiting to prevent abuse
4. More robust SQL parser to prevent injection
5. Database query auditing and monitoring
6. IP whitelisting or VPN access restriction

This module is designed for **testing and experimentation** only.

## Architecture

```
server/modules/ai-enhanced/
├── metadata.service.ts      # Database schema documentation
├── enhanced-ai.service.ts   # DeepSeek integration with DB context
├── enhanced-ai.controller.ts # Express routes with API key auth
└── README.md               # This file

client/src/pages/
└── AIEnhanced.tsx          # Testing UI
```

## Troubleshooting

**"Modulo AI Enhanced non configurato"**
- Set `AI_ENHANCED_API_KEY` environment variable (min 16 chars)

**"Non autorizzato. API key richiesta"**
- Include API key in `X-AI-API-Key` header or `?apiKey=` query param

**"Query non permessa: accesso a tabella sensibile"**
- Query tries to access blocked tables like `users`, `email_config`
- Use only whitelisted tables: flupsys, baskets, cycles, operations, etc

**"Query non permessa: contiene parola chiave distruttiva"**
- Only SELECT queries allowed, no DROP/DELETE/UPDATE/INSERT

## Future Enhancements

- [ ] Rate limiting per API key
- [ ] Proper SQL parser (instead of regex)
- [ ] User-based access control
- [ ] Query result caching
- [ ] Export to CSV/Excel
- [ ] Scheduled reports
- [ ] Email alerts for anomalies
