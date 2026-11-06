import { loadRoleDefinitions } from '#/services/roleDefinitions/roleDefinitionDataSource.js'

let cachedDocument

function getDocument() {
  if (!cachedDocument) {
    cachedDocument = loadRoleDefinitions()
  }

  return cachedDocument
}

/**
 * Filters an already-validated role-definitions document down to the enabled
 * roles and capabilities that belong to the requested service, in
 * deterministic order. Exported separately from the file-backed lookup so it
 * can be unit tested with synthetic documents.
 *
 * Returns an empty array for an unknown service. An empty result means no
 * role grants a capability for that service — it must never be treated as
 * unrestricted access.
 */
export function findRoleDefinitionsForService(document, serviceId) {
  if (!serviceId) {
    return []
  }

  return document.roles
    .filter((role) => role.enabled)
    .map((role) => ({
      roleId: role.roleId,
      capabilityIds: role.capabilities
        .filter((capability) => capability.serviceId === serviceId)
        .map((capability) => capability.capabilityId)
        .sort()
    }))
    .filter((role) => role.capabilityIds.length > 0)
    .sort((a, b) => a.roleId.localeCompare(b.roleId))
}

/**
 * Returns the role-to-capability definitions for a service, backed by the
 * committed mock role-definitions file, along with version metadata.
 */
export function getRoleDefinitionsForService(serviceId) {
  const document = getDocument()

  return {
    schemaVersion: document.schemaVersion,
    definitionsVersion: document.definitionsVersion,
    updatedAt: document.updatedAt,
    roles: findRoleDefinitionsForService(document, serviceId)
  }
}
