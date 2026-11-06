import { buildTokenClaimsResponse } from '#/services/tokenClaims/tokenClaimsService.js'

// Entra OnTokenIssuanceStart custom authentication extension endpoint.
// Deliberately unauthenticated and unvalidated: see docs/mock-user-profile-service.md.
// Only `data.user.id` is read; any Authorization header is ignored.
export const identity = {
  method: 'POST',
  path: '/identity/token-claims',
  handler: (request, h) => {
    const entraObjectId = request.payload?.data?.user?.id

    return h.response(buildTokenClaimsResponse(entraObjectId))
  }
}
