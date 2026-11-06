import { getRolesForUser } from '#/services/userRoles/userRoleService.js'

// Direct mock user-role inspection endpoint. Unauthenticated; the path
// parameter is an opaque lookup value, not a validated Entra object ID.
export const userRoles = {
  method: 'GET',
  path: '/users/{entraObjectId}/roles',
  handler: (request, h) => {
    const { entraObjectId } = request.params
    const { schemaVersion, definitionsVersion, roles } =
      getRolesForUser(entraObjectId)

    return h.response({
      schemaVersion,
      definitionsVersion,
      userId: entraObjectId,
      roles
    })
  }
}
