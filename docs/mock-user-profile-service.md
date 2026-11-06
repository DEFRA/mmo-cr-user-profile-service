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

## Local startup

```bash
npm install
npm run dev
```

The server listens on the host/port configured by `src/config.js` (`HOST` / `PORT` environment variables,
defaulting to `0.0.0.0:3001`). Verify it is reachable with:

```bash
curl http://localhost:3001/health
```

No additional configuration is required to exercise the mock endpoints described below.

## API

All endpoints below are unauthenticated and perform no strict request validation, consistent with the
warning at the top of this document.

### `GET /health`

Confirms the service is reachable. Does not check database, Entra, Microsoft Graph, or any other
dependency.

```
GET /health HTTP/1.1
```

```
HTTP/1.1 200 OK
```

### `POST /identity/token-claims`

Receives an event shaped like a Microsoft Entra `OnTokenIssuanceStart` custom authentication extension
request, extracts `data.user.id` as an opaque lookup key, and returns the assigned roles as
`applicationRoles` using the official Entra custom-extension response envelope. Any `Authorization` header
is accepted but ignored — the request is never authenticated.

Known-user request:

```json
{
  "type": "microsoft.graph.authenticationEvent.tokenIssuanceStart",
  "source": "/tenants/00000000-0000-0000-0000-000000000001/applications/33333333-3333-3333-3333-333333333333",
  "data": {
    "@odata.type": "microsoft.graph.onTokenIssuanceStartCalloutData",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "authenticationContext": {
      "correlationId": "20ee06ca-57f5-46ec-9b69-4d3f4cf22783",
      "client": {
        "servicePrincipalId": "22222222-2222-2222-2222-222222222222",
        "appId": "33333333-3333-3333-3333-333333333333",
        "displayName": "Catch Recording Mobile"
      }
    },
    "user": { "id": "11111111-2222-3333-4444-555555555555" }
  }
}
```

Known-user response:

```json
{
  "data": {
    "@odata.type": "microsoft.graph.onTokenIssuanceStartResponseData",
    "actions": [
      {
        "@odata.type": "microsoft.graph.provideClaimsForToken",
        "claims": { "applicationRoles": ["PLDN--Skipper", "VRO5--Owner"] }
      }
    ]
  }
}
```

Unknown user, or a request with `data.user.id` absent, returns the same envelope with
`"applicationRoles": []`. No default role is ever assigned. A reusable copy of all three JSON shapes
(request, known-user response, empty-role response) lives under
[`src/services/tokenClaims/fixtures`](../src/services/tokenClaims/fixtures).

These fixtures are representative test data only, not a strict production validation schema: the mock does
not validate `type`, `source`, `tenantId`, `@odata.type`, the calling application, or the correlation ID.

### `GET /users/{entraObjectId}/roles`

Direct inspection of a mock user's assigned roles. `entraObjectId` is an opaque lookup value — it is not
validated as a real Entra object identifier.

```
GET /users/11111111-2222-3333-4444-555555555555/roles HTTP/1.1
```

```json
{
  "schemaVersion": "1.0",
  "definitionsVersion": "1",
  "userId": "11111111-2222-3333-4444-555555555555",
  "roles": ["PLDN--Skipper", "VRO5--Owner"]
}
```

An unknown user returns `200 OK` with `"roles": []` — never a default role.

### `GET /roles-definitions/services/{serviceId}`

Returns the enabled roles and capability identifiers that one consuming service (for example
`catch-recording`) owns. `serviceId` is an opaque, exact-match lookup value.

```
GET /roles-definitions/services/catch-recording HTTP/1.1
```

```json
{
  "schemaVersion": "1.0",
  "definitionsVersion": "1",
  "serviceId": "catch-recording",
  "updatedAt": "2026-11-05T00:00:00Z",
  "roles": [
    {
      "roleId": "Owner",
      "capabilityIds": [
        "catch-record.create",
        "catch-record.read",
        "catch-record.submit",
        "catch-record.update"
      ]
    },
    { "roleId": "ReadOnlyUser", "capabilityIds": ["catch-record.read"] },
    {
      "roleId": "Skipper",
      "capabilityIds": ["catch-record.amend", "catch-record.read"]
    }
  ]
}
```

An unknown service returns `200 OK` with `"roles": []`. This means no role grants a capability for that
service — it must never be interpreted as unrestricted access. Disabled roles and capabilities owned by
another `serviceId` are always excluded.

### Safe error behaviour

If a mock JSON file is missing or fails validation, every endpoint above returns a generic
`500 Internal Server Error` (`{ "statusCode": 500, "error": "Internal Server Error", "message": "An
internal server error occurred" }`) with no stack trace, filesystem path, or raw parser output.

## Entra integration

```
Microsoft Entra feature: Custom Authentication Extension
Event:                   OnTokenIssuanceStart
Returned claims object:  applicationRoles
Final access-token claim: vessel_roles
```

The Mock User Profile Service only returns `applicationRoles`. Mapping `applicationRoles` to the final
`vessel_roles` token claim, and signing the resulting access token, is performed by Mock Entra (or real
Microsoft Entra External ID) — never by this service.

## Responsibility boundaries

```
Mock Entra
    → Token issuance and signing
    → Maps applicationRoles to vessel_roles

Mock User Profile Service
    → User-role lookup
    → Role-to-capability definitions
    → Does not authenticate callers, validate bearer tokens, or sign tokens

Catch Recording Service
    → Validates the signed access token
    → Resolves vessel_roles to capabilities
    → Applies business authorization
```
