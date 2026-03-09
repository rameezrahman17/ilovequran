const https = require('https');

const reciters = [
    { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
    { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Al Shatri' },
    { id: 'Nasser_Alqatami_128kbps', name: 'Nasser Al Qatami' },
    { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser Al Dosari' },
    { id: 'Hani_Rifai_192kbps', name: 'Hani Ar Rifai' },
    { id: 'MaherAlMuaiqly128kbps', name: 'Maher Al Muaiqly' },
    { id: 'Saood_ash-Shuraym_128kbps', name: 'Saud Al Shuraim' },
    { id: 'Abdurrahmaan_As-Sudais_128kbps', name: 'Abdul Rahman Al Sudais' }
];

const checkUrl = (id) => {
    const url = `https://everyayah.com/data/${id}/001001.mp3`;
    return new Promise(resolve => {
        const req = https.request(url, { method: 'HEAD' }, res => {
            resolve({ id, status: res.statusCode });
        });
        req.on('error', () => resolve({ id, status: 'error' }));
        req.end();
    });
};

async function checkAll() {
    console.log("Checking Reciter URLs...");
    for (const r of reciters) {
        const result = await checkUrl(r.id);
        console.log(`${r.id}: ${result.status}`);
    }
}

checkAll();
