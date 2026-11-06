import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import Boom from '@hapi/boom'

import { roleDefinitionsSchema } from '#/services/roleDefinitions/roleDefinitionSchema.js'

const defaultDataPath = fileURLToPath(
  new URL('../../data/roles-definitions.json', import.meta.url)
)

/**
 * Parses and validates a role-to-capability definitions document.
 * Exported separately from file loading so tests can exercise validation
 * with synthetic documents without touching the filesystem.
 */
export function validateRoleDefinitionsDocument(document) {
  const { error, value } = roleDefinitionsSchema.validate(document, {
    abortEarly: false
  })

  if (error) {
    throw Boom.internal('Mock role-definitions data is invalid')
  }

  return Object.freeze({
    ...value,
    roles: Object.freeze(
      value.roles.map((role) =>
        Object.freeze({
          ...role,
          capabilities: Object.freeze(
            role.capabilities.map((capability) =>
              Object.freeze({ ...capability })
            )
          )
        })
      )
    )
  })
}

/**
 * Loads, parses and validates the committed role-definitions JSON file.
 * Returns an immutable in-memory representation that cannot be mutated by callers.
 */
export function loadRoleDefinitions(path = defaultDataPath) {
  let raw

  try {
    raw = readFileSync(path, 'utf-8')
  } catch {
    throw Boom.internal('Mock role-definitions data could not be read')
  }

  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw Boom.internal('Mock role-definitions data is not valid JSON')
  }

  return validateRoleDefinitionsDocument(parsed)
}
