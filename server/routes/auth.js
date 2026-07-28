import express from 'express';
import {
  checkEmail,
  register,
  login,
  resendVerification,
  logout,
  getUser,
  updateProfile,
  resetPassword
} from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post("/check-email", checkEmail);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/resend-verification", resendVerification);
authRouter.post("/logout", logout);
authRouter.get("/get-user", getUser);
authRouter.put("/update-profile", updateProfile);
authRouter.put("/reset-password", resetPassword);

export default authRouter;
