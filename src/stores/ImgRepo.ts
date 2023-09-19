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
        // console.log('+++ images fetched')
        // console.log(images)
        if (images) this.images = images.map((db_record) => fromDBRecord(db_record));

    }

    public insert_image(new_img: img64) {
        let img_id = this.images.length;
        new_img.id = img_id;
        
        this.images.push(new DBImg().from(new_img));
        this.DBStore?.insert_image(img_id.toString(), JSON.stringify(new_img));
        return new_img
    }

    
    public get_all_imgs() {
        return this.images;
    }

    public get_img(uuid: string) {
        let img = this.images.find((img) => {
            // console.log(`+++ ${img.id.toString()} === ${uuid}`)
            return img.id.toString() === uuid
        });
        return img;
    }
}