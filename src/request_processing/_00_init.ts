
import { HandlerRepository } from "./HandlerRepository";

import { SDClient } from "../StableDiffusionConnect";

import { AuthHandler } from "./_01_AuthHandler";
import { NodeCrateHandler } from "./_02_NodeCrateHandler";
import { EdgeCrateHandler } from "./_03_EdgeCrateHandler";
import { SyncHandler } from "./_04_SyncHandler";
import { Txt2imgHandler } from "./_05_Txt2imgHandler";
import { Img2imgHandler } from "./_06_Img2imgHandler";
import { NodeUpdateHandler } from "./_07_NodeUpdateHandler";


export const handRepositoryInit = (sd_client :SDClient) => {
    HandlerRepository.getInstance()
        .register_handler(new AuthHandler())
        .register_handler(new EdgeCrateHandler())
        .register_handler(new NodeCrateHandler())
        .register_handler(new SyncHandler())
        .register_handler(new Txt2imgHandler().bind_sd(sd_client))
        .register_handler(new Img2imgHandler().bind_sd(sd_client))
        .register_handler(new NodeUpdateHandler())
}