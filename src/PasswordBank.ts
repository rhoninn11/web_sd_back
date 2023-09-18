
export class PasswordBank {
    private password_idx: { password: string, inUse: boolean }[];
    private static instance: PasswordBank;
    private constructor() {
        this.password_idx = [
            { password: 'policjantZawodLaskowy51+', inUse: false },
            { password: 'myszKsztalcenieAgrest80-', inUse: false },
            { password: 'zukInternetBak39.', inUse: false },
            { password: 'muzeumRurkaPapier40,', inUse: false },
            { password: 'filmMyszkaKomputer18+', inUse: false },
            { password: 'uczenJeziorakKoce36,', inUse: false },
            { password: 'senatKsiadzUsluga94+', inUse: false },
            { password: 'szkloPigwaButelka71-', inUse: false },
            { password: 'slonceKalafiorDziecko85-', inUse: false },
            { password: 'projektowanieZainteresowanyPlaneta54.', inUse: false },
            { password: 'polbutyTulipanLuk14+', inUse: false },
            { password: 'muzykaPszczolaMisja37_', inUse: false },
            { password: 'rzekaPilkaMrowkojad98+', inUse: false },
            { password: 'ksiezniczkaKwiaciarniaGazeta31-', inUse: false },
            { password: 'naturaRehabilitacjaPrzyjaciel46,', inUse: false },
            { password: 'orzelRodzynkiHomar65-', inUse: false },
            { password: 'koszulkaPanterKoncert63,', inUse: false },
            { password: 'mostZakupyKreatywnosc22+', inUse: false },
            { password: 'panteraFigiReka44.', inUse: false },
            { password: 'celowoscSmutnyBillboard91.', inUse: false },
            { password: 'klientPostRobak71+', inUse: false },
            { password: 'rekawiczkiKameraSklep88-', inUse: false },
            { password: 'klompyKosciolRealizacja63+', inUse: false },
            { password: 'wystawaSpoleczenstwoIndyk94,', inUse: false }
        ];
     }

    public static getInstance(): PasswordBank {
        if (!PasswordBank.instance)
            PasswordBank.instance = new PasswordBank();

        return PasswordBank.instance;
    }

    public check_password = (pass: string): number => {
        let passwd_idx = -1;
        this.password_idx.forEach((item, idx, array) => {
            if (item.password == pass && item.inUse == false) {
                item.inUse = true;
                passwd_idx = idx;
            }
        });

        if (passwd_idx >= 0) console.log('<---> Password accepted', passwd_idx);
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