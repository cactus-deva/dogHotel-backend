import {
  createNewDog,
  deleteDogByDogId,
  getDogsByUserId,
  updateDogsByDogId,
} from "../services/dogService.js";
import {
  sanitizeNumber,
  sanitizeString,
  validateMaxLength,
  validateMaxNumber,
} from "../utils/sanitizeHelper.js";

export const createDog = async (req, res, next) => {
  try {
    const name = sanitizeString(req.body.name);
    const breed = sanitizeString(req.body.breed);
    const age = sanitizeNumber(req.body.age);
    const weight = sanitizeNumber(req.body.weight);
    const health_conditions = sanitizeString(
      req.body.health_conditions || "none"
    );
    const userId = req.user.id;

    validateMaxNumber(age, 20, "Dog Age");
    validateMaxNumber(weight, 100, "Dog Weigth");
    validateMaxLength(name, 20, "Dog Name");
    validateMaxLength(health_conditions, 100, "Health Conditions");

    if (!name || !breed || !age || !weight) {
      const error = new Error("Please provide all required data");
      error.status = 400;
      throw error;
    }

    const newDog = await createNewDog(
      { name, breed, age, weight, health_conditions },
      userId
    );

    res.status(200).json({ message: "Dog Create Successfully", data: newDog });
  } catch (error) {
    next(error);
  }
};

//เรียกดูข้อมูลหมาของ user
export const getMyDogs = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      throw error;
    }

    const myDogs = await getDogsByUserId(userId);

    res
      .status(200)
      .json({ message: "Fetch your dogs successfully", data: myDogs });
  } catch (error) {
    next(error);
  }
};

export const updateDogById = async (req, res, next) => {
  try {
    const dogId = sanitizeNumber(req.params.id);
    const userId = req.user.id;
    const name = sanitizeString(req.body.name);
    const breed = sanitizeString(req.body.breed);
    const age = sanitizeNumber(req.body.age);
    const weight = sanitizeNumber(req.body.weight);
    const health_conditions = sanitizeString(
      req.body.health_conditions || "none"
    );

    validateMaxNumber(age, 20, "Dog Age");
    validateMaxNumber(weight, 100, "Dog Weigth");
    validateMaxLength(name, 20, "Dog Name");
    validateMaxLength(health_conditions, 100, "Health Conditions");

    if (!name || !breed || !age || !weight) {
      const error = new Error("Please input all fields before submit");
      error.status = 400;
      throw error;
    }

    const updateDog = await updateDogsByDogId({
      dogId,
      userId,
      name,
      breed,
      age,
      weight,
      health_conditions,
    });

    res
      .status(200)
      .json({ message: "Dog Update Successfully", data: updateDog });
  } catch (error) {
    next(error);
  }
};

export const deleteDogById = async (req, res, next) => {
  try {
    const dogId = sanitizeNumber(req.params.id);
    const userId = req.user.id;

    await deleteDogByDogId(userId, dogId);

    res.status(200).json({ message: "Dog Deleted Successfully" });
  } catch (error) {
    next(error);
  }
};
