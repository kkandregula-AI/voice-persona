import { Router, type IRouter } from "express";
import elevenLabsRouter from "./elevenlabs";
import enhanceRouter from "./enhance";
import healthRouter from "./health";
import transcribeRouter from "./transcribe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhanceRouter);
router.use(elevenLabsRouter);
router.use(transcribeRouter);

export default router;
