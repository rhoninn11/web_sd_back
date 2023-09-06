
import { AuthHandler } from "./AuthHandler";
import { EdgeHandler } from "./EdgeHandler";
import { NodeHandler } from "./NodeHandler";
import { HandlerRepository } from "./HandlerRepository";
import { Txt2imgHandler } from "./Txt2imgHandler";
import { SDClient } from "../StableDiffusionConnect";
import { SyncHandler } from "./SyncHandler";


export const handRepositoryInit = (sd_client :SDClient) => {
    HandlerRepository.getInstance()
        .register_handler(new AuthHandler())
        .register_handler(new EdgeHandler())
        .register_handler(new NodeHandler())
        .register_handler(new Txt2imgHandler().bind_sd(sd_client))
        .register_handler(new SyncHandler());
}