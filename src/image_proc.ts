import sharp from "sharp";
import { img64 } from "./types/03_sd_t"


export const processRGB2webPng_base64 = (rgb: img64) => {
    let format = "png"
    let png = new img64()
    let rgb_data = Buffer.from(rgb.img64, 'base64');
    
    png.id = rgb.id
    png.x = rgb.x
    png.y = rgb.y

    return new Promise<img64>((resolve, reject) => {
        sharp(rgb_data, { raw: { width: rgb.x, height: rgb.y, channels: 3 } })
            .webp({ quality: 100 })
            .toBuffer((err, buffer, info) => {
                let base64 = buffer.toString('base64');
                let prefix = `data:image/${format};base64,`
                png.img64 = prefix + base64;
                png.mode = format;


                resolve(png)
            })
    })
}