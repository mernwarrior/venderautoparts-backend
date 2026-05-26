import generalSettingsModel from "../models/generalSettings.model.js";
import * as settingService from "../services/settings.service.js";
import { updatePricingValidation } from "../validations/settings.validator.js";

export const getSettings = async (req, res) => {
  try {
    const result = await settingService.getSettings();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getEntrantSettings = async (req, res) => {
  try {
    const result = await settingService.getEntrantSettings();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getAbout = async (req, res) => {
  try {
    const result = await settingService.getAbout();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateAbout = async (req, res) => {
  try {
    const { id } = req.params; 
    const payload = req.body;

    const result = await settingService.updateAbout(id, payload);

    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const hero = {
      title: data.title,
      subtitle: data.subtitle,
      trustText: data.trustText,
     
    };
    if (req.files?.bgImage?.[0]) {
      hero.bgImage = req.files.bgImage[0].relativePath;
    }

    const featuredRaffles = {
      title: data.featuredTitle,
      description: data.featuredDescription,
    };

    const numbersSpeak = {
      title: data.numbersSpeakTitle,
      items: data.numbersSpeakItems ? JSON.parse(data.numbersSpeakItems) : [],
    };

    // Parse tools items
    const toolsItems = data.toolsSectionItems
      ? JSON.parse(data.toolsSectionItems)
      : [];

    // Attach uploaded icon files to their respective items by index
    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        const match = fieldName.match(/^toolsIcon_(\d+)$/);
        if (match) {
          const index = parseInt(match[1], 10);
          if (toolsItems[index] && req.files[fieldName]?.[0]) {
            toolsItems[index].icon = req.files[fieldName][0].relativePath;
          }
        }
      });
    }

    const toolsSection = {
      title: data.toolsSectionTitle,
      items: toolsItems,
    };

    const startRaffleSection = {
      smallHeading: data.startRaffleSmallHeading,
      titleHeading: data.startRaffleTitleHeading,
      description: data.startRaffleDescription,
    };

    const result = await settingService.updateSettings(id, {
      hero,
      featuredRaffles,
      numbersSpeak,
      toolsSection,
      startRaffleSection,
    });

    return res.status(result.httpStatus).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateEntrantSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const hero = {
      title: data.title,
      subtitle: data.subtitle,
      trustText: data.trustText,
       smallDesc:data.smallDesc,
    };
    if (req.files?.bgImage?.[0]) {
      hero.bgImage = req.files.bgImage[0].relativePath;
    }

    const featuredRaffles = {
      title: data.featuredTitle,
      description: data.featuredDescription,
    };

    const numbersSpeak = {
      title: data.numbersSpeakTitle,
      items: data.numbersSpeakItems ? JSON.parse(data.numbersSpeakItems) : [],
    };

    // Parse tools items
    const toolsItems = data.toolsSectionItems
      ? JSON.parse(data.toolsSectionItems)
      : [];

    // Attach uploaded icon files to their respective items by index
    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        const match = fieldName.match(/^toolsIcon_(\d+)$/);
        if (match) {
          const index = parseInt(match[1], 10);
          if (toolsItems[index] && req.files[fieldName]?.[0]) {
            toolsItems[index].icon = req.files[fieldName][0].relativePath;
          }
        }
      });
    }

    const toolsSection = {
      title: data.toolsSectionTitle,
      items: toolsItems,
    };

    const startRaffleSection = {
      smallHeading: data.startRaffleSmallHeading,
      titleHeading: data.startRaffleTitleHeading,
      description: data.startRaffleDescription,
    };

    const result = await settingService.updateEntrantSettings(id, {
      hero,
      featuredRaffles,
      numbersSpeak,
      toolsSection,
      startRaffleSection,
    });

    return res.status(result.httpStatus).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateFaqSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { pageHeading, sections } = req.body; 

    const result = await settingService.updateFaqSettings(id, { pageHeading, sections });
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getFaqSettings = async (req, res) => {
  try {
    const result = await settingService.getFaqSettings();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


export const getFeatures = async (req, res) => {
  try {
    const result = await settingService.getFeatures();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const payload = {
      pageHeading: data.pageHeading,
      heroSubtitle: data.heroSubtitle,
      categories: data.categories || [],
    };

    const result = await settingService.updateFeatures(id, payload);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getPricing = async (req, res) => {
  try {
    const result = await settingService.getPricing();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // const { error } = updatePricingValidation.validate(data);
    // if (error) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: error.details[0].message,
    //   });
    // }

    const payload = {
      hero: data.hero,
      plans: data.plans || [],
    };

    const result = await settingService.updatePricing(id, payload);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateGeneralSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const footer = {
      logo: data.logo,
      copyright: data.copyright,
      // flag and flagname removed
    };

    let socialMedia = data.socialMedia
      ? JSON.parse(data.socialMedia)
      : [];

    footer.socialMedia = socialMedia;

    if (req.files?.logo?.[0]) {
      footer.logo = req.files.logo[0].relativePath;
    }

    const result = await settingService.updateGeneralSettings(id, { footer });
    return res.status(result.httpStatus).json(result);

  } catch (error) {
    console.error("updateGeneralSettings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getGeneralSettings = async (req, res) => {
  try {
    const result = await settingService.getGeneralSettings();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getTerms = async (req, res) => {
  try {
    const result = await settingService.getTerms();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateTerms = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const result = await settingService.updateTerms(id, payload);

    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getPrivacy = async (req, res) => {
  try {
    const result = await settingService.getPrivacy();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updatePrivacy = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const result = await settingService.updatePrivacy(id, payload);

    return res.status(result.httpStatus).json(result);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};