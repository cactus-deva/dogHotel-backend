import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByUserId,
  findUserByUsername,
  updateUserDataById,
} from "../services/userService.js";

export const registerUser = async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const { first_name, last_name, password, email, phone } = req.body;

    const newUser = await createUser({
      first_name,
      last_name,
      username,
      password,
      email,
      phone,
    });

    res.status(201).json({
      message: "Register Successfully",
      data: newUser,
    });
  } catch (error) {
    if (error.code === "23505") {
      // unique_violation
      res.status(409).json({
        message: "Username or email already exists",
      });
    } else {
      res.status(500).json({
        message: error.message,
      });
    }
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usernameStr = username.toLowerCase();

    const user = await findUserByUsername(usernameStr);

    if (!user) {
      return res.status(400).json({ message: "Invalid Username" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid Username or Password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login Successful",
      data: {
        userId: user.id,
        name: user.first_name,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      token,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findUserByUserId(userId);

    if (user) {
      res.status(200).json({ message: "Get data successfully", data: user });
    } else {
      return res.status(404).json({ message: "User ID invalid" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//ไม่ให้ user แก้ไข username & email
export const updateUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { first_name, last_name, password, phone } = req.body;

    const updateUser = await updateUserDataById(userId, {
      first_name,
      last_name,
      password,
      phone,
    });

    if (updateUser) {
      res
        .status(200)
        .json({ message: "Update Data Successfully", data: updateUser });
    } else {
      res.status(404).json({ message: "Update Data Failed" });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
