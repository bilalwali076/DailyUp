export function renderNavigation(activePage) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', href: 'index.html', icon: 'fa-chart-pie' },
        { id: 'vocab', label: 'Bank Vocab', href: 'vocab.html', icon: 'fa-book-open' },
        { id: 'expense', label: 'Pengeluaran', href: 'expense.html', icon: 'fa-wallet' },
        { id: 'grammar', label: '5 Aturan Grammar', href: 'grammar.html', icon: 'fa-graduation-cap' }
    ];

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <div class="p-6 border-b border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                    <i class="fa-solid fa-layer-group text-lg"></i>
                </div>
                <div>
                    <h1 class="font-bold text-slate-900 tracking-tight leading-tight">DailyGrowth<span class="text-indigo-600">.os</span></h1>
                    <p class="text-xs text-slate-400 font-medium">English & Finance System</p>
                </div>
            </div>
            <nav class="flex-1 p-4 space-y-1.5">
                ${navItems.map(item => {
                    const isActive = item.id === activePage;
                    return `
                        <a href="${item.href}" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            isActive 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }">
                            <i class="fa-solid ${item.icon} w-5 text-center"></i>
                            <span>${item.label}</span>
                        </a>
                    `;
                }).join('')}
            </nav>
            <div class="p-4 m-4 rounded-xl bg-slate-900 text-white">
                <div class="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SUPABASE CONNECTED
                </div>
                <p class="text-[11px] text-slate-300 leading-relaxed">Data tersinkronisasi otomatis ke cloud database.</p>
            </div>
        `;
    }

    const mobileNavContainer = document.getElementById('mobile-nav-container');
    if (mobileNavContainer) {
        mobileNavContainer.innerHTML = navItems.map(item => {
            const isActive = item.id === activePage;
            return `
                <a href="${item.href}" class="flex-1 py-3 flex flex-col items-center justify-center gap-1 ${
                    isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
                }">
                    <i class="fa-solid ${item.icon} text-base"></i>
                    <span class="text-[11px]">${item.label.split(' ')[0]}</span>
                </a>
            `;
        }).join('');
    }
}
if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    }