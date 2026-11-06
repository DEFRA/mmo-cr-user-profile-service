import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import Boom from '@hapi/boom'

import { userRoleAssignmentSchema } from '#/services/userRoles/userRoleSchema.js'

const defaultDataPath = fileURLToPath(
  new URL('../../data/user-role-assignments.json', import.meta.url)
)

/**
 * Parses and validates a user-role assignment document.
 * Exported separately from file loading so tests can exercise validation
 * with synthetic documents without touching the filesystem.
 */
export function validateUserRoleAssignmentDocument(document) {
  const { error, value } = userRoleAssignmentSchema.validate(document, {
    abortEarly: false
  })

  if (error) {
    throw Boom.internal('Mock user-role assignment data is invalid')
  }

  return Object.freeze({
    ...value,
    users: Object.freeze(
      value.users.map((user) =>
        Object.freeze({
          ...user,
          roles: Object.freeze([...user.roles])
        })
      )
    )
  })
}

/**
 * Loads, parses and validates the committed user-role assignment JSON file.
 * Returns an immutable in-memory representation that cannot be mutated by callers.
 */
export function loadUserRoleAssignments(path = defaultDataPath) {
  let raw

  try {
    raw = readFileSync(path, 'utf-8')
  } catch {
    throw Boom.internal('Mock user-role assignment data could not be read')
  }

  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw Boom.internal('Mock user-role assignment data is not valid JSON')
  }

  return validateUserRoleAssignmentDocument(parsed)
}
