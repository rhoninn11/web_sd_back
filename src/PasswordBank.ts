import { Client } from "./types/types";


export class PasswordBank {
    private password_idx: { password: string, inUse: boolean }[];
    private static instance: PasswordBank;
    private constructor() {
        this.password_idx = [
            { password: 'pulsary55.', inUse: false },
        ]
     }

    public static getInstance(): PasswordBank {
        if (!PasswordBank.instance)
            PasswordBank.instance = new PasswordBank();

        return PasswordBank.instance;
    }

    public check_password = (pass: string): number => {
        let passwd_idx = -1;
        this.password_idx.forEach((item, idx, array) => {
            if (item.password == pass, item.inUse == false) {
                item.inUse = true;
                passwd_idx = idx;
            }
        });

        if (passwd_idx >= 0) console.log('Password accepted!');
        else console.log('Password rejected!');

        return passwd_idx;
    }

    public release_password = (passwd_id: number)=> {
        let auth_id = passwd_id
        if (auth_id > -1){
            console.log('Releasing password: ' + auth_id);
            this.password_idx[auth_id].inUse = false;
        }
    }
}