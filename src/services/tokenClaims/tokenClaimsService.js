import { getRolesForUser } from '#/services/userRoles/userRoleService.js'

/**
 * Builds the Microsoft Entra custom authentication extension response for an
 * OnTokenIssuanceStart event, using the roles assigned to `data.user.id`.
 *
 * Does not authenticate the caller, validate a bearer token, validate the
 * event envelope, or sign/issue a token. An absent or unknown user identifier
 * always produces an empty `applicationRoles` collection — no default role
 * is ever assigned.
 */
export function buildTokenClaimsResponse(entraObjectId) {
  const { roles } = getRolesForUser(entraObjectId)

  return {
    data: {
      '@odata.type': 'microsoft.graph.onTokenIssuanceStartResponseData',
      actions: [
        {
          '@odata.type': 'microsoft.graph.provideClaimsForToken',
          claims: {
            applicationRoles: roles
          }
        }
      ]
    }
  }
}
