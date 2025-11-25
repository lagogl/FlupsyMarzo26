# LCI Module (Life Cycle Inventory)

## ECOTAPES Integration Module - Delta Futuro FLUPSY Management System

### Overview
Independent module for Life Cycle Inventory management supporting ECOTAPES project requirements.

### Architecture
- **Completely isolated** from core app functionality
- **Read-only adapters** for accessing existing production data
- **Dedicated database tables** with `lci_` prefix
- **Feature flag** enabled via `lci_settings` table

### Database Tables
| Table | Description |
|-------|-------------|
| `lci_materials` | Equipment and infrastructure inventory |
| `lci_consumables` | Trackable consumables definition |
| `lci_consumption_logs` | Periodic consumption logs |
| `lci_production_snapshots` | Production snapshots for LCI reports |
| `lci_reports` | Generated LCI reports |
| `lci_settings` | Module configuration |

### API Endpoints

#### Status
- `GET /api/lci/status` - Module status and settings

#### Materials
- `GET /api/lci/materials` - List all materials
- `GET /api/lci/materials/:id` - Get material by ID
- `POST /api/lci/materials` - Create new material
- `PUT /api/lci/materials/:id` - Update material
- `DELETE /api/lci/materials/:id` - Soft delete material
- `GET /api/lci/materials/categories` - List categories
- `GET /api/lci/materials/by-category/:category` - Materials by category
- `POST /api/lci/materials/bulk-import` - Bulk import from Excel

#### Consumables
- `GET /api/lci/consumables` - List consumables
- `GET /api/lci/consumables/:id` - Get consumable by ID
- `POST /api/lci/consumables` - Create consumable
- `PUT /api/lci/consumables/:id` - Update consumable
- `DELETE /api/lci/consumables/:id` - Soft delete consumable
- `GET /api/lci/consumables/:id/logs` - Consumption logs
- `POST /api/lci/consumables/:id/logs` - Add consumption log
- `GET /api/lci/consumables/summary/:year` - Yearly summary

#### Production (READ-ONLY from app data)
- `GET /api/lci/production/calculate/:year` - Calculate from app
- `GET /api/lci/production/snapshots` - List snapshots
- `POST /api/lci/production/snapshots` - Create snapshot
- `POST /api/lci/production/generate/:year` - Auto-generate from app

#### Reports
- `GET /api/lci/reports` - List reports
- `GET /api/lci/reports/:id` - Get report
- `POST /api/lci/reports` - Create report
- `POST /api/lci/reports/:id/finalize` - Finalize report
- `GET /api/lci/reports/generate/:year` - Generate report data

#### Adapters (READ-ONLY)
- `GET /api/lci/flupsy/overview` - FLUPSY system overview
- `GET /api/lci/lots/input/:year` - Lots input data

### Configuration
Enable/disable module via `lci_settings` table:
```sql
UPDATE lci_settings SET value = 'true' WHERE key = 'lci_module_enabled';
```

### Security Notes
- All mutating endpoints use Zod schema validation
- Delete operations are soft-deletes (set `active = false`)
- Module is isolated: no foreign keys to core tables
- Future: Add authentication middleware for production use
