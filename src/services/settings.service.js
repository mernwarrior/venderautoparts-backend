import HomeHost from "../models/homeHost.model.js";
import homeEntrantModel from "../models/homeEntrant.model.js";

import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { getCache, setCache, deleteCache } from "../utils/cacheService.js";
import aboutModel from "../models/about.model.js";
import faqModel from "../models/faq.model.js";
import featuresModel from "../models/features.Model.js";
import priceModel from "../models/price.model.js";
import generalSettingsModel from "../models/generalSettings.model.js";

import TermsModel from "../models/term.model.js";
import privacyModel from "../models/privacy.model.js";
const CACHE_KEY_HOST = "settings:home:host";
const CACHE_KEY_ENTRANT = "settings:home:entrant";
const CACHE_KEY_ABOUT = "settings:about"
const CACHE_KEY_FAQ = "settings:faq"
const CACHE_KEY_FEATURE = "feature_settings";
const CACHE_KEY_PRICING = "pricing_page";
const CACHE_KEY_GENERAL = "settings:general";
const CACHE_KEY_TERMS = "TERMS_PAGE";
const CACHE_KEY_PRIVACY = "PRIVACY_PAGE";

const errorResponse = (message, httpStatus = HTTP_STATUS.BAD_REQUEST) => ({
  status: RESPONSE_STATUS.ERROR,
  message,
  httpStatus,
});

export const getSettings = async () => {
  try {
    const cached = await getCache(CACHE_KEY_HOST);
    if (cached) return cached;

    const settings = await HomeHost.findOne().lean();

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Settings"),
      data: settings || {},
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(CACHE_KEY_HOST, response, 120);
    return response;

  } catch (error) {
    console.error("getSettings error:", error);
    return errorResponse(error.message || "Something went wrong", HTTP_STATUS.SERVER_ERROR);
  }
};

export const getAbout = async () => {
  try {
    const cached = await getCache(CACHE_KEY_ABOUT);
    if (cached) return cached;

    const Aboutsettings = await aboutModel.findOne().lean();

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("About"),
      data: Aboutsettings || {},
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(CACHE_KEY_ABOUT, response, 120);
    return response;

  } catch (error) {
    console.error("getAbout error:", error);
    return errorResponse(error.message || "Something went wrong", HTTP_STATUS.SERVER_ERROR);
  }
};

export const getEntrantSettings = async () => {
  try {
    const cached = await getCache(CACHE_KEY_ENTRANT);
    if (cached) return cached;

    const settings = await homeEntrantModel.findOne().lean();

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Settings"),
      data: settings || {},
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(CACHE_KEY_ENTRANT, response, 120);
    return response;

  } catch (error) {
    console.error("getSettings error:", error);
    return errorResponse(error.message || "Something went wrong", HTTP_STATUS.SERVER_ERROR);
  }
};

export const getFaqSettings = async () => {
  try {
    const cached = await getCache(CACHE_KEY_FAQ);
    if (cached) return cached;

    const settings = await faqModel.findOne().lean();

    const response = {
      status: "success",
      message: "FAQ retrieved",
      data: settings || {},
      httpStatus: 200,
    };

    await setCache(CACHE_KEY_FAQ, response, 120);
    return response;
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};

export const getFeatures = async () => {
  try {
    const cached = await getCache(CACHE_KEY_FEATURE);
    if (cached) return cached;

    const settings = await featuresModel.findOne().lean();

    const response = {
      status: "success",
      message: "Feature settings retrieved",
      data: settings || {},
      httpStatus: 200,
    };

    await setCache(CACHE_KEY_FEATURE, response, 120);
    return response;
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};


export const updateSettings = async (id, payload) => {
  try {
    const existing = await HomeHost.findById(id);

    
    const existingData = existing ?? {};

    const merged = {
      hero: {
        ...existingData.hero,
        ...payload.hero,
      },
      featuredRaffles: {
        ...existingData.featuredRaffles,
        ...payload.featuredRaffles,
      },
      numbersSpeak: {
        title:
          payload.numbersSpeak?.title ??
          existingData.numbersSpeak?.title,
        items:
          payload.numbersSpeak?.items ??
          existingData.numbersSpeak?.items ??
          [],
      },
      toolsSection: {
        title:
          payload.toolsSection?.title ?? existingData.toolsSection?.title,
        items:
          payload.toolsSection?.items !== undefined
            ? payload.toolsSection.items
            : existingData.toolsSection?.items ?? [],
      },
      startRaffleSection: {
        ...existingData.startRaffleSection,
        ...payload.startRaffleSection,
      },
    };

    const settings = await HomeHost.findByIdAndUpdate(
      id,
      { $set: merged },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await deleteCache(CACHE_KEY_HOST);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Settings"),
      data: settings,
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error("upsertSettings error:", error);
    return errorResponse(error.message || "Something went wrong", HTTP_STATUS.SERVER_ERROR);
  }
};

export const updateEntrantSettings = async (id, payload) => {
  try {
    const existing = await homeEntrantModel.findById(id) || {};

    const merged = {
      hero: {
        ...existing.hero,
        ...payload.hero,
      },
      featuredRaffles: {
        ...existing.featuredRaffles,
        ...payload.featuredRaffles,
      },
      numbersSpeak: {
        title:
          payload.numbersSpeak?.title ||
          existing.numbersSpeak?.title,

        items:
          payload.numbersSpeak?.items ||
          existing.numbersSpeak?.items ||
          [],
      },
      toolsSection: {
        title:
          payload.toolsSection?.title ?? existing.toolsSection?.title,

        items:
          payload.toolsSection?.items !== undefined
            ? payload.toolsSection.items
            : existing.toolsSection?.items || [],
      },

      startRaffleSection: {
        ...existing.startRaffleSection,
        ...payload.startRaffleSection,
      },


    }

    const settings = await homeEntrantModel.findByIdAndUpdate(
      id,
      { $set: merged },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    await deleteCache(CACHE_KEY_ENTRANT)

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Settings"),
      data: settings,
      httpStatus: HTTP_STATUS.OK,
    }

  } catch (error) {
    console.error("upsertSettings error:", error)
    return errorResponse(error.message || "Something went wrong", HTTP_STATUS.SERVER_ERROR)
  }
}

export const updateAbout = async (id, payload) => {
  try {
    const updated = await aboutModel.findByIdAndUpdate(
      id,
      {
        $set: {
          description: payload.description,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await deleteCache(CACHE_KEY_ABOUT);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("About"),
      data: updated,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error("updateAbout error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

export const updateFaqSettings = async (id, payload) => {
  try {
    const existing = await faqModel.findById(id).lean() ?? {};

    const merged = {
      pageHeading: payload.pageHeading ?? existing.pageHeading,
      sections: payload.sections !== undefined  
        ? payload.sections
        : existing.sections ?? [],
    };

    const settings = await faqModel
      .findByIdAndUpdate(id, { $set: merged }, { new: true, upsert: true })
      .lean();

    await deleteCache(CACHE_KEY_FAQ);

    return { status: "success", message: "FAQ updated successfully", data: settings, httpStatus: 200 };
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};

export const updateFeatures = async (id, payload) => {
  try {
    const existing = (await featuresModel.findById(id)) || {};

    const merged = {
      pageHeading: payload.pageHeading ?? existing.pageHeading,
      heroSubtitle: payload.heroSubtitle ?? existing.heroSubtitle,
      categories:
        payload.categories !== undefined
          ? payload.categories
          : existing.categories || [],
    };

    const settings = await featuresModel
      .findByIdAndUpdate(id, { $set: merged }, { new: true, upsert: true })
      .lean();

    await deleteCache(CACHE_KEY_FEATURE);

    return {
      status: "success",
      message: "Feature settings updated successfully",
      data: settings,
      httpStatus: 200,
    };
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};


export const getPricing = async () => {
  try {
    const cached = await getCache(CACHE_KEY_PRICING);
    if (cached) return cached;

    const settings = await priceModel.findOne().lean();

    const response = {
      status: "success",
      message: "Pricing retrieved successfully",
      data: settings || {},
      httpStatus: 200,
    };

    await setCache(CACHE_KEY_PRICING, response, 120);
    return response;
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};

export const updatePricing = async (id, payload) => {
  try {
    const existing = (await priceModel.findById(id)) || {};

    const merged = {
      hero: payload.hero ?? existing.hero ?? {},
      plans: payload.plans !== undefined
        ? payload.plans
        : existing.plans || [],
    };

    const settings = await priceModel
      .findByIdAndUpdate(id, { $set: merged }, { new: true, upsert: true })
      .lean();

    await deleteCache(CACHE_KEY_PRICING);

    return {
      status: "success",
      message: "Pricing updated successfully",
      data: settings,
      httpStatus: 200,
    };
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};


export const getGeneralSettings = async () => {
  try {
    const cached = await getCache(CACHE_KEY_GENERAL);
    if (cached) return cached;

    const settings = await generalSettingsModel.findOne().lean();

    const response = {
      status: "success",
      message: "General settings retrieved",
      data: settings || {},
      httpStatus: 200,
    };

    await setCache(CACHE_KEY_GENERAL, response, 120);
    return response;

  } catch (error) {
    console.error("getGeneralSettings error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      500
    );
  }
};

export const updateGeneralSettings = async (id, payload) => {
  try {
    const existing = await generalSettingsModel.findById(id);
    const existingData = existing ?? {};

    const merged = {
      footer: {
        ...existingData.footer,
        ...payload.footer,

        // ✅ array safe merge
        socialMedia:
          payload.footer?.socialMedia !== undefined
            ? payload.footer.socialMedia
            : existingData.footer?.socialMedia ?? [],
      },
    };

    const settings = await generalSettingsModel.findByIdAndUpdate(
      id,
      { $set: merged },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await deleteCache(CACHE_KEY_GENERAL);

    return {
      status: "success",
      message: "General settings updated",
      data: settings,
      httpStatus: 200,
    };

  } catch (error) {
    console.error("updateGeneralSettings error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      500
    );
  }
};


export const getTerms = async () => {
  try {
    const cached = await getCache(CACHE_KEY_TERMS);
    if (cached) return cached;

    const termsSettings = await TermsModel.findOne().lean();

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Terms"),
      data: termsSettings || {},
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(CACHE_KEY_TERMS, response, 120);
    return response;

  } catch (error) {
    console.error("getTerms error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

export const updateTerms = async (id, payload) => {
  try {
    const updated = await TermsModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title: payload.title,
          description: payload.description,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await deleteCache(CACHE_KEY_TERMS);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Terms"),
      data: updated,
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error("updateTerms error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};


export const getPrivacy = async () => {
  try {
    const cached = await getCache(CACHE_KEY_PRIVACY);
    if (cached) return cached;

    const privacySettings = await privacyModel.findOne().lean();

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Privacy"),
      data: privacySettings || {},
      httpStatus: HTTP_STATUS.OK,
    };

    await setCache(CACHE_KEY_PRIVACY, response, 120);
    return response;

  } catch (error) {
    console.error("getPrivacy error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

export const updatePrivacy = async (id, payload) => {
  try {
    const updated = await privacyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title: payload.title,
          description: payload.description,
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await deleteCache(CACHE_KEY_PRIVACY);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Privacy"),
      data: updated,
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error("updatePrivacy error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};