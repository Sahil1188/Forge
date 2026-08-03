# `modules/employees/dto/`

| File | What it does |
| --- | --- |
| `create-employee.dto.ts` | Validates employee creation: `name`, `role`, optional `description`/`department`/`managerEmployeeId`, a nested `runtimeConfig` (runtimeKey/provider/modelPolicy/settings), and a `skills[]` array. Nested objects validated with `@ValidateNested` + `@Type`. |
