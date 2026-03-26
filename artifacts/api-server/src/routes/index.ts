import { Router, type IRouter } from "express";
import elevenLabsRouter from "./elevenlabs";
import enhanceRouter from "./enhance";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhanceRouter);
router.use(elevenLabsRouter);

export default router;
