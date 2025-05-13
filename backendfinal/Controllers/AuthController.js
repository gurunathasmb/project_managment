const bcrypt = require('bcrypt');
const User = require('../Models/User');
const jwt = require('jsonwebtoken');

// Signup Controller
const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                success: false
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            success: true
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Login Controller (not modified)
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const errMsg = 'Auth failed: email or password is incorrect';

        const existingUser = await User.findOne({ email });
        if (!existingUser || existingUser.role !== role) {
            return res.status(400).json({
                message: errMsg,
                success: false
            });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                message: errMsg,
                success: false
            });
        }

        const jwtToken = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '24H' });

        res.status(200).json({
            message: 'Login successful',
            success: true,
            token: jwtToken,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

module.exports = {
    signup,
    login
};
