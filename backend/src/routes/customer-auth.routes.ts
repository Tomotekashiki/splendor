import { Router } from "express";
import { CustomerAuthController } from "../controllers/customer-auth.controller.js";
import { requireCustomer } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", CustomerAuthController.register);
router.post("/login", CustomerAuthController.login);
router.get("/me", requireCustomer, CustomerAuthController.me);
router.post("/forgot-password", CustomerAuthController.forgotPassword);
router.post("/reset-password", CustomerAuthController.resetPassword);
router.put("/update-profile", requireCustomer, CustomerAuthController.updateProfile);
router.post("/fcm-token", requireCustomer, CustomerAuthController.registerFcmToken);
router.delete("/fcm-token", requireCustomer, CustomerAuthController.removeFcmToken);

router.get("/cars", requireCustomer, CustomerAuthController.getCustomerCars);
router.post("/cars", requireCustomer, CustomerAuthController.addCustomerCar);
router.delete("/cars/:carId", requireCustomer, CustomerAuthController.deleteCustomerCar);

export default router;
