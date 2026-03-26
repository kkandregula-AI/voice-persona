import { Router, type IRouter } from "express";
import enhanceRouter from "./enhance";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enhanceRouter);

export default router;
