import { supabase, getTodayStr, showToast } from './supabase.js';
import { renderNavigation } from './layout.js';

renderNavigation('vocab');

const CATEGORY_DICTIONARY = {
    'Hewan': ['cat','dog','bird','fish','lion','tiger','elephant','monkey','cow','goat','chicken','duck','snake','rabbit','horse','bear','ant','bee','butterfly','shark','whale','frog','turtle','wolf','fox','deer','owl','eagle','catfish'],
    'Benda / Barang': ['book','pen','pencil','bag','table','chair','laptop','phone','smartphone','computer','keyboard','mouse','screen','car','motorcycle','bike','helmet','key','wallet','money','bottle','cup','glass','plate','spoon','fork','shoes','shirt','pants','watch','clock','door','window','bed','pillow','lamp','fan','camera','charger','paper','notebook','ruler','eraser'],
    'Makanan & Minuman': ['water','coffee','tea','milk','juice','bread','rice','noodle','meat','egg','apple','banana','orange','grape','mango','cake','sugar','salt','soup','pizza','burger','sandwich','cheese','butter','honey','ice'],
    'Kata Kerja (Verb)': ['eat','drink','sleep','walk','run','study','learn','read','write','speak','listen','watch','buy','sell','pay','spend','save','work','play','go','come','take','give','make','do','think','know','understand','open','close','drive','ride','help','find','use','try','start','finish'],
    'Kata Sifat (Adjective)': ['good','bad','big','small','fast','slow','expensive','cheap','easy','difficult','hard','happy','sad','tired','hungry','thirsty','hot','cold','new','old','clean','dirty','smart','diligent','lazy','important','rich','poor','beautiful','strong','weak'],
    'Tempat & Alam': ['house','home','school','campus','university','office','market','store','shop','hospital','mosque','bank','station','airport','road','street','city','village','mountain','river','sea','beach','forest','park','garden','library','room','kitchen','bathroom']
};

function detectVocabCategory(wordInput) {
    const cleanWord = wordInput.trim().toLowerCase();
    if (!cleanWord) return null;

    for (const [category, words] of Object.entries(CATEGORY_DICTIONARY)) {
        if (words.includes(cleanWord)) return category;
    }
    if (cleanWord.endsWith('ing') || cleanWord.endsWith('ed')) return 'Kata Kerja (Verb)';
    if (cleanWord.endsWith('ful') || cleanWord.endsWith('less') || cleanWord.endsWith('ous') || cleanWord.endsWith('ive')) return 'Kata Sifat (Adjective)';
    return null;
}

const wordInputEl = document.getElementById('vocab-word');
const catSelectEl = document.getElementById('vocab-category');
const badgeEl = document.getElementById('auto-detect-badge');
const badgeTextEl = document.getElementById('auto-detect-text');

wordInputEl.addEventListener('input', (e) => {
    const detected = detectVocabCategory(e.target.value);
    if (detected) {
        catSelectEl.value = detected;
        badgeTextEl.innerText = `Terdeteksi otomatis: ${detected}`;
        badgeEl.classList.remove('hidden');
        badgeEl.classList.add('flex');
    } else {
        badgeEl.classList.add('hidden');
        badgeEl.classList.remove('flex');
    }
});

async function fetchVocabSummary() {
    const { data, error } = await supabase.from('vocabularies').select('id, date_added');
    if (!error && data) {
        const today = getTodayStr();
        const todayCount = data.filter(v => v.date_added === today).length;
        document.getElementById('vocab-count-summary').innerText =
            `Hari ini: ${todayCount}/5 kata • Total seluruhnya: ${data.length} kata`;
    }
}

document.getElementById('vocab-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-vocab');
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';

    const payload = {
        word: wordInputEl.value.trim(),
        category: catSelectEl.value,
        meaning: document.getElementById('vocab-meaning').value.trim(),
        example: document.getElementById('vocab-example').value.trim(),
        date_added: getTodayStr()
    };

    const { error } = await supabase.from('vocabularies').insert([payload]);

    btn.disabled = false;
    btn.innerText = 'Simpan ke Supabase';

    if (!error) {
        e.target.reset();
        badgeEl.classList.add('hidden');
        badgeEl.classList.remove('flex');
        showToast(`Vocab "${payload.word}" tersimpan di database!`);
        fetchVocabSummary();
    } else {
        alert('Gagal menyimpan: ' + error.message);
    }
});

fetchVocabSummary();