import {
  createNewDog,
  deleteDogByDogId,
  getDogsByUserId,
  updateDogsByDogId,
} from "../services/dogService.js";

export const createDog = async (req, res, next) => {
  try {
    const { name, breed, age, weight, health_conditions } = req.body;
    if (!name || !breed || !age || !weight) {
      const error = new Error("Please provide all required data");
      error.status = 400;
      throw error;
    }
    const userId = req.user.id;
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
    const dogId = parseInt(req.params.id);
    if (isNaN(dogId)) {
      const error = new Error("Invalid Dog ID format");
      error.status = 400;
      throw error;
    }

    const { name, breed, age, weight, health_conditions } = req.body;

    if (!name || !breed || !age || !weight) {
      const error = new Error("Please input all fields before submit");
      error.status = 400;
      throw error;
    }

    if (isNaN(age) || isNaN(weight)) {
      const error = new Error("Please input only numbers");
      error.status = 400;
      throw error;
    }

    const userId = req.user.id;
    const updateDog = await updateDogsByDogId(dogId, userId, {
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
    const dogId = parseInt(req.params.id);
    const userId = req.user.id;
    if (isNaN(dogId)) {
      const error = new Error("Invalid dog ID format");
      error.status = 400;
      throw error;
    }
    await deleteDogByDogId(userId, dogId);

    res.status(200).json({ message: "Dog Deleted Successfully" });
  } catch (error) {
    next(error);
  }
};
