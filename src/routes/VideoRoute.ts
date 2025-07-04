import {Router} from "express";
import Auth from "@/middleware/Auth";
import Multer from "@/config/Multer";
import VideoValidation from "@/validation/VideoValidation";
import VideoController from "@/controller/VideoController";

class VideoRoute {
    private static router = Router();

    public static route(): Router {
        this.router.post("/generate", Auth.authorize(), Multer.uploader, VideoValidation.generate(), VideoController.generate);
        this.router.get("/", VideoValidation.getVideos(), VideoController.getPublicVideos);
        this.router.get("/my-creations", VideoValidation.getVideos(), Auth.authorize(), VideoController.getUserVideos);
        this.router.get("/favorites", Auth.authorize(), VideoValidation.getVideos(), VideoController.getFavoriteVideos);
        this.router.get("/:videoId/details", Auth.authorize(), VideoController.getVideoDetails);
        this.router.post("/:videoId/view", VideoController.incrementView);
        this.router.post("/:videoId/like", Auth.authorize(), VideoController.toggleLike);
        this.router.get("/results/:resultId", VideoController.getResultById);
        return this.router;
    }
}

export default VideoRoute;