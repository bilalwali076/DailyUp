import { supabase, formatRupiah, getTodayStr, showToast } from './supabase.js';
import { renderNavigation } from './layout.js';

renderNavigation('expense');

let expenseData = [];
let dailyLimit = 50000;

async function initExpensePage() {
    const { data: setting } = await supabase.from('user_settings').select('daily_limit').eq('id', 1).single();
    if (setting && setting.daily_limit) {
        dailyLimit = setting.daily_limit;
        document.getElementById('daily-limit-input').value = dailyLimit;
    } else {
        document.getElementById('daily-limit-input').value = dailyLimit;
    }

    document.getElementById('exp-history-period').addEventListener('change', renderExpenseList);
    document.getElementById('btn-print-meal').addEventListener('click', printMealReport);
    fetchExpenses();
}

async function fetchExpenses() {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('id', { ascending: false });

    if (!error) {
        expenseData = data || [];
        renderExpenseList();
    }
}

document.getElementById('btn-save-limit').addEventListener('click', async () => {
    const newLimit = parseInt(document.getElementById('daily-limit-input').value, 10);
    if (newLimit && newLimit >= 1000) {
        const { error } = await supabase
            .from('user_settings')
            .update({ daily_limit: newLimit })
            .eq('id', 1);

        if (!error) {
            dailyLimit = newLimit;
            showToast(`Batas harian diperbarui: ${formatRupiah(newLimit)}`);
        }
    }
});

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('exp-title').value.trim();
    const amount = parseInt(document.getElementById('exp-amount').value, 10);
    const category = document.getElementById('exp-category').value;
    const today = getTodayStr();

    const spentToday = expenseData
        .filter(item => item.date === today)
        .reduce((sum, item) => sum + Number(item.amount), 0);

    if (spentToday + amount > dailyLimit) {
        const sisaBatas = Math.max(0, dailyLimit - spentToday);
        alert(
            `Gagal menyimpan! Pengeluaran melebihi Batas/Hari (${formatRupiah(dailyLimit)}).\n` +
            `Terpakai hari ini: ${formatRupiah(spentToday)}\n` +
            `Sisa batas hari ini: ${formatRupiah(sisaBatas)}`
        );
        return;
    }

    const btn = document.getElementById('btn-save-exp');
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';

    const payload = {
        title,
        amount,
        category,
        date: today
    };

    const { error } = await supabase.from('expenses').insert([payload]);

    btn.disabled = false;
    btn.innerText = 'Simpan Pengeluaran';

    if (!error) {
        e.target.reset();
        showToast('Pengeluaran berhasil dicatat!');
        fetchExpenses();
    } else {
        alert('Gagal menyimpan: ' + error.message);
    }
});

window.deleteExpense = async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) {
        showToast('Transaksi dihapus.');
        fetchExpenses();
    }
};

function getFilteredExpenses(period) {
    const todayStr = getTodayStr();
    const todayDate = new Date();

    if (period === 'daily') {
        return {
            label: 'Hari ini',
            emptyMsg: 'Belum ada catatan pengeluaran hari ini.',
            items: expenseData.filter(e => e.date === todayStr)
        };
    }

    if (period === 'weekly') {
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(todayDate.getDate() - 6);
        const startStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

        return {
            label: '7 hari terakhir',
            emptyMsg: 'Belum ada catatan pengeluaran dalam 7 hari terakhir.',
            items: expenseData.filter(e => e.date && e.date >= startStr && e.date <= todayStr)
        };
    }

    if (period === 'monthly') {
        const currentMonth = todayStr.slice(0, 7);
        return {
            label: 'Bulan ini',
            emptyMsg: 'Belum ada catatan pengeluaran bulan ini.',
            items: expenseData.filter(e => e.date && e.date.startsWith(currentMonth))
        };
    }

    return {
        label: 'Semua',
        emptyMsg: 'Belum ada catatan pengeluaran.',
        items: expenseData
    };
}

function printMealReport() {
    const period = document.getElementById('exp-history-period').value;
    const { label, items } = getFilteredExpenses(period);
    const mealItems = items.filter(e => e.category === 'Makan & Minum');

    if (mealItems.length === 0) {
        alert(`Tidak ada riwayat Makan & Minum untuk periode "${label}".`);
        return;
    }

    const totalMeal = mealItems.reduce((sum, e) => sum + Number(e.amount), 0);
    const rowsHtml = mealItems.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${item.date || '-'}</td>
            <td>${item.title}</td>
            <td style="text-align:right;font-weight:bold;">${formatRupiah(item.amount)}</td>
        </tr>
    `).join('');

    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) {
        alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.');
        return;
    }

    printWin.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Makan & Minum (${label})</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 28px; color: #1e293b; }
                h2 { margin: 0 0 4px; font-size: 20px; }
                p.meta { margin: 0 0 20px; font-size: 12px; color: #64748b; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; text-align: left; }
                th { background: #f1f5f9; font-weight: bold; }
                .total-box { font-size: 15px; font-weight: bold; text-align: right; padding-top: 8px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h2>Laporan Pengeluaran Makan & Minum</h2>
            <p class="meta">Periode: <strong>${label}</strong> • Tanggal Cetak: ${getTodayStr()} • Jumlah Transaksi: ${mealItems.length}</p>
            <table>
                <thead>
                    <tr>
                        <th style="width:44px;">No</th>
                        <th style="width:120px;">Tanggal</th>
                        <th>Keterangan</th>
                        <th style="width:150px;text-align:right;">Nominal</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div class="total-box">Total Makan & Minum: ${formatRupiah(totalMeal)}</div>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWin.document.close();
}

function renderExpenseList() {
    const period = document.getElementById('exp-history-period').value;
    const { label, emptyMsg, items } = getFilteredExpenses(period);

    const periodTotal = items.reduce((sum, e) => sum + Number(e.amount), 0);
    document.getElementById('exp-period-total').innerText = `${label}: ${formatRupiah(periodTotal)}`;

    const listEl = document.getElementById('expense-list');
    if (items.length === 0) {
        listEl.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm">${emptyMsg}</div>`;
        return;
    }

    listEl.innerHTML = items.map(e => `
        <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
            <div>
                <p class="font-bold text-sm text-slate-900">${e.title}</p>
                <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>${e.category}</span>
                    <span>•</span>
                    <span>${e.date}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-extrabold text-sm text-slate-900">${formatRupiah(e.amount)}</span>
                <button onclick="deleteExpense(${e.id})" class="no-print text-slate-400 hover:text-rose-500 p-1">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

initExpensePage();