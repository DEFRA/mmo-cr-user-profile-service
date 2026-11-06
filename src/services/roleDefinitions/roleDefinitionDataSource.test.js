import {
  loadRoleDefinitions,
  validateRoleDefinitionsDocument
} from './roleDefinitionDataSource.js'

const validDocument = {
  schemaVersion: '1.0',
  definitionsVersion: '1',
  updatedAt: '2026-11-05T00:00:00Z',
  roles: [
    {
      roleId: 'Owner',
      displayName: 'Owner',
      description: 'Owner role',
      enabled: true,
      capabilities: [
        { capabilityId: 'catch-record.read', serviceId: 'catch-recording' }
      ]
    }
  ]
}

describe('#roleDefinitionDataSource', () => {
  describe('validateRoleDefinitionsDocument', () => {
    test('Should accept a valid document', () => {
      expect(() => validateRoleDefinitionsDocument(validDocument)).not.toThrow()
    })

    test('Should throw when schemaVersion is unsupported', () => {
      expect(() =>
        validateRoleDefinitionsDocument({
          ...validDocument,
          schemaVersion: '2.0'
        })
      ).toThrow()
    })

    test('Should throw when updatedAt is not a valid timestamp', () => {
      expect(() =>
        validateRoleDefinitionsDocument({
          ...validDocument,
          updatedAt: 'not-a-date'
        })
      ).toThrow()
    })

    test('Should throw on duplicate role identifiers', () => {
      expect(() =>
        validateRoleDefinitionsDocument({
          ...validDocument,
          roles: [validDocument.roles[0], validDocument.roles[0]]
        })
      ).toThrow()
    })

    test('Should throw on duplicate capability and service mappings within a role', () => {
      expect(() =>
        validateRoleDefinitionsDocument({
          ...validDocument,
          roles: [
            {
              ...validDocument.roles[0],
              capabilities: [
                {
                  capabilityId: 'catch-record.read',
                  serviceId: 'catch-recording'
                },
                {
                  capabilityId: 'catch-record.read',
                  serviceId: 'catch-recording'
                }
              ]
            }
          ]
        })
      ).toThrow()
    })

    test('Should throw when enabled is not a boolean', () => {
      expect(() =>
        validateRoleDefinitionsDocument({
          ...validDocument,
          roles: [{ ...validDocument.roles[0], enabled: 'yes' }]
        })
      ).toThrow()
    })

    test('Should return a document whose roles cannot be mutated', () => {
      const document = validateRoleDefinitionsDocument(validDocument)

      expect(() => document.roles.push({})).toThrow()
      expect(() => document.roles[0].capabilities.push({})).toThrow()
    })
  })

  describe('loadRoleDefinitions', () => {
    test('Should load and validate the committed mock data file', () => {
      const document = loadRoleDefinitions()

      expect(document.schemaVersion).toBe('1.0')
      expect(Array.isArray(document.roles)).toBe(true)
      expect(document.roles.length).toBeGreaterThan(0)
    })

    test('Should throw a safe internal error when the file is missing', () => {
      expect(() =>
        loadRoleDefinitions('/nonexistent/path/roles-definitions.json')
      ).toThrow()
    })
  })
})
