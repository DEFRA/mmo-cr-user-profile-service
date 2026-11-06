import {
  findRoleDefinitionsForService,
  getRoleDefinitionsForService
} from './roleDefinitionService.js'
import { validateRoleDefinitionsDocument } from './roleDefinitionDataSource.js'

const document = validateRoleDefinitionsDocument({
  schemaVersion: '1.0',
  definitionsVersion: '1',
  updatedAt: '2026-11-05T00:00:00Z',
  roles: [
    {
      roleId: 'Skipper',
      displayName: 'Skipper',
      description: 'Skipper role',
      enabled: true,
      capabilities: [
        { capabilityId: 'catch-record.amend', serviceId: 'catch-recording' },
        { capabilityId: 'catch-record.read', serviceId: 'catch-recording' }
      ]
    },
    {
      roleId: 'Owner',
      displayName: 'Owner',
      description: 'Owner role',
      enabled: true,
      capabilities: [
        { capabilityId: 'catch-record.create', serviceId: 'catch-recording' },
        { capabilityId: 'reference.read', serviceId: 'reference-data' }
      ]
    },
    {
      roleId: 'DisabledRole',
      displayName: 'Disabled',
      description: 'Disabled role',
      enabled: false,
      capabilities: [
        { capabilityId: 'catch-record.read', serviceId: 'catch-recording' }
      ]
    },
    {
      roleId: 'OtherServiceOnly',
      displayName: 'Other service only',
      description: 'Has no catch-recording capabilities',
      enabled: true,
      capabilities: [
        { capabilityId: 'reference.read', serviceId: 'reference-data' }
      ]
    }
  ]
})

describe('#roleDefinitionService', () => {
  describe('findRoleDefinitionsForService', () => {
    test('Should return only enabled roles with capabilities for the requested service', () => {
      const result = findRoleDefinitionsForService(document, 'catch-recording')

      expect(result).toEqual([
        { roleId: 'Owner', capabilityIds: ['catch-record.create'] },
        {
          roleId: 'Skipper',
          capabilityIds: ['catch-record.amend', 'catch-record.read']
        }
      ])
    })

    test('Should exclude disabled roles', () => {
      const result = findRoleDefinitionsForService(document, 'catch-recording')

      expect(
        result.find((role) => role.roleId === 'DisabledRole')
      ).toBeUndefined()
    })

    test('Should exclude capabilities belonging to another service', () => {
      const result = findRoleDefinitionsForService(document, 'catch-recording')
      const owner = result.find((role) => role.roleId === 'Owner')

      expect(owner.capabilityIds).not.toContain('reference.read')
    })

    test('Should omit roles with no matching capabilities for the service', () => {
      const result = findRoleDefinitionsForService(document, 'catch-recording')

      expect(
        result.find((role) => role.roleId === 'OtherServiceOnly')
      ).toBeUndefined()
    })

    test('Should return an empty array for an unknown service', () => {
      expect(
        findRoleDefinitionsForService(document, 'unknown-service')
      ).toEqual([])
    })

    test('Should return roles ordered by roleId and capabilities ordered by capabilityId', () => {
      const result = findRoleDefinitionsForService(document, 'catch-recording')

      expect(result.map((role) => role.roleId)).toEqual(['Owner', 'Skipper'])
      expect(result[1].capabilityIds).toEqual([
        'catch-record.amend',
        'catch-record.read'
      ])
    })
  })

  describe('getRoleDefinitionsForService', () => {
    test('Should preserve version metadata', () => {
      const result = getRoleDefinitionsForService('unknown-service')

      expect(result.schemaVersion).toBe('1.0')
      expect(result.definitionsVersion).toBe('1')
      expect(result.updatedAt).toBeDefined()
      expect(result.roles).toEqual([])
    })
  })
})
