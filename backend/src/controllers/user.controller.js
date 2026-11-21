import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// ================= LOGIN =================

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Username and Password are required"
            });
        }

        // Find User
        const user = await User.findOne({ username });

        console.log("User Found:", user);

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User Not Found"
            });
        }

        // Compare Password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        console.log("Entered Password:", password);
        console.log("Stored Password:", user.password);
        console.log("Password Match:", isPasswordCorrect);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Username or Password"
            });
        }

        // Generate Token
        const token = crypto.randomBytes(20).toString("hex");

        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({
            message: "Login Successful",
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

// ================= REGISTER =================

const register = async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            username,
            password: hashedPassword
        });

        console.log("User Registered:", user);

        return res.status(httpStatus.CREATED).json({
            message: "User Registered Successfully"
        });

    } catch (error) {
        console.log(error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: error.message
        });
    }
};

// ================= HISTORY =================

const getUserHistory = async (req, res) => {
    try {
        const { token } = req.query;

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({
                message: "Invalid Token"
            });
        }

        const meetings = await Meeting.find({
            user_id: user.username
        });

        return res.json(meetings);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// ================= ADD HISTORY =================

const addToHistory = async (req, res) => {
    try {
        const { token, meeting_code } = req.body;

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({
                message: "Invalid Token"
            });
        }

        await Meeting.create({
            user_id: user.username,
            meetingCode: meeting_code
        });

        return res.status(201).json({
            message: "Meeting Added Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export {
    login,
    register,
    getUserHistory,
    addToHistory
};