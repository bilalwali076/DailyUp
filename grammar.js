import { supabase, showToast } from './supabase.js';
import { renderNavigation } from './layout.js';

renderNavigation('grammar');

const GRAMMAR_RULES = [
    {
        id: 1,
        title: 'Simple Present Tense',
        subtitle: 'Kebiasaan & Rutinitas Harian',
        formula: 'Subject + Verb 1 (s/es) + Object',
        desc: 'Digunakan untuk menyatakan fakta umum atau rutinitas yang kamu lakukan setiap hari.',
        examples: [
            'I spend 20k on food every day. (Saya menghabiskan 20rb untuk makan setiap hari.)',
            'She studies English every morning. (Dia belajar bahasa Inggris setiap pagi.)'
        ],
        quiz: {
            question: 'Lengkapi kalimat kebiasaan ini: "I _____ five new words every day."',
            options: ['learn', 'learned', 'learning'],
            answer: 0
        }
    },
    {
        id: 2,
        title: 'Simple Past Tense',
        subtitle: 'Kejadian yang Sudah Selesai',
        formula: 'Subject + Verb 2 + Object',
        desc: 'Digunakan saat mencatat pengeluaran atau aktivitas yang sudah terjadi tadi pagi atau kemarin.',
        examples: [
            'I bought fuel this morning. (Saya membeli bensin tadi pagi.)',
            'We finished the campus assignment last night. (Kami menyelesaikan tugas kampus semalam.)'
        ],
        quiz: {
            question: 'Ubah ke bentuk lampau: "Yesterday, I _____ 15k for coffee."',
            options: ['pay', 'paid', 'paying'],
            answer: 1
        }
    },
    {
        id: 3,
        title: 'Present Continuous Tense',
        subtitle: 'Sedang Terjadi Sekarang',
        formula: 'Subject + am/is/are + Verb-ing',
        desc: 'Digunakan untuk menjelaskan aktivitas yang sedang berlangsung tepat saat kamu berbicara.',
        examples: [
            'I am doing my campus task right now. (Saya sedang mengerjakan tugas kampus sekarang.)',
            'He is saving money for a new laptop. (Dia sedang menabung untuk laptop baru.)'
        ],
        quiz: {
            question: 'Pilih bentuk yang tepat: "Right now, I _____ my daily expenses."',
            options: ['am tracking', 'tracked', 'tracks'],
            answer: 0
        }
    },
    {
        id: 4,
        title: 'Future with "Going to"',
        subtitle: 'Rencana & Target Besok',
        formula: 'Subject + am/is/are + going to + Verb 1',
        desc: 'Digunakan untuk merencanakan anggaran besok atau target belajar berikutnya.',
        examples: [
            'I am going to save more money tomorrow. (Saya akan menabung lebih banyak besok.)',
            'I am going to review my vocabulary tonight. (Saya akan mengulang kosakata malam ini.)'
        ],
        quiz: {
            question: 'Lengkapi rencana ini: "Tomorrow, I am going to _____ early."',
            options: ['woke up', 'wake up', 'waking up'],
            answer: 1
        }
    },
    {
        id: 5,
        title: 'Modal Auxiliaries',
        subtitle: 'Keharusan & Kemampuan',
        formula: 'Subject + must / should / can + Verb 1',
        desc: 'Kata bantu untuk menegaskan aturan diri sendiri (must = harus, should = sebaiknya, can = bisa).',
        examples: [
            'I must learn five new words today. (Saya harus mempelajari lima kata baru hari ini.)',
            'I can speak English fluently with practice. (Saya bisa berbicara bahasa Inggris lancar dengan latihan.)'
        ],
        quiz: {
            question: 'Setelah kata "must", kata kerja harus berbentuk:',
            options: ['Verb 1 (Kata dasar)', 'Verb 2 (Lampau)', 'Verb-ing'],
            answer: 0
        }
    }
];

let masteredIds = [];
let activeRuleId = 1;

async function initGrammarPage() {
    const { data } = await supabase.from('grammar_progress').select('rule_id').eq('is_mastered', true);
    masteredIds = data ? data.map(item => item.rule_id) : [];
    renderGrammarNav();
    renderGrammarDetail();
}

window.selectRule = (id) => {
    activeRuleId = id;
    renderGrammarNav();
    renderGrammarDetail();
};

window.toggleMastered = async (id) => {
    const isCurrentlyMastered = masteredIds.includes(id);
    const newStatus = !isCurrentlyMastered;

    const { error } = await supabase
        .from('grammar_progress')
        .update({ is_mastered: newStatus })
        .eq('rule_id', id);

    if (!error) {
        if (newStatus) {
            masteredIds.push(id);
            showToast('Aturan ditandai sudah dikuasai!');
        } else {
            masteredIds = masteredIds.filter(item => item !== id);
            showToast('Status penguasaan dibatalkan.');
        }
        renderGrammarNav();
        renderGrammarDetail();
    }
};

window.checkQuiz = (ruleId, selectedIdx) => {
    const rule = GRAMMAR_RULES.find(r => r.id === ruleId);
    const feedbackEl = document.getElementById('quiz-feedback');
    if (selectedIdx === rule.quiz.answer) {
        feedbackEl.className = 'mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold block';
        feedbackEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i> Tepat sekali! Kamu paham rumus ini.';
    } else {
        feedbackEl.className = 'mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold block';
        feedbackEl.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1"></i> Belum tepat, coba perhatikan rumusnya lagi.';
    }
};

function renderGrammarNav() {
    const navEl = document.getElementById('grammar-rules-nav');
    navEl.innerHTML = GRAMMAR_RULES.map(rule => {
        const isActive = rule.id === activeRuleId;
        const isMastered = masteredIds.includes(rule.id);
        return `
            <button onclick="selectRule(${rule.id})" class="w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
            }">
                <div>
                    <span class="text-[11px] font-bold uppercase ${isActive ? 'text-indigo-200' : 'text-slate-400'}">Aturan #${rule.id}</span>
                    <h4 class="font-bold text-sm mt-0.5">${rule.title}</h4>
                </div>
                <div class="w-7 h-7 rounded-full flex items-center justify-center ${
                    isMastered ? (isActive ? 'bg-white text-indigo-600' : 'bg-emerald-100 text-emerald-600') : (isActive ? 'bg-indigo-500 text-indigo-200' : 'bg-slate-100 text-slate-300')
                }">
                    <i class="fa-solid fa-check text-xs"></i>
                </div>
            </button>
        `;
    }).join('');
}

function renderGrammarDetail() {
    const rule = GRAMMAR_RULES.find(r => r.id === activeRuleId);
    const isMastered = masteredIds.includes(rule.id);
    const container = document.getElementById('grammar-detail-card');

    container.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Aturan #${rule.id} — ${rule.subtitle}</span>
                <h3 class="text-xl font-extrabold text-slate-900 mt-2">${rule.title}</h3>
            </div>
            <button onclick="toggleMastered(${rule.id})" class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isMastered ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }">
                <i class="fa-solid ${isMastered ? 'fa-check-double' : 'fa-circle-check'}"></i>
                ${isMastered ? 'Sudah Dikuasai' : 'Tandai Paham'}
            </button>
        </div>

        <div class="my-5 p-4 rounded-xl bg-slate-900 text-white">
            <p class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Rumus Dasar</p>
            <p class="font-mono text-base sm:text-lg font-bold text-emerald-400">${rule.formula}</p>
        </div>

        <p class="text-sm text-slate-600 leading-relaxed mb-5">${rule.desc}</p>

        <div class="mb-6">
            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Contoh Penerapan Sehari-hari:</h4>
            <ul class="space-y-2">
                ${rule.examples.map(ex => `
                    <li class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 font-medium">
                        <i class="fa-solid fa-quote-left text-indigo-400 mr-2 text-xs"></i>${ex}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Latihan Cepat</h4>
            <p class="text-sm font-semibold text-slate-800 mb-3">${rule.quiz.question}</p>
            <div class="flex flex-wrap gap-2">
                ${rule.quiz.options.map((opt, idx) => `
                    <button onclick="checkQuiz(${rule.id}, ${idx})" class="px-4 py-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <div id="quiz-feedback" class="hidden"></div>
        </div>
    `;
}

initGrammarPage();