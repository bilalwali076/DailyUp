import { supabase, formatRupiah, getTodayStr } from './supabase.js';
import { renderNavigation } from './layout.js';

renderNavigation('dashboard');

let allVocabs = [];
let allExpenses = [];
let dailyLimit = 50000;

async function initDashboard() {
    document.getElementById('current-date-label').innerText = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const [vocabRes, expRes, setRes, gramRes] = await Promise.all([
        supabase.from('vocabularies').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('user_settings').select('daily_limit').eq('id', 1).single(),
        supabase.from('grammar_progress').select('*').eq('is_mastered', true)
    ]);

    allVocabs = vocabRes.data || [];
    allExpenses = expRes.data || [];
    if (setRes.data) dailyLimit = setRes.data.daily_limit;
    const masteredCount = gramRes.data ? gramRes.data.length : 0;

    renderVocabStats();
    renderGrammarStats(masteredCount);
    renderCategoryBreakdown();
    updateExpenseDashboard('daily');

    document.getElementById('dash-expense-period').addEventListener('change', (e) => {
        updateExpenseDashboard(e.target.value);
    });
}

function renderVocabStats() {
    const today = getTodayStr();
    const currentMonth = today.slice(0, 7);

    const todayVocab = allVocabs.filter(v => v.date_added === today).length;
    const monthVocab = allVocabs.filter(v => v.date_added && v.date_added.startsWith(currentMonth)).length;

    document.getElementById('dash-total-vocab').innerText = `${allVocabs.length} Kata`;
    document.getElementById('dash-vocab-month').innerText = `${monthVocab} Kata`;

    const badgeEl = document.getElementById('dash-vocab-today-badge');
    badgeEl.innerText = `${todayVocab}/5`;
    badgeEl.className = todayVocab >= 5
        ? 'text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 truncate'
        : 'text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 truncate';

    const pct = Math.min(100, Math.round((todayVocab / 5) * 100));
    document.getElementById('dash-vocab-bar').style.width = `${pct}%`;
}

function renderGrammarStats(masteredCount) {
    document.getElementById('dash-grammar-progress').innerText = `${masteredCount} / 5`;
}

function updateExpenseDashboard(period) {
    const todayStr = getTodayStr();
    const todayDate = new Date();
    const titleEl = document.getElementById('dash-expense-title');
    const amountEl = document.getElementById('dash-expense-amount');
    const limitEl = document.getElementById('dash-expense-limit-text');
    const chartTitleEl = document.getElementById('dash-chart-title');
    const chartSubEl = document.getElementById('dash-chart-subtitle');
    const chartContainer = document.getElementById('expense-chart');

    let bars = [];

    if (period === 'daily') {
        const spent = allExpenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
        titleEl.innerText = 'Pengeluaran Hari Ini';
        amountEl.innerText = formatRupiah(spent);
        amountEl.className = spent > dailyLimit
            ? 'text-xs sm:text-base font-extrabold text-rose-600 leading-tight truncate'
            : 'text-xs sm:text-base font-extrabold text-slate-900 leading-tight truncate';
        limitEl.innerText = spent > dailyLimit ? `Lewat batas (${formatRupiah(dailyLimit)})` : `Batas: ${formatRupiah(dailyLimit)}`;

        chartTitleEl.innerText = 'Tren Pengeluaran (7 Hari Terakhir)';
        chartSubEl.innerText = 'Garis merah = Melebihi batas harian';

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayDate);
            d.setDate(todayDate.getDate() - i);
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const total = allExpenses.filter(e => e.date === dStr).reduce((s, e) => s + e.amount, 0);
            bars.push({ label: d.toLocaleDateString('id-ID', { weekday: 'short' }), total, overLimit: total > dailyLimit });
        }
    } else if (period === 'weekly') {
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(todayDate.getDate() - 6);
        const startStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

        const spent = allExpenses.filter(e => e.date >= startStr && e.date <= todayStr).reduce((s, e) => s + e.amount, 0);
        const weeklyLimit = dailyLimit * 7;

        titleEl.innerText = 'Pengeluaran Minggu Ini';
        amountEl.innerText = formatRupiah(spent);
        amountEl.className = spent > weeklyLimit
            ? 'text-xs sm:text-base font-extrabold text-rose-600 leading-tight truncate'
            : 'text-xs sm:text-base font-extrabold text-slate-900 leading-tight truncate';
        limitEl.innerText = `Batas 7hr: ${formatRupiah(weeklyLimit)}`;

        chartTitleEl.innerText = 'Tren Pengeluaran (4 Minggu Terakhir)';
        chartSubEl.innerText = 'Akumulasi per blok 7 hari';

        for (let w = 3; w >= 0; w--) {
            const endD = new Date(todayDate);
            endD.setDate(todayDate.getDate() - (w * 7));
            const startD = new Date(endD);
            startD.setDate(endD.getDate() - 6);

            const sStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;
            const eStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

            const total = allExpenses.filter(e => e.date >= sStr && e.date <= eStr).reduce((s, e) => s + e.amount, 0);
            bars.push({ label: w === 0 ? 'Mgg Ini' : `-${w} Mgg`, total, overLimit: total > weeklyLimit });
        }
    } else if (period === 'monthly') {
        const currentMonth = todayStr.slice(0, 7);
        const spent = allExpenses.filter(e => e.date && e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
        const monthlyLimit = dailyLimit * 30;

        titleEl.innerText = 'Pengeluaran Bulan Ini';
        amountEl.innerText = formatRupiah(spent);
        amountEl.className = spent > monthlyLimit
            ? 'text-xs sm:text-base font-extrabold text-rose-600 leading-tight truncate'
            : 'text-xs sm:text-base font-extrabold text-slate-900 leading-tight truncate';
        limitEl.innerText = `Est. batas: ${formatRupiah(monthlyLimit)}`;

        chartTitleEl.innerText = 'Tren Pengeluaran (6 Bulan Terakhir)';
        chartSubEl.innerText = 'Total pengeluaran bulanan';

        for (let m = 5; m >= 0; m--) {
            const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - m, 1);
            const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const total = allExpenses.filter(e => e.date && e.date.startsWith(mStr)).reduce((s, e) => s + e.amount, 0);
            bars.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }), total, overLimit: total > monthlyLimit });
        }
    }

    const maxVal = Math.max(...bars.map(b => b.total), 10000);
    chartContainer.innerHTML = bars.map(b => {
        const heightPct = b.total === 0 ? 5 : Math.max(12, Math.round((b.total / maxVal) * 100));
        const barColor = b.overLimit ? 'bg-rose-500' : (b.total > 0 ? 'bg-indigo-600' : 'bg-slate-200');
        return `
            <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full max-w-[32px] h-16 flex items-end justify-center">
                    <div class="w-full ${barColor} rounded-t transition-all duration-300" style="height: ${heightPct}%" title="${formatRupiah(b.total)}"></div>
                </div>
                <span class="text-[9px] font-bold text-slate-600">${b.label}</span>
            </div>
        `;
    }).join('');
}

function renderCategoryBreakdown() {
    const container = document.getElementById('category-breakdown');
    if (allVocabs.length === 0) {
        container.innerHTML = `<p class="text-[10px] text-slate-400">Belum ada data kosakata.</p>`;
        return;
    }

    const counts = {};
    allVocabs.forEach(v => counts[v.category] = (counts[v.category] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted.map(([cat, count]) => {
        const pct = Math.round((count / allVocabs.length) * 100);
        return `
            <div>
                <div class="flex justify-between text-[10px] font-semibold mb-0.5">
                    <span class="text-slate-700">${cat}</span>
                    <span class="text-slate-500">${count} (${pct}%)</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-indigo-600 h-full rounded-full" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

initDashboard();