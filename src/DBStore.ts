import WebSocket from 'ws';
import sql, { sqlite3, Database } from 'sqlite3'
import { Client } from './types/types';
import { PasswordBank } from './PasswordBank';

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
        this.db = new sqlite3.Database('tmp/db.sqlite3', (err) => {
            if (err) {
                console.log('Could not connect to database', err)
                console.error(err.message);
            }
        });
    }

    private _test_ops() {
        console.log('test_ops1');
        if (!this.db)
            return;

        console.log('test_ops');

        this.db.run("CREATE TABLE lorem (info TEXT)");

        const stmt = this.db.prepare("INSERT INTO lorem VALUES (?)");
        for (let i = 0; i < 10; i++) {
            stmt?.run("Ipsum " + i);
        }
        stmt.finalize();

        this.db.each("SELECT rowid AS id, info FROM lorem", (err, result) => {
            console.log('result is: ', result);
        });
    }



    public external_test() {
        if (!this.db)
            return;

        console.log('external_test');
        this.db.serialize(() => {
            console.log('test_ops1');
            if (!this.db)
                return;

            console.log('test_ops');

            // this.db.run("CREATE TABLE lorem (info TEXT)");

            const stmt = this.db.prepare("INSERT INTO lorem VALUES (?)");
            for (let i = 0; i < 10; i++) {
                stmt?.run("Ipsum " + i);
            }
            stmt.finalize();

            this.db.each("SELECT rowid AS id, info FROM lorem", (err, result) => {
                console.log('result is: ', result);
            });
        });
    }

    public exit() {
        if (!this.db)
            return;

        this.db.close();
    }

}
