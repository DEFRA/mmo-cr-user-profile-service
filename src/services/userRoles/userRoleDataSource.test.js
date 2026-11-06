import {
  loadUserRoleAssignments,
  validateUserRoleAssignmentDocument
} from './userRoleDataSource.js'

const validDocument = {
  schemaVersion: '1.0',
  definitionsVersion: '1',
  updatedAt: '2026-11-05T00:00:00Z',
  users: [{ entraObjectId: 'user-1', roles: ['VRO5--Owner', 'PLDN--Skipper'] }]
}

describe('#userRoleDataSource', () => {
  describe('validateUserRoleAssignmentDocument', () => {
    test('Should accept a valid document', () => {
      expect(() =>
        validateUserRoleAssignmentDocument(validDocument)
      ).not.toThrow()
    })

    test('Should throw when schemaVersion is missing', () => {
      const { schemaVersion, ...withoutSchemaVersion } = validDocument

      expect(() =>
        validateUserRoleAssignmentDocument(withoutSchemaVersion)
      ).toThrow()
    })

    test('Should throw when schemaVersion is unsupported', () => {
      expect(() =>
        validateUserRoleAssignmentDocument({
          ...validDocument,
          schemaVersion: '99.0'
        })
      ).toThrow()
    })

    test('Should throw when updatedAt is not a valid timestamp', () => {
      expect(() =>
        validateUserRoleAssignmentDocument({
          ...validDocument,
          updatedAt: 'not-a-date'
        })
      ).toThrow()
    })

    test('Should throw when users is missing', () => {
      const { users, ...withoutUsers } = validDocument

      expect(() => validateUserRoleAssignmentDocument(withoutUsers)).toThrow()
    })

    test('Should throw on duplicate user identifiers', () => {
      expect(() =>
        validateUserRoleAssignmentDocument({
          ...validDocument,
          users: [
            { entraObjectId: 'user-1', roles: ['VRO5--Owner'] },
            { entraObjectId: 'user-1', roles: ['PLDN--Skipper'] }
          ]
        })
      ).toThrow()
    })

    test('Should throw on duplicate roles within one user', () => {
      expect(() =>
        validateUserRoleAssignmentDocument({
          ...validDocument,
          users: [
            {
              entraObjectId: 'user-1',
              roles: ['VRO5--Owner', 'VRO5--Owner']
            }
          ]
        })
      ).toThrow()
    })

    test('Should return a document whose users array cannot be mutated', () => {
      const document = validateUserRoleAssignmentDocument(validDocument)

      expect(() => document.users.push({})).toThrow()
      expect(() => (document.users[0].roles[0] = 'tampered')).toThrow()
    })
  })

  describe('loadUserRoleAssignments', () => {
    test('Should load and validate the committed mock data file', () => {
      const document = loadUserRoleAssignments()

      expect(document.schemaVersion).toBe('1.0')
      expect(Array.isArray(document.users)).toBe(true)
      expect(document.users.length).toBeGreaterThan(0)
    })

    test('Should throw a safe internal error when the file is missing', () => {
      expect(() =>
        loadUserRoleAssignments('/nonexistent/path/user-role-assignments.json')
      ).toThrow()
    })
  })
})
