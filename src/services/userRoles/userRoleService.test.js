import { findRolesForUser, getRolesForUser } from './userRoleService.js'
import { validateUserRoleAssignmentDocument } from './userRoleDataSource.js'

const document = validateUserRoleAssignmentDocument({
  schemaVersion: '1.0',
  definitionsVersion: '1',
  updatedAt: '2026-11-05T00:00:00Z',
  users: [
    { entraObjectId: 'user-1', roles: ['VRO5--Owner', 'PLDN--Skipper'] },
    { entraObjectId: 'user-2', roles: ['PLDN--Owner'] }
  ]
})

describe('#userRoleService', () => {
  describe('findRolesForUser', () => {
    test('Should return the assigned roles for a known user', () => {
      expect(findRolesForUser(document, 'user-1')).toEqual([
        'PLDN--Skipper',
        'VRO5--Owner'
      ])
    })

    test('Should return an empty array for an unknown user', () => {
      expect(findRolesForUser(document, 'unknown-user')).toEqual([])
    })

    test('Should return an empty array when the user identifier is missing', () => {
      expect(findRolesForUser(document, undefined)).toEqual([])
    })

    test('Should return roles in deterministic ascending lexical order', () => {
      expect(findRolesForUser(document, 'user-1')).toEqual(
        [...findRolesForUser(document, 'user-1')].sort()
      )
    })

    test('Should not allow a returned roles array to mutate later results', () => {
      const firstCall = findRolesForUser(document, 'user-1')
      firstCall.push('injected-role')

      expect(findRolesForUser(document, 'user-1')).toEqual([
        'PLDN--Skipper',
        'VRO5--Owner'
      ])
    })
  })

  describe('getRolesForUser', () => {
    test('Should include schema and definitions version metadata', () => {
      const result = getRolesForUser('unknown-user')

      expect(result.schemaVersion).toBe('1.0')
      expect(result.definitionsVersion).toBe('1')
      expect(result.roles).toEqual([])
    })
  })
})
