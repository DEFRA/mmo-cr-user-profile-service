import Joi from 'joi'

const SUPPORTED_SCHEMA_VERSIONS = ['1.0']

export const userRoleAssignmentSchema = Joi.object({
  schemaVersion: Joi.string()
    .valid(...SUPPORTED_SCHEMA_VERSIONS)
    .required(),
  definitionsVersion: Joi.string().required(),
  updatedAt: Joi.string().isoDate().required(),
  users: Joi.array()
    .items(
      Joi.object({
        entraObjectId: Joi.string().min(1).required(),
        roles: Joi.array().items(Joi.string().min(1)).unique().required()
      })
    )
    .unique('entraObjectId')
    .required()
}).required()
