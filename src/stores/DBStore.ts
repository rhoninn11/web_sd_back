import WebSocket from 'ws';
import sql, { sqlite3, Database } from 'sqlite3'
import { Client } from '../types/types';
import { PasswordBank } from '../PasswordBank';

import fs from 'fs';
import { img64 } from '../types/types_sd';

const DB_FILE = 'tmp/db.sqlite3';


export class DBRecord {
    id: number = -1;
    uuid: string = '';
    json: string = '';
    deleted: boolean = false;
}

export class DBStore {
    protected static instance: DBStore;
    protected db: Database | undefined = undefined;


    public static getInstance(): DBStore {
        if (!DBStore.instance) {
            DBStore.instance = new DBStore();
            DBStore.instance._init();
        }

        return DBStore.instance;
    }

    protected _init() {
        const sqlite3 = sql.verbose();
        this.db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                console.log('Could not connect to database', err)
                console.error(err.message);
            }
        });

        this.db.serialize(() => {
            this.create_tables();
        });
    }

    protected create_tables() {
        this.db?.run("CREATE TABLE IF NOT EXISTS nodes (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
        this.db?.run("CREATE TABLE IF NOT EXISTS edges (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
        this.db?.run("CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
    }

    public insert_node(uuid: string, json: string) {
        this.db?.run("INSERT INTO nodes (uuid, json) VALUES (?, ?)", [uuid, json]);
    }
    public update_node(uuid: string, json: string) {
        this.db?.run("UPDATE nodes SET json = ? WHERE uuid = ?", [json, uuid]);
    }
    public async get_nodes() {
        let call = new Promise((resolve, reject) => {
            this.db?.all("SELECT * FROM nodes", (err, rows) => {
                if (err) 
                    reject(err)
                
                let db_records: DBRecord[] = rows as DBRecord[];
                resolve(db_records);
            });
        });

        let nodes = await call.then((db_data) => db_data as DBRecord[]);
        console.log(`+++ db has ${nodes.length} nodes`);
        return nodes;
    }


    public insert_edge(uuid: string, json: string) {
        this.db?.run("INSERT INTO edges (uuid, json) VALUES (?, ?)", [uuid, json]);
    }
    public update_edge(uuid: string, json: string) {
        this.db?.run("UPDATE edges SET json = ? WHERE uuid = ?", [json, uuid]);
    }
    public async get_edges() {
        let call = new Promise((resolve, reject) => {
            this.db?.all("SELECT * FROM edges", (err, rows) => {
                if (err) 
                    reject(err)
                
                let db_records: DBRecord[] = rows as DBRecord[];
                resolve(db_records);
            });
        });

        let edges = await call.then((db_data) => db_data as DBRecord[]);
        console.log(`+++ db has ${edges.length} edges`);
        return edges;
    }

    public insert_image(uuid: string, json: string) {
        this.db?.run("INSERT INTO images (uuid, json) VALUES (?, ?)", [uuid, json]);
    }
    public update_image(uuid: string, json: string) {
        this.db?.run("UPDATE images SET json = ? WHERE uuid = ?", [json, uuid]);
    }
    public async get_images() {
        let call = new Promise((resolve, reject) => {
            this.db?.all("SELECT * FROM images", (err, rows) => {
                if (err) 
                    reject(err)
                
                let db_records: DBRecord[] = rows as DBRecord[];
                resolve(db_records);
            });
        });

        let images = await call.then((db_data) => db_data as DBRecord[]);
        console.log(`+++ db has ${images.length} images`);

        return images;
    }

    public exit() {
        this.db?.close();
        this.db = undefined;
    }
}