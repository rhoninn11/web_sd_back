import { DBImg, img64 } from "../types/03_sd_t";
import { DBRecord, DBStore} from "./DBStore";


let fromDBRecord = (db_record: DBRecord): DBImg => {
    let elo = new DBImg()
    elo.id = parseInt(db_record.uuid);
    elo.img = JSON.parse(db_record.json);

    return elo;
}

let toDBRecord = (db_img: DBImg): DBRecord => {
    let elo = new DBRecord()
    elo.uuid = db_img.id.toString();
    elo.json = JSON.stringify(db_img.img);
    return elo;
}


export class ImgRepo {
    private static instance: ImgRepo;
    private DBStore: DBStore | undefined = undefined;
    private images: DBImg[] = [];

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
        if (images) this.images = images.map((db_record) => fromDBRecord(db_record));
    }

    public insert_image(img: img64) {
        let img_id = this.images.length;
        let img_uuid = img_id.toString();
        img.id = img_id;
        
        this.images.push(new DBImg().from(img));
        
        let json = JSON.stringify(img);
        this.DBStore?.insert_image(img_uuid, json);
        return img_id
    }
}