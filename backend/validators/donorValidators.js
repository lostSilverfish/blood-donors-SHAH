const Joi = require('joi');

// Blood types enum
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Simplified donor creation validation schema - only essential fields
const createDonorSchema = Joi.object({
  donor_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Donor name must be at least 2 characters long',
      'string.max': 'Donor name cannot exceed 100 characters',
      'any.required': 'Donor name is required'
    }),
  
  blood_type: Joi.string()
    .valid(...bloodTypes)
    .required()
    .messages({
      'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-',
      'any.required': 'Blood type is required'
    }),
  
  contact_number: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid contact number',
      'any.required': 'Contact number is required'
    }),
  
  date_of_last_donation: Joi.alternatives()
    .try(
      Joi.date().iso().max('now'),
      Joi.string().allow('', null)
    )
    .allow(null)
    .messages({
      'date.max': 'Last donation date cannot be in the future'
    }),

  is_active: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false').custom((value) => value === 'true'),
      Joi.number().valid(0, 1).custom((value) => Boolean(value))
    )
    .default(true)
});

// Simplified donor update validation schema (all fields optional)
const updateDonorSchema = Joi.object({
  donor_name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Donor name must be at least 2 characters long',
      'string.max': 'Donor name cannot exceed 100 characters'
    }),
  
  blood_type: Joi.string()
    .valid(...bloodTypes)
    .messages({
      'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-'
    }),
  
  contact_number: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid contact number'
    }),
  
  date_of_last_donation: Joi.alternatives()
    .try(
      Joi.date().iso().max('now'),
      Joi.string().allow('', null)
    )
    .allow(null)
    .messages({
      'date.max': 'Last donation date cannot be in the future'
    }),
  
  is_active: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.string().valid('true', 'false').custom((value) => value === 'true'),
      Joi.number().valid(0, 1).custom((value) => Boolean(value))
    )
}).min(1); // At least one field must be provided for update

// Blood type query validation
const bloodTypeQuerySchema = Joi.object({
  blood_type: Joi.string()
    .valid(...bloodTypes)
    .required()
    .messages({
      'any.only': 'Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-',
      'any.required': 'Blood type is required'
    })
});

module.exports = {
  createDonorSchema,
  updateDonorSchema,
  bloodTypeQuerySchema,
  bloodTypes
}; 