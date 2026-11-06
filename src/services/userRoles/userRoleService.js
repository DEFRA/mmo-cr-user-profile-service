import { loadUserRoleAssignments } from '#/services/userRoles/userRoleDataSource.js'

let cachedDocument

function getDocument() {
  if (!cachedDocument) {
    cachedDocument = loadUserRoleAssignments()
  }

  return cachedDocument
}

/**
 * Finds the vessel-scoped roles assigned to a user within an already-validated
 * user-role assignment document. Exported separately from the file-backed
 * lookup so it can be unit tested with synthetic documents.
 *
 * Returns an empty, deterministically ordered array for an unknown or missing
 * user identifier. No default role is ever assigned.
 */
export function findRolesForUser(document, entraObjectId) {
  if (!entraObjectId) {
    return []
  }

  const user = document.users.find((u) => u.entraObjectId === entraObjectId)

  if (!user) {
    return []
  }

  return [...user.roles].sort((a, b) => a.localeCompare(b))
}

/**
 * Returns the roles assigned to a user identifier, backed by the committed
 * mock user-role assignment file, along with the document's version metadata.
 */
export function getRolesForUser(entraObjectId) {
  const document = getDocument()

  return {
    schemaVersion: document.schemaVersion,
    definitionsVersion: document.definitionsVersion,
    roles: findRolesForUser(document, entraObjectId)
  }
}
