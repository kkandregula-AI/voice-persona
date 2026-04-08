import { Router, type IRouter } from "express";
import elevenLabsRouter from "./elevenlabs";
import enhanceRouter from "./enhance";
import healthRouter from "./health";
import insightsRouter from "./insights";
import liveCaptionsRouter from "./livecaptions";
import ocrRouter from "./ocr";
import roomsRouter from "./rooms";
import transcribeRouter from "./transcribe";
import translateRouter from "./translate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhanceRouter);
router.use(elevenLabsRouter);
router.use(transcribeRouter);
router.use(insightsRouter);
router.use(liveCaptionsRouter);
router.use(ocrRouter);
router.use(roomsRouter);
router.use(translateRouter);

export default router;
