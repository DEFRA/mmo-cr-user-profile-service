import { getRoleDefinitionsForService } from '#/services/roleDefinitions/roleDefinitionService.js'

// Service-specific role-to-capability definitions endpoint. Unauthenticated;
// serviceId is an opaque exact-match lookup value. An empty roles array means
// no role grants a capability for that service — not unrestricted access.
export const roleDefinitions = {
  method: 'GET',
  path: '/roles-definitions/services/{serviceId}',
  handler: (request, h) => {
    const { serviceId } = request.params
    const { schemaVersion, definitionsVersion, updatedAt, roles } =
      getRoleDefinitionsForService(serviceId)

    return h.response({
      schemaVersion,
      definitionsVersion,
      serviceId,
      updatedAt,
      roles
    })
  }
}
