import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByUserId,
  findUserByUsername,
  updateUserDataById,
} from "../services/userService.js";

export const registerUser = async (req, res, next) => {
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
    if(error.code === '23505') {
      error.status = 409
      error.message = "username or email already exist"
    }
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const usernameStr = username.toLowerCase();

    const user = await findUserByUsername(usernameStr);

    if (!user) {
      const error = new Error("Invalid username");
      error.status = 400;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const error = new Error("Invalid username or password");
      error.status = 400;
      throw error;
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
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await findUserByUserId(userId);

    if (!user) {
      const error = new Error("Invalid User ID");
      error.status = 404;
      throw error;
    }
    res.status(200).json({ message: "Get data successfully", data: user });
  } catch (error) {
    next(error);
  }
};

//ไม่ให้ user แก้ไข username & email
export const updateUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { first_name, last_name, password, phone } = req.body;

    if (!first_name || !last_name || !phone) {
      const error = new Error("Please input all fields before submit");
      error.status = 400;
      throw error;
    }

    const updateUser = await updateUserDataById(userId, {
      first_name,
      last_name,
      password,
      phone,
    });

    if (!updateUser) {
      const error = new Error("Update Failed");
      error.status = 404;
      throw error;
    }
    res
      .status(200)
      .json({ message: "Update Data Successfully", data: updateUser });
  } catch (error) {
    next(error);
  }
};
