# Mock User Profile Service

> This service is a development mock. Its endpoints do not authenticate callers, authorize requests,
> validate bearer tokens, or verify that token-claims requests originated from Microsoft Entra. It uses
> manually maintained JSON files, does not connect to a database, and must not be deployed as the
> production User Profile Service or exposed to the public internet.

## Mock data

Two manually maintained, version-controlled JSON files back the mock service. Both are validated on load;
invalid data produces a safe internal error rather than being silently accepted.

### `src/data/user-role-assignments.json`

Maps a mock Entra object identifier to the vessel-scoped roles assigned to that user, for example
`VRO5--Owner`. An identifier that is not present in the file is treated as an unknown user and always
receives an empty role list — there is no default role.

### `src/data/roles-definitions.json`

Defines the base roles (`Owner`, `Skipper`, `ReadOnlyUser`, …) and the capability identifiers each role
grants per consuming `serviceId` (for example `catch-recording`). Only `enabled: true` roles, and only
capabilities whose `serviceId` matches the requested service, are ever returned.

These two documents are deliberately separate contracts:

- **User-role assignment** — who has which vessel-scoped role.
- **Role definition** — what a base role is allowed to do for one consuming service.

### Updating mock data

Edit the JSON files directly and restart the application (`npm run dev` watches the files via `node
--watch`, so a save is sufficient in development; `npm start` requires a manual restart). There is no
runtime write endpoint, file watcher, or refresh mechanism — changes only take effect after the process
reloads the file.

## Internal token-claims contract

The internal token-claims service builds the Microsoft Entra custom authentication extension response
shape (`microsoft.graph.onTokenIssuanceStartResponseData` / `provideClaimsForToken`) containing an
`applicationRoles` claim. It does not authenticate the caller, validate a bearer token, or sign/issue a
token — those responsibilities belong to Microsoft Entra (or the local Mock Entra Token Issuer in
development).
