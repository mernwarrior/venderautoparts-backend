import Joi from "joi";

export const updateSettingsSchema = Joi.object({
  // HERO
  title: Joi.string().allow("").optional(),
  subtitle: Joi.string().allow("").optional(),
  trustText: Joi.string().allow("").optional(),

  // FEATURED
  featuredTitle: Joi.string().allow("").optional(),
  featuredDescription: Joi.string().allow("").optional(),
}).unknown(true);

export const updateEntrantSchema = Joi.object({
  // HERO
  title: Joi.string().allow("title").optional(),
  subtitle: Joi.string().allow("").optional(),
  trustText: Joi.string().allow("").optional(),
  smallDesc: Joi.string().allow("").optional(),

  // FEATURED
  featuredTitle: Joi.string().allow("").optional(),
  featuredDescription: Joi.string().allow("").optional(),
}).unknown(true);

export const updateAboutSchema = Joi.object({
  // HERO
  description: Joi.string()
      .trim()
      .min(10)
      .required("About Section is Required"),

}).unknown(true);

export const updateFaqSchema = Joi.object({
  pageHeading: Joi.string().allow("").optional(),
  sections: Joi.array().optional(),
}).unknown(true);

export const featureValidation = Joi.object({
  pageHeading: Joi.string().required(),
  heroSubtitle: Joi.string().required(),
  categories: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        features: Joi.array()
          .items(
            Joi.object({
              title: Joi.string().required(),
              description: Joi.string().required(),
            })
          )
          .min(1)
          .required(),
      })
    )
    .min(1)
    .required(),
});

export const updatePricingValidation = Joi.object({
  hero: Joi.object({
    heading: Joi.string().allow("").optional(),
    subheading: Joi.string().allow("").optional(),
  }).optional(),

  plans: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        tagline: Joi.string().allow("").optional(),
        badge: Joi.string().allow("").optional(),
        price: Joi.number().required(),
        currency: Joi.string().optional(),
        billingCycle: Joi.string().optional(),
        isPopular: Joi.boolean().optional(),
        buttonText: Joi.string().optional(),
        sortOrder: Joi.number().optional(),
        features: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),
}).unknown(true);

export const updateGeneralSettingsSchema = Joi.object({
  logo: Joi.string().allow("").optional(),
  flag: Joi.string().allow("").optional(),
  socialMedia: Joi.string().optional(), // JSON string
  copyright: Joi.string().allow("").optional(),
}).unknown(true);

export const updateTermsSchema = Joi.object({
  title: Joi.string().optional(),

  description: Joi.string()
    .trim()
    .min(10)
    .required()
    .messages({
      "string.empty": "Terms description is required",
      "string.min": "Minimum 10 characters required",
    }),
}).unknown(true);

export const updatePrivacySchema = Joi.object({
  title: Joi.string().optional(),

  description: Joi.string()
    .trim()
    .min(10)
    .required()
    .messages({
      "string.empty": "Privacy description is required",
      "string.min": "Minimum 10 characters required",
    }),
}).unknown(true);