import WebSocket from 'ws';
import sql, { sqlite3, Database } from 'sqlite3'
import { Client } from './types/types';
import { PasswordBank } from './PasswordBank';

import fs from 'fs';
import { img64 } from './types/types_sd';

const DB_FILE = 'tmp/db.sqlite3';

class DBRecord {
    id: number = -1;
    uuid: string = '';
    json: string = '';
}

export class DBStore {
    private static instance: DBStore;
    private db: Database | undefined = undefined;


    public static getInstance(): DBStore {
        if (!DBStore.instance) {
            DBStore.instance = new DBStore();
            DBStore.instance._init();
        }

        return DBStore.instance;
    }

    private _init() {
        const sqlite3 = sql.verbose();
        this.db = new sqlite3.Database(DB_FILE, (err) => {
            if (err) {
                console.log('Could not connect to database', err)
                console.error(err.message);
            }
        });

        this.db.serialize(() => {
            this.create_tables();

            this.display_stats('nodes', 'node');
            this.display_stats('edges', 'edge');
            this.display_stats('images', 'image');
        });
    }

    private create_tables() {
        if (!this.db)
            return;

        this.db.run("CREATE TABLE IF NOT EXISTS nodes (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS edges (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid, TEXT ,json TEXT)");
    }



    private display_stats(table_name: string, info_name: string) {
        if (!this.db)
            return;

        this.db.all(`SELECT * FROM ${table_name}`, (err, rows) => {
            rows.forEach((row) => {
                let {id, uuid} = row as DBRecord;
                console.log(`+++ db has ${info_name} with id: ${id} and uuid: ${uuid}`);
            });
        });
    }

    public insert_node(uuid: string, json: string) {
        if (!this.db)
            return;

        this.db.run("INSERT INTO nodes (uuid, json) VALUES (?, ?)", [uuid, json]);
    }

    public insert_edge(uuid: string, json: string) {
        if (!this.db)
            return;

        this.db.run("INSERT INTO edges (uuid, json) VALUES (?, ?)", [uuid, json]);

    }

    public insert_image(uuid: string, img: img64) {
        if (!this.db)
            return;

        let json = JSON.stringify(img);
        this.db.run("INSERT INTO images (uuid, json) VALUES (?, ?)", [uuid, json]);
        console.log(`+++ inserted image with uuid: ${uuid}`);
    }

    public exit() {
        if (!this.db)
            return;

        this.db.close();
        this.db = undefined;
    }
}
