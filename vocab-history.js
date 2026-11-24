import { supabase, showToast } from './supabase.js';
import { renderNavigation } from './layout.js';

renderNavigation('vocab');

let vocabData = [];

async function fetchVocabs() {
    const { data, error } = await supabase
        .from('vocabularies')
        .select('*')
        .order('id', { ascending: false });

    if (!error) {
        vocabData = data || [];
        renderVocabList();
    }
}

window.deleteVocab = async (id) => {
    const { error } = await supabase.from('vocabularies').delete().eq('id', id);
    if (!error) {
        showToast('Kosakata dihapus.');
        fetchVocabs();
    }
};

document.getElementById('filter-vocab-category').addEventListener('change', renderVocabList);

function renderVocabList() {
    const filter = document.getElementById('filter-vocab-category').value;
    const filtered = filter === 'ALL' ? vocabData : vocabData.filter(v => v.category === filter);

    document.getElementById('vocab-total-badge').innerText = filtered.length;
    const listEl = document.getElementById('vocab-list');

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm">Belum ada kosakata di kategori ini.</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(v => `
        <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition-all flex items-start justify-between gap-4">
            <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="font-bold text-base text-slate-900">${v.word}</span>
                    <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">${v.category}</span>
                    <span class="text-[11px] text-slate-400">${v.date_added}</span>
                </div>
                <p class="text-sm font-semibold text-slate-700">${v.meaning}</p>
                ${v.example ? `<p class="text-xs text-slate-500 italic mt-1">"${v.example}"</p>` : ''}
            </div>
            <button onclick="deleteVocab(${v.id})" class="text-slate-400 hover:text-rose-500 p-1.5 transition-colors" title="Hapus">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
    `).join('');
}

fetchVocabs();