import {
  loadUserRoleAssignments,
  validateUserRoleAssignmentDocument
} from './userRoleDataSource.js'

const validDocument = {
  schemaVersion: '1.0',
  definitionsVersion: '1',
  updatedAt: '2026-11-05T00:00:00Z',
  users: [
    { entraObjectId: 'user-1', roles: ['BM45--Owner', 'PH1234--Skipper'] }
  ]
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
            { entraObjectId: 'user-1', roles: ['BM45--Owner'] },
            { entraObjectId: 'user-1', roles: ['PH1234--Skipper'] }
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
              roles: ['BM45--Owner', 'BM45--Owner']
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
    test('Should throw a safe internal error when the file is missing', () => {
      expect(() =>
        loadUserRoleAssignments('/nonexistent/path/user-role-assignments.json')
      ).toThrow()
    })
  })
})
