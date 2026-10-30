import { Router } from "express";
import {loginUser,registerUser,addToHistory,getUserHistory} from "../controllers/User.Controller.js";
const userRouter = Router();

userRouter.post("/login",loginUser);
userRouter.post("/register",registerUser);
userRouter.post("/add_to_activity",addToHistory);
userRouter.get("/get_user_history",getUserHistory);

export {userRouter};