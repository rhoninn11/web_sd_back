import net from 'net';

interface connectMsg {
    connect: number;
}

interface disconnectMsg {
    disconnect: number;
}

interface txt2img_config {
    prompt: string;
    prompt_negative: string;
    seed: number;
    samples: number;
}

interface metadata {
    id: string;
}

interface txt2img {
    config: txt2img_config
    metadata: metadata;
}

interface txt2img_request {
    txt2img: txt2img;
}

export class SDClient {
    private static instance: SDClient;
    private client: net.Socket | undefined = undefined;

    public static getInstance(): SDClient {
        if (!SDClient.instance) {
            SDClient.instance = new SDClient();
        }
        return SDClient.instance;
    }

    private _send_txt2img(sock: net.Socket) {
        let command: txt2img_request = {
            txt2img: {
                config: {
                    prompt: "Sunny day over the sea, pastel painting",
                    prompt_negative: "boring skyscape",
                    seed: 0,
                    samples: 1,
                },
                metadata: { id: "osiedle xd" }
            }
        }

        setTimeout(() => {
            console.log('Sending command');
            this.send(sock, command);
        }, 1000);
    }

    private is_reciveing: boolean = false;
    private reciveing_buffer: Buffer = Buffer.alloc(0);
    private reciveing_len: number = 0;

    private data_processing(data: Buffer) {
        if (this.is_reciveing) {
            this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
        }

        if (!this.is_reciveing) {
            this.is_reciveing = true;
            this.reciveing_buffer = Buffer.alloc(0);
            this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
            this.reciveing_len = data.readUInt32LE(0) + 4;

        }

        if (this.reciveing_buffer.byteLength === this.reciveing_len) {
            console.log(`++++ no i tu powinno się coz zadziac? ++++`);

            let u_data = this.unwrap_data(this.reciveing_buffer)
            console.log(`Received data: ${u_data}`);
            let obj = this.bytes2json2obj(u_data);
            this.is_reciveing = false;
        }
    }

    public connect(port: number, host: string) {
        if (this.client != undefined)
            return;

        this.client = net.createConnection({ port: port, host: host }, () => {
            console.log(`Connected to ${host}:${port}`);
            if (this.client) {
                let msg: connectMsg = { connect: 1 };
                this.send(this.client, msg);
                this._send_txt2img(this.client)
            }
        });

        this.client.on('error', (err) => {
            console.error(`Error connecting to ${host}:${port}: ${err.message}`);
        });

        this.client.on('data', (data) => {
            this.data_processing(data);
        });
    }

    public obj2json2bytes(obj: any, verbose: boolean = false): Buffer {
        let json_text: string = "";
        // TODO - handle possible errors
        json_text = JSON.stringify(obj);
        let data_bytes = Buffer.from(json_text, 'utf8');
        return data_bytes;
    }

    public bytes2json2obj(bytes: Buffer): any {
        let json = bytes.toString('utf8');
        let j_len = json.length;
        console.log(`json len: ${j_len}`);
        let last_char = json[j_len - 1]
        if (last_char == '\0') {
            json = json.slice(0, j_len - 1);
        }
        let obj = JSON.parse(json);
        return obj;
    }

    public wrap_data(bytes: Buffer): Buffer {
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

    public unwrap_data(bytes: Buffer): Buffer {

        let string_bytes = bytes.subarray(4, bytes.byteLength);
        return string_bytes
    }


    public send(sock: net.Socket, obj: any) {
        let msg_bytes = this.obj2json2bytes(obj);
        let wrapped_msg = this.wrap_data(msg_bytes);
        sock.write(wrapped_msg);
    }

    public close(): void {
        if (this.client) {
            let msg: disconnectMsg = { disconnect: 0 };
            this.send(this.client, msg);
            // this.client.end(() => {
            //     console.log('Client ended connection (waiting for all data to be sent)');
            //     if (this.client)
            //         this.client.destroy(); // Ensure that the socket is fully closed
            //     console.log('Client socket completely closed');
            //   });
        }
        console.log('Connection closed');
    }
}