import {
  createNewDog,
  deleteDogByDogId,
  getDogsByUserId,
  updateDogsByDogId,
} from "../services/dogService.js";

export const createDog = async (req, res) => {
  try {
    const { name, breed, age, weight, health_conditions } = req.body;
    if (!name || !breed || !age || !weight) {
      return res
        .status(400)
        .json({ message: "Please provide all required data" });
    }
    const userId = req.user.id;
    const newDog = await createNewDog(
      { name, breed, age, weight, health_conditions },
      userId
    );

    res.status(200).json({ message: "Dog Create Successfully", data: newDog });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message
    });
  }
};

//เรียกดูข้อมูลหมาของ user
export const getMyDogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const myDogs = await getDogsByUserId(userId);

    res
      .status(200)
      .json({ message: "Fetch your dogs successfully", data: myDogs });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dogs",
      error: error.message,
    });
  }
};

export const updateDogById = async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    if (isNaN(dogId)) {
      return res.status(200).json({ message: "Invalid Dog ID format" });
    }
    const { name, breed, age, weight, health_conditions } = req.body;
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
    res.status(error.status||500).json({
      message: error.message,
    });
  }
};

export const deleteDogById = async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    const userId = req.user.id;
    if (isNaN(dogId)) {
      return res.status(400).json({ message: "Invalid Dog ID format" });
    }
    await deleteDogByDogId(userId, dogId);

    res.status(200).json({ message: "Dog Deleted Successfully" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message,
    });
  }
};
