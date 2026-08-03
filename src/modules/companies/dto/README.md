# `modules/companies/dto/`

Data Transfer Objects — `class-validator`-decorated request bodies validated by the global
`ValidationPipe` before they reach the controller.

| File | What it does |
| --- | --- |
| `create-company.dto.ts` | Validates `POST /companies` body: `name` (required), optional `description`, optional `ownerUserId`. |
