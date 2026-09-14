import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/userController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
