import Contact from '../models/contact.model.js';

export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // ── Validation ────────────────────────────────────────────────
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Simple email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // ── Save to DB ────────────────────────────────────────────────
    const contact = await Contact.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      message: String(message).trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We will contact you soon.',
      data: {
        id: contact._id,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── GET /api/contact ────────────────────────────────────────────
export const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const isRead = req.query.isRead;

    const filter = {};

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Contact.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: contacts,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

// ─── PATCH /api/contact/:id/read ────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Marked as read',
      data: contact,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};