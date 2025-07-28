const Joi = require('joi');

// Signup validation schema
const signupValidation = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(30).required(),
        role: Joi.string().valid("student", "teacher").required(),
        semester: Joi.when('role', {
            is: 'student',
            then: Joi.number().integer().min(1).max(8).required(),
            otherwise: Joi.forbidden()
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad request", error });
    }
    next();
}

// Login validation schema
const loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(30).required(),
        role: Joi.string().valid("student", "teacher").required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad request", error });
    }
    next();
}

module.exports = {
    signupValidation,
    loginValidation
};
