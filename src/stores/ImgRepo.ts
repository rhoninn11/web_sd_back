import { img64 } from "../types/types_sd";
import { DBRecord, DBStore} from "./DBStore";

export class imgDBRecord {
    id: number = -1;
    uuid: string = '';
    img: img64 = new img64();

    public fromDBRecord(db_record: DBRecord) {
        this.id = db_record.id;
        this.uuid = db_record.uuid;
        this.img = JSON.parse(db_record.json);
        return this;
    }
}


export class ImgRepo {
    private static instance: ImgRepo;
    private DBStore: DBStore | undefined = undefined;
    private images: imgDBRecord[] = [];

    private constructor() {
    }

    public static getInstance(): ImgRepo {
        if (!ImgRepo.instance) {
            ImgRepo.instance = new ImgRepo();
        }

        return ImgRepo.instance;
    }

    public async bindDBStore(DBStore: DBStore) {
        this.DBStore = DBStore;
        await this._fetch_images();
    }

    public async _fetch_images() {
        let images = await this.DBStore?.get_images();
        if (images) this.images = images.map((db_record) => new imgDBRecord().fromDBRecord(db_record));
    }

    public insert_image(uuid: string, img: img64) {
        let json = JSON.stringify(img);
        this.DBStore?.insert_image(uuid, json);
    }
}