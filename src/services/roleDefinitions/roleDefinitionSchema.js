import Joi from 'joi'

const SUPPORTED_SCHEMA_VERSIONS = ['1.0']

export const roleDefinitionsSchema = Joi.object({
  schemaVersion: Joi.string()
    .valid(...SUPPORTED_SCHEMA_VERSIONS)
    .required(),
  definitionsVersion: Joi.string().required(),
  updatedAt: Joi.string().isoDate().required(),
  roles: Joi.array()
    .items(
      Joi.object({
        roleId: Joi.string().min(1).required(),
        displayName: Joi.string().min(1).required(),
        description: Joi.string().min(1).required(),
        enabled: Joi.boolean().required(),
        capabilities: Joi.array()
          .items(
            Joi.object({
              capabilityId: Joi.string().min(1).required(),
              serviceId: Joi.string().min(1).required()
            })
          )
          .unique(
            (a, b) =>
              a.capabilityId === b.capabilityId && a.serviceId === b.serviceId
          )
          .required()
      })
    )
    .unique('roleId')
    .required()
}).required()
