
export class SDComUtils {
    public static obj2json2bytes(obj: any): Buffer {
        let json_text: string = "";
        // TODO - handle possible errors
        json_text = JSON.stringify(obj);
        let data_bytes = Buffer.from(json_text, 'utf8');
        return data_bytes;
    }

    private static before_parse_info = (len: number): void => {
        process.stdout.write(` +SDCOM+ json len: ${len}, parse: BEFORE !+!`);
    }

    private static after_parse_info = (): void => {
        process.stdout.write(` After !+!n`);
    }

    public static bytes2json2obj(bytes: Buffer): any {
        let json = bytes.toString('utf8');
        let j_len = json.length;
        let last_char = json[j_len - 1]
        if (last_char == '\0') {
            json = json.slice(0, j_len - 1);
        }

        let obj = JSON.parse(json);
        
        return obj;
    }

    public static wrap_data(bytes: Buffer): Buffer {
        let b_num = bytes.byteLength

        let last_byte = bytes[b_num - 1];
        if (last_byte != 0) {
            let new_bytes = Buffer.alloc(b_num + 1);
            bytes.copy(new_bytes, 0, 0, b_num);
            new_bytes[b_num] = 0;
            b_num += 1;
            bytes = new_bytes;
        }

        let len_bytes = Buffer.alloc(4);
        len_bytes.writeUInt32LE(b_num, 0);

        let tcp_bytes = Buffer.concat([len_bytes, bytes]);
        return tcp_bytes;
    }

    public static unwrap_data(bytes: Buffer): Buffer {
        let string_bytes = bytes.subarray(4, bytes.byteLength);
        return string_bytes
    }
}