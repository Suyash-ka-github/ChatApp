import express from "express";
import { loginUser, verifyUser, myProfile, updateName, getAllUsers, getAUser} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router=express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUser);


router.get("/me",isAuth, myProfile);
router.get("/user/all",isAuth, getAllUsers);
router.get("/user/:id", isAuth, getAUser);

router.put("/update/name", isAuth, updateName);

export default router;