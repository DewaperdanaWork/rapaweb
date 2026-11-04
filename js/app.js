/**
 * Dework Space - Multi-Brand Content Analytics & Team Hub 2026
 * Modular Application Engine (RAPAtech & MONTRA)
 */
// --- UTILS & CORE ---
    function showToast(message, type = "success") {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const bgColor = type === "error" ? "bg-red-500" : type === "info" ? "bg-blue-500" : "bg-emerald-500";
      toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-xl text-sm font-semibold animate-fade-in flex items-center`;
      toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : type === 'info' ? 'fa-circle-info' : 'fa-circle-check'} mr-2 text-lg"></i> ${message}`;
      container.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('dework_theme', isDark ? 'dark' : 'light');
      renderAllTabs();
    }
    
    if (localStorage.getItem('dework_theme') === 'dark' || (!('dework_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    function toggleSidebar() { 
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.toggle('-translate-x-full'); 
        
        if(sidebar.classList.contains('-translate-x-full')) {
            backdrop.classList.add('hidden');
            backdrop.classList.remove('opacity-100');
        } else {
            backdrop.classList.remove('hidden');
            setTimeout(() => backdrop.classList.add('opacity-100'), 10);
        }
    }
    
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden-tab'));
      document.getElementById(`tab-${tabId}`).classList.remove('hidden-tab');
      document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) btn.className = "nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-blue-600 text-white shadow-md";
        else btn.className = "nav-btn w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white";
      });
      // Safety redraw
      if(tabId === 'overview') renderOverviewTab();
      if(tabId === 'vc-summary') renderVCSummaryTab();
      if(tabId === 'analytics') renderAnalytics();
      if(tabId === 'compare') renderComparisonTable();
      if(tabId === 'products') renderSales();
      if(tabId === 'todos') renderWorkspace();
      
      // Auto close sidebar on mobile after clicking a tab
      if (window.innerWidth < 768 && !document.getElementById('sidebar').classList.contains('-translate-x-full')) {
          toggleSidebar();
      }
    }

    function switchAnalyticSubTab(subTabId) {
      document.querySelectorAll('.analytic-sub-tab').forEach(el => el.classList.add('hidden-tab'));
      document.getElementById(subTabId).classList.remove('hidden-tab');
      ['a-overview', 'a-audience', 'a-video'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        if(t === subTabId) btn.className = "sub-nav-btn px-5 py-2.5 rounded-t-lg font-semibold text-sm transition-colors border-b-2 border-blue-600 text-blue-600";
        else btn.className = "sub-nav-btn px-5 py-2.5 rounded-t-lg font-semibold text-sm transition-colors border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
      });
    }

    // --- DATABASE & MULTI-BRAND INDEXEDDB ENGINE (OPSI B: 2 BRAND + HOLDING VIEW) ---
    const DB_NAME = 'DeworkSpaceDB_v3';
    const DB_VERSION = 1;
    let idb = null;

    function createDefaultTeamRoster() {
      return [
        { id: 'tm_alex', name: 'Alex', role: 'Talent / Creator', color: 'blue', icon: 'fa-user-tie', monthlyQuota: 15 },
        { id: 'tm_sarah', name: 'Sarah', role: 'Scriptwriter', color: 'purple', icon: 'fa-pen-fancy', monthlyQuota: 20 },
        { id: 'tm_rian', name: 'Rian', role: 'Video Editor', color: 'emerald', icon: 'fa-film', monthlyQuota: 20 },
        { id: 'tm_budi', name: 'Budi', role: 'Host Live', color: 'amber', icon: 'fa-headset', monthlyQuota: 12 },
        { id: 'tm_all', name: 'Team', role: 'All Crew', color: 'cyan', icon: 'fa-users', monthlyQuota: 30 }
      ];
    }

    function getMemberDisplayLabel(m) {
      if (!m) return 'Team (All Crew)';
      if (typeof m === 'string') return m;
      return m.role ? `${m.name} (${m.role})` : m.name;
    }

    function getRoleIconByColorOrRole(role = '', color = 'blue') {
      const r = String(role || '').toLowerCase();
      if (r.includes('script') || r.includes('copy') || r.includes('writer')) return 'fa-pen-fancy';
      if (r.includes('edit') || r.includes('motion')) return 'fa-film';
      if (r.includes('host') || r.includes('live')) return 'fa-headset';
      if (r.includes('all') || r.includes('team') || r.includes('tim')) return 'fa-users';
      if (r.includes('lead') || r.includes('manager') || r.includes('spv')) return 'fa-crown';
      if (r.includes('design') || r.includes('grafis')) return 'fa-palette';
      if (r.includes('ads') || r.includes('strateg')) return 'fa-bullhorn';
      return 'fa-user-tie';
    }

    function ensureTeamRoster(targetDb) {
      if (!targetDb) return [];
      const defaultMap = {
        'Alex (Talent)': { id: 'tm_alex', name: 'Alex', role: 'Talent', color: 'blue', icon: 'fa-user-tie', monthlyQuota: 15 },
        'Sarah (Script)': { id: 'tm_sarah', name: 'Sarah', role: 'Script', color: 'purple', icon: 'fa-pen-fancy', monthlyQuota: 20 },
        'Rian (Editor)': { id: 'tm_rian', name: 'Rian', role: 'Editor', color: 'emerald', icon: 'fa-film', monthlyQuota: 20 },
        'Budi (Host)': { id: 'tm_budi', name: 'Budi', role: 'Host', color: 'amber', icon: 'fa-headset', monthlyQuota: 12 },
        'Team (All)': { id: 'tm_all', name: 'Team', role: 'All', color: 'cyan', icon: 'fa-users', monthlyQuota: 30 }
      };

      if (!Array.isArray(targetDb.teamRoster) || targetDb.teamRoster.length === 0) {
        if (Array.isArray(targetDb.teamMembers) && targetDb.teamMembers.length > 0) {
          const colors = ['blue', 'purple', 'emerald', 'amber', 'cyan', 'rose', 'indigo'];
          targetDb.teamRoster = targetDb.teamMembers.map((raw, idx) => {
            if (defaultMap[raw]) return { ...defaultMap[raw] };
            const match = String(raw).match(/^(.+?)\s*\((.+)\)$/);
            const name = match ? match[1].trim() : String(raw).trim();
            const role = match ? match[2].trim() : 'Team Member';
            const color = colors[idx % colors.length];
            return {
              id: 'tm_' + idx + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, ''),
              name,
              role,
              color,
              icon: getRoleIconByColorOrRole(role, color),
              monthlyQuota: 15
            };
          });
        } else {
          targetDb.teamRoster = createDefaultTeamRoster();
        }
      }
      targetDb.teamMembers = targetDb.teamRoster.map(m => getMemberDisplayLabel(m));
      return targetDb.teamRoster;
    }

    function createEmptyBrandDB() {
      const roster = createDefaultTeamRoster();
      return {
        todos: [],
        contents: [],
        daily: {},
        videoList: [],
        salesVideos: [],
        globalTimeStats: {},
        lockedMonths: {},
        teamRoster: roster,
        teamMembers: roster.map(m => getMemberDisplayLabel(m))
      };
    }

    function createDefaultUploadLabels() {
      return {
        'filename-overview': 'Upload Data Overview',
        'filename-audience': 'Upload Data Audience',
        'filename-video': 'Upload Data Video Performance',
        'filename-product': 'Upload Video Performance List (.xlsx / .csv)',
        'filename-vc-summary': 'Upload File Video & Carousel Summary (.xlsx / .xls / .csv)'
      };
    }

    function getDefaultBrandPillars(brandKey, brandName = '') {
      const nameLower = String(brandName || '').toLowerCase();
      const isMontra = nameLower.includes('montra') || (brandKey === 'brand_2' && (!nameLower || nameLower === 'brand kedua' || nameLower === 'montra'));
      if (isMontra) {
        return [
          {
            id: 'Casing Clear',
            name: 'Casing Clear (Anti-Yellowing)',
            badge: '✨ Casing Clear',
            icon: 'fa-gem',
            color: 'cyan',
            keywords: ['casing clear', 'clear case', 'clearcase', 'crystal', 'transparan', 'anti yellowing', 'anti-yellowing', 'anti nguning', 'anti kuning', 'nguning', 'bening', 'ice clear', 'clear']
          },
          {
            id: 'Casing Leather',
            name: 'Casing Leather (Premium)',
            badge: '👜 Casing Leather',
            icon: 'fa-briefcase',
            color: 'amber',
            keywords: ['casing leather', 'leather case', 'leathercase', 'leather', 'kulit', 'vegan leather', 'magnetic leather', 'classic leather', 'dompet', 'wallet', 'textured']
          },
          {
            id: 'Casing Orbit',
            name: 'Casing Orbit (MagSafe Stand)',
            badge: '🪐 Casing Orbit',
            icon: 'fa-circle-dot',
            color: 'indigo',
            keywords: ['casing orbit', 'orbit case', 'orbitcase', 'orbit', 'o-ring', 'ring stand', 'magsafe stand', 'rotating', 'kickstand', '360', 'putar', 'stand']
          },
          {
            id: 'Tempered Glass',
            name: 'Tempered Glass (Screen Guard)',
            badge: '🛡️ Tempered Glass',
            icon: 'fa-mobile-screen',
            color: 'purple',
            keywords: ['tempered', 'temperedglass', 'tg', 'screen protector', 'privacy', 'anti spy', 'antispy', 'anti intip', 'antiintip', 'anti glare', 'matte', 'corning', 'dustfree', 'kaca', 'screen guard', 'upgrade layar', 'layar baret', 'pelindung layar']
          },
          {
            id: 'Promo/Live',
            name: 'Promo / Bundling & Live',
            badge: '🔴 Promo/Live',
            icon: 'fa-bullhorn',
            color: 'rose',
            keywords: ['promolive', 'tiktoklive', 'ikut live', 'join live', 'live malam', 'live nanti', 'live montra', 'payday sale', 'big sale', 'flash sale', 'bundling', 'live', 'promo', 'diskon', 'guncang', 'payday', 'deal']
          }
        ];
      }
      return [
        {
          id: 'Charger',
          name: 'Charger & Fast Charge',
          badge: '🔌 Charger',
          icon: 'fa-bolt',
          color: 'blue',
          keywords: ['charger', '#chargeriphone', '#chargermfi', 'mfi', 'avs', 'gan', 'zen pro', 'power zen', 'power ion', 'power ii', 'power mini', 'loop gan', 'adaptor', 'adapter', 'ngecas', 'dicas', 'cas iphone', 'bh bakal awet', 'bh awet', 'aman buat bh', 'battery health', 'kabel', 'cable', 'line +', 'line ii', 'line flash', 'fast charging', 'fastcharging', 'quick charging', 'watt', '30w', '35w', '45w', '60w']
        },
        {
          id: 'Power Bank',
          name: 'Power Bank',
          badge: '🔋 Power Bank',
          icon: 'fa-battery-three-quarters',
          color: 'emerald',
          keywords: ['powerbank', 'power bank', 'pb', 'origin loop', 'origin on', 'origin link', 'origin max', 'origin pro', 'qi2', '5000mah', '5.000mah', '5000 mah', '10000mah', '10.000mah', '10.000 mah', '10000 mah', '20000mah', '20.000mah', '20.000 mah', '20000 mah', 'kapasitas gede', 'magsafe', 'wireless']
        },
        {
          id: 'Case',
          name: 'Case & Protection',
          badge: '📱 Case',
          icon: 'fa-shield-halved',
          color: 'cyan',
          keywords: ['case', 'casing', 'clear case', 'clearcase', 'iphonecase', 'aero case', 'ice clear', 'glacier', 'yellowing', 'nguning', 'airbag']
        },
        {
          id: 'Tempered Glass',
          name: 'Tempered Glass (AR)',
          badge: '🛡️ TG (AR)',
          icon: 'fa-mobile-screen',
          color: 'purple',
          keywords: ['tempered', 'temperedglass', 'tg', 'anti reflection', 'anti-reflection', 'ar', 'anti spy', 'antispy', 'anti intip', 'antiintip', 'screen protector', 'screen guard', 'easy fit', 'instant fit', 'upgrade layar', 'layar baret', 'pelindung layar']
        },
        {
          id: 'Promo/Live',
          name: 'Promo / Live Teaser',
          badge: '🔴 Promo/Live',
          icon: 'fa-bullhorn',
          color: 'rose',
          keywords: ['promolive', 'tiktoklive', 'ikut live', 'join live', 'live malam', 'live nanti', 'live rapatech', 'payday sale', 'big sale', 'flash sale', 'live', 'promo', 'deal', 'diskon', 'guncang', 'payday', 'bundling']
        }
      ];
    }

    let brandsStore = {
      brand_1: {
        meta: { id: 'brand_1', name: 'RAPAtech', handle: '@rapa_indonesia', color: 'blue' },
        pillars: getDefaultBrandPillars('brand_1', 'RAPAtech'),
        db: createEmptyBrandDB(),
        kpiTargets: { gmv: 0, views: 0, followers: 0, ctr: 0 },
        uploadLabels: createDefaultUploadLabels()
      },
      brand_2: {
        meta: { id: 'brand_2', name: 'MONTRA', handle: '@montra_id', color: 'emerald' },
        pillars: getDefaultBrandPillars('brand_2', 'MONTRA'),
        db: createEmptyBrandDB(),
        kpiTargets: { gmv: 0, views: 0, followers: 0, ctr: 0 },
        uploadLabels: createDefaultUploadLabels()
      }
    };

    function ensureBrandPillars(brandKey) {
      const bk = (brandKey === 'brand_2') ? 'brand_2' : 'brand_1';
      if (!brandsStore[bk]) return getDefaultBrandPillars(bk);
      const defaults = getDefaultBrandPillars(bk, brandsStore[bk].meta ? brandsStore[bk].meta.name : '');
      if (!Array.isArray(brandsStore[bk].pillars) || brandsStore[bk].pillars.length === 0) {
        brandsStore[bk].pillars = defaults;
        return brandsStore[bk].pillars;
      }
      // Auto-heal legacy keywords (e.g., 'ar ', 'batre', 'battery', bare 'line') and merge missing core default keywords
      const deprecatedMap = {
        'Power Bank': new Set(['batre', 'battery']),
        'Charger': new Set(['line']),
        'Tempered Glass': new Set(['ar '])
      };
      brandsStore[bk].pillars.forEach((p, idx) => {
        const defP = defaults.find(d => d.id === p.id) || defaults[idx];
        if (!Array.isArray(p.keywords)) p.keywords = defP ? [...defP.keywords] : [];
        const depSet = deprecatedMap[p.id];
        if (depSet) {
          p.keywords = p.keywords.map(k => k === 'ar ' ? 'ar' : k).filter(k => !depSet.has(String(k).toLowerCase()));
        }
        if (defP && defP.id === p.id) {
          const existingSet = new Set(p.keywords.map(k => String(k).toLowerCase().trim()));
          defP.keywords.forEach(dk => {
            if (!existingSet.has(dk.toLowerCase())) {
              p.keywords.push(dk);
              existingSet.add(dk.toLowerCase());
            }
          });
        }
      });
      return brandsStore[bk].pillars;
    }

    function getActiveBrandPillars() {
      if (activeBrandId === 'brand_1' || activeBrandId === 'brand_2') {
        return ensureBrandPillars(activeBrandId);
      }
      // Holding Mode ('all'): combine unique pillars from Brand 1 and Brand 2
      const p1 = ensureBrandPillars('brand_1');
      const p2 = ensureBrandPillars('brand_2');
      const map = new Map();
      [...p1, ...p2].forEach(p => {
        if (!map.has(p.id)) {
          map.set(p.id, { ...p });
        }
      });
      return Array.from(map.values());
    }

    let activeBrandId = localStorage.getItem('dework_active_brand') || 'brand_1';
    if (!['brand_1', 'brand_2', 'all'].includes(activeBrandId)) activeBrandId = 'brand_1';

    let db = brandsStore.brand_1.db;
    let kpiTargets = brandsStore.brand_1.kpiTargets;
    let currentTrendMetric = 'views';
    let chartOverviewMain = null, chartAnalyticsOverview = null, chartAudienceReach = null, chartAudienceChurn = null, chartVideo = null;
    let chartFunnel = null, chartScatter = null, chartGMVType = null, chartBestTime = null, chartCompare = null;
    let activeTodoId = null, sortableInstances = [];
    const STAGES = ['Ideas', 'Scripting', 'Filming', 'Editing', 'Ready to Post', 'Published'];

    function captureCurrentBrandUploadLabels() {
      if (activeBrandId !== 'brand_1' && activeBrandId !== 'brand_2') return;
      const ids = ['filename-overview', 'filename-audience', 'filename-video', 'filename-product', 'filename-vc-summary'];
      if (!brandsStore[activeBrandId].uploadLabels) {
        brandsStore[activeBrandId].uploadLabels = createDefaultUploadLabels();
      }
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.innerHTML.includes('fa-spinner')) {
          brandsStore[activeBrandId].uploadLabels[id] = el.innerHTML;
        }
      });
    }

    function applyBrandUploadLabels() {
      const defaults = createDefaultUploadLabels();
      const ids = Object.keys(defaults);
      if (activeBrandId === 'all') {
        const b1 = brandsStore.brand_1.meta.name;
        const b2 = brandsStore.brand_2.meta.name;
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = `<i class="fa-solid fa-layer-group text-amber-500 mr-1.5"></i> Mode Gabungan (${b1} + ${b2})`;
        });
        return;
      }
      const savedLabels = (brandsStore[activeBrandId] && brandsStore[activeBrandId].uploadLabels) || defaults;
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = savedLabels[id] || defaults[id];
      });
    }

    function buildCombinedHoldingState() {
      const combinedDB = createEmptyBrandDB();
      const b1 = brandsStore.brand_1;
      const b2 = brandsStore.brand_2;

      [
        { key: 'brand_1', store: b1 },
        { key: 'brand_2', store: b2 }
      ].forEach(({ store }) => {
        const bName = store.meta.name;
        const bDb = store.db || {};

        // Merge daily
        Object.entries(bDb.daily || {}).forEach(([date, dayData]) => {
          if (!dayData) return;
          if (!combinedDB.daily[date]) combinedDB.daily[date] = {};
          const targetDay = combinedDB.daily[date];

          if (dayData.overview) {
            if (!targetDay.overview) {
              targetDay.overview = { views: 0, reach: 0, profile: 0, followers: 0, lostFollowers: 0, netGrowth: 0, likes: 0, comments: 0, shares: 0, er: '0' };
            }
            const o = targetDay.overview;
            o.views += (dayData.overview.views || 0);
            o.reach += (dayData.overview.reach || 0);
            o.profile += (dayData.overview.profile || 0);
            o.followers += (dayData.overview.followers || 0);
            o.lostFollowers += (dayData.overview.lostFollowers || 0);
            o.netGrowth += (dayData.overview.netGrowth || 0);
            o.likes += (dayData.overview.likes || 0);
            o.comments += (dayData.overview.comments || 0);
            o.shares += (dayData.overview.shares || 0);
            o.er = o.views > 0 ? (((o.likes + o.comments + o.shares) / o.views) * 100).toFixed(2) : (dayData.overview.er || '0');
          }

          if (dayData.audience) {
            if (!targetDay.audience) {
              targetDay.audience = { reach: 0, engaged: 0, newFollowers: 0, totalFollowers: 0, er: '0' };
            }
            const a = targetDay.audience;
            a.reach += (dayData.audience.reach || 0);
            a.engaged += (dayData.audience.engaged || 0);
            a.newFollowers += (dayData.audience.newFollowers || 0);
            a.totalFollowers += (dayData.audience.totalFollowers || 0);
            a.er = a.reach > 0 ? ((a.engaged / a.reach) * 100).toFixed(2) : (dayData.audience.er || '0');
          }

          if (dayData.sales) {
            if (!targetDay.sales) {
              targetDay.sales = {
                tVV: 0, tProdView: 0, tClick: 0, tOrder: 0, tOrderDirect: 0, tOrderIndirect: 0, tBuyers: 0,
                tGmvTotal: 0, tGmvDirect: 0, tGmvIndirect: 0,
                countRows: 0, sumGpm: 0, sumRet: 0, videos: [], tags: {}
              };
            }
            const s = targetDay.sales;
            s.tVV += (dayData.sales.tVV || 0);
            s.tProdView += (dayData.sales.tProdView || 0);
            s.tClick += (dayData.sales.tClick || 0);
            s.tOrder += (dayData.sales.tOrder || 0);
            s.tOrderDirect += (dayData.sales.tOrderDirect || 0);
            s.tOrderIndirect += (dayData.sales.tOrderIndirect || 0);
            s.tBuyers += (dayData.sales.tBuyers || 0);
            s.tGmvTotal += (dayData.sales.tGmvTotal || 0);
            s.tGmvDirect += (dayData.sales.tGmvDirect || 0);
            s.tGmvIndirect += (dayData.sales.tGmvIndirect || 0);
            s.sumGpm += (dayData.sales.sumGpm || 0);
            s.sumRet += (dayData.sales.sumRet || 0);
            s.countRows += (dayData.sales.countRows || 0);
          }
        });

        // Merge videoList with brand prefix tag
        (bDb.videoList || []).forEach(v => {
          combinedDB.videoList.push({ ...v, title: `[${bName}] ${v.title}` });
        });

        // Merge salesVideos with brand prefix tag
        (bDb.salesVideos || []).forEach(v => {
          combinedDB.salesVideos.push({ ...v, title: `[${bName}] ${v.title}` });
        });

        // Merge globalTimeStats
        Object.entries(bDb.globalTimeStats || {}).forEach(([hr, st]) => {
          if (!combinedDB.globalTimeStats[hr]) combinedDB.globalTimeStats[hr] = { vv: 0, gmv: 0, count: 0 };
          combinedDB.globalTimeStats[hr].vv += (st.vv || 0);
          combinedDB.globalTimeStats[hr].gmv += (st.gmv || 0);
          combinedDB.globalTimeStats[hr].count += (st.count || 0);
        });

        // Merge todos & contents & lockedMonths
        (bDb.todos || []).forEach(t => {
          combinedDB.todos.push({ ...t, title: `[${bName}] ${t.title}` });
        });
        (bDb.contents || []).forEach(c => {
          combinedDB.contents.push({ ...c, title: `[${bName}] ${c.title}` });
        });
        Object.entries(bDb.lockedMonths || {}).forEach(([ym, isLocked]) => {
          if (isLocked) combinedDB.lockedMonths[ym] = true;
        });

        // Merge teamRoster & teamMembers (deduplicated by display label)
        const bRoster = ensureTeamRoster(bDb);
        if (!combinedDB._mergedLabels) {
          combinedDB.teamRoster = [];
          combinedDB.teamMembers = [];
          combinedDB._mergedLabels = new Set();
        }
        bRoster.forEach(m => {
          const lbl = getMemberDisplayLabel(m);
          if (!combinedDB._mergedLabels.has(lbl)) {
            combinedDB._mergedLabels.add(lbl);
            combinedDB.teamRoster.push({ ...m });
            combinedDB.teamMembers.push(lbl);
          }
        });
      });
      delete combinedDB._mergedLabels;

      const k1 = b1.kpiTargets || { gmv: 0, views: 0, followers: 0, ctr: 0 };
      const k2 = b2.kpiTargets || { gmv: 0, views: 0, followers: 0, ctr: 0 };
      const activeCtrCount = (k1.ctr > 0 ? 1 : 0) + (k2.ctr > 0 ? 1 : 0);
      const combinedKpi = {
        gmv: (k1.gmv || 0) + (k2.gmv || 0),
        views: (k1.views || 0) + (k2.views || 0),
        followers: (k1.followers || 0) + (k2.followers || 0),
        ctr: activeCtrCount > 0 ? (((k1.ctr || 0) + (k2.ctr || 0)) / activeCtrCount) : 0
      };

      return { db: combinedDB, kpiTargets: combinedKpi };
    }

    function syncActiveBrandPointers() {
      if (activeBrandId === 'all') {
        const combined = buildCombinedHoldingState();
        db = combined.db;
        kpiTargets = combined.kpiTargets;
      } else {
        if (!brandsStore[activeBrandId]) activeBrandId = 'brand_1';
        db = brandsStore[activeBrandId].db;
        kpiTargets = brandsStore[activeBrandId].kpiTargets;
      }
      applyBrandUploadLabels();
      updateBrandUIHeaders();
    }

    function ensureSingleBrandForWrite(actionDesc = 'menyimpan data') {
      if (activeBrandId !== 'all') return activeBrandId;
      const b1Name = brandsStore.brand_1.meta.name;
      const b2Name = brandsStore.brand_2.meta.name;
      const useBrand1 = confirm(`Anda sedang berada di Mode Holding (Gabungan 2 Brand).\n\nKlik "OK" untuk ${actionDesc} ke Brand 1 (${b1Name}).\nKlik "Cancel" untuk ${actionDesc} ke Brand 2 (${b2Name}).`);
      const targetBrand = useBrand1 ? 'brand_1' : 'brand_2';
      switchBrand(targetBrand, false);
      return targetBrand;
    }

    function switchBrand(brandId, showNotif = true) {
      if (!['brand_1', 'brand_2', 'all'].includes(brandId)) return;
      // Save current upload labels before switching away
      captureCurrentBrandUploadLabels();
      activeBrandId = brandId;
      localStorage.setItem('dework_active_brand', activeBrandId);
      syncActiveBrandPointers();
      renderAllTabs();
      renderWorkspace();
      renderContents();

      if (showNotif) {
        if (brandId === 'all') {
          showToast(`Mode Holding Aktif: Menampilkan gabungan ${brandsStore.brand_1.meta.name} + ${brandsStore.brand_2.meta.name}`, "info");
        } else {
          const meta = brandsStore[brandId].meta;
          showToast(`Workspace berpindah ke: ${meta.name} (${meta.handle})`, "success");
        }
      }
    }

    function cycleActiveBrand() {
      const order = ['brand_1', 'brand_2', 'all'];
      const nextIdx = (order.indexOf(activeBrandId) + 1) % order.length;
      switchBrand(order[nextIdx]);
    }

    function updateBrandUIHeaders() {
      const b1 = brandsStore.brand_1.meta;
      const b2 = brandsStore.brand_2.meta;

      // Update names in sidebar & top pills & report modal select
      const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };
      setTxt('sidebar-name-brand_1', b1.name);
      setTxt('sidebar-name-brand_2', b2.name);
      setTxt('top-pill-name-brand_1', b1.name);
      setTxt('top-pill-name-brand_2', b2.name);
      setTxt('rep-opt-brand_1', `Brand 1: ${b1.name}`);
      setTxt('rep-opt-brand_2', `Brand 2: ${b2.name}`);

      // Sidebar button active states
      const btn1 = document.getElementById('btn-brand-brand_1');
      const btn2 = document.getElementById('btn-brand-brand_2');
      const btnAll = document.getElementById('btn-brand-all');
      if (btn1) btn1.className = activeBrandId === 'brand_1'
        ? "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition bg-blue-600 text-white shadow-sm border border-blue-500"
        : "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800";
      if (btn2) btn2.className = activeBrandId === 'brand_2'
        ? "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition bg-emerald-600 text-white shadow-sm border border-emerald-500"
        : "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800";
      if (btnAll) btnAll.className = activeBrandId === 'all'
        ? "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition bg-amber-500 text-slate-950 shadow-sm border border-amber-400"
        : "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800";

      // Top pills active states
      const p1 = document.getElementById('top-pill-brand_1');
      const p2 = document.getElementById('top-pill-brand_2');
      const pAll = document.getElementById('top-pill-all');
      const inactivePill = "px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600";
      if (p1) p1.className = activeBrandId === 'brand_1' ? "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-blue-600 text-white shadow-xs" : inactivePill;
      if (p2) p2.className = activeBrandId === 'brand_2' ? "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-emerald-600 text-white shadow-xs" : inactivePill;
      if (pAll) pAll.className = activeBrandId === 'all' ? "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-amber-500 text-slate-950 shadow-xs" : inactivePill;

      // Top context banner details
      populatePillarDropdowns();
      const iconEl = document.getElementById('top-brand-icon');
      const badgeEl = document.getElementById('top-brand-mode-badge');
      const handleEl = document.getElementById('top-brand-handle');
      const titleEl = document.getElementById('top-brand-title');
      const mobilePill = document.getElementById('mobile-active-brand-pill');
      const resetLabel = document.getElementById('btn-reset-label');
      const ovHeading = document.getElementById('overview-main-heading');
      const ovSub = document.getElementById('overview-sub-heading');

      if (activeBrandId === 'brand_1') {
        if (iconEl) { iconEl.className = "w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0"; iconEl.innerText = "B1"; }
        if (badgeEl) { badgeEl.className = "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"; badgeEl.innerText = "WORKSPACE BRAND 1"; }
        if (handleEl) handleEl.innerText = b1.handle;
        if (titleEl) titleEl.innerText = `${b1.name} — Database & File Upload Terisolasi`;
        if (mobilePill) mobilePill.innerText = b1.name;
        if (resetLabel) resetLabel.innerText = `Reset Data ${b1.name} ke 0`;
        if (ovHeading) ovHeading.innerText = `Content & Revenue Overview — ${b1.name}`;
        if (ovSub) ovSub.innerText = `Dashboard analitik terpadu tim kreatif & performa penjualan ${b1.name} (${b1.handle}).`;
      } else if (activeBrandId === 'brand_2') {
        if (iconEl) { iconEl.className = "w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0"; iconEl.innerText = "B2"; }
        if (badgeEl) { badgeEl.className = "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"; badgeEl.innerText = "WORKSPACE BRAND 2"; }
        if (handleEl) handleEl.innerText = b2.handle;
        if (titleEl) titleEl.innerText = `${b2.name} — Database & File Upload Terisolasi`;
        if (mobilePill) mobilePill.innerText = b2.name;
        if (resetLabel) resetLabel.innerText = `Reset Data ${b2.name} ke 0`;
        if (ovHeading) ovHeading.innerText = `Content & Revenue Overview — ${b2.name}`;
        if (ovSub) ovSub.innerText = `Dashboard analitik terpadu tim kreatif & performa penjualan ${b2.name} (${b2.handle}).`;
      } else {
        if (iconEl) { iconEl.className = "w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs shrink-0"; iconEl.innerHTML = '<i class="fa-solid fa-building-columns"></i>'; }
        if (badgeEl) { badgeEl.className = "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"; badgeEl.innerText = "MODE HOLDING (2 BRAND)"; }
        if (handleEl) handleEl.innerText = `${b1.handle} + ${b2.handle}`;
        if (titleEl) titleEl.innerText = `Akumulasi Gabungan: ${b1.name} + ${b2.name}`;
        if (mobilePill) mobilePill.innerText = "Holding (2 Brand)";
        if (resetLabel) resetLabel.innerText = "Reset Semua Brand ke 0";
        if (ovHeading) ovHeading.innerText = `Holding Executive Overview (${b1.name} + ${b2.name})`;
        if (ovSub) ovSub.innerText = `Akumulasi total performa perusahaan & perbandingan Head-to-Head kedua brand.`;
      }
    }

    function renderBrandPillarsEditorInModal(brandKey, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const pillars = ensureBrandPillars(brandKey);
      const ringColor = brandKey === 'brand_1' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500';
      container.innerHTML = pillars.map((p, idx) => `
        <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div class="sm:col-span-5">
            <label class="block text-[9px] font-bold text-slate-400 uppercase">Pilar #${idx + 1} (Nama Kategori)</label>
            <input type="text" id="inp-${brandKey}-pillar-name-${idx}" value="${String(p.id || p.name || '').replace(/"/g, '&quot;')}" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-bold dark:text-white outline-none focus:ring-1 ${ringColor}">
          </div>
          <div class="sm:col-span-7">
            <label class="block text-[9px] font-bold text-slate-400 uppercase">Kata Kunci Deteksi Otomatis (Pisahkan Koma)</label>
            <input type="text" id="inp-${brandKey}-pillar-kw-${idx}" value="${(p.keywords || []).join(', ').replace(/"/g, '&quot;')}" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 outline-none focus:ring-1 ${ringColor}">
          </div>
        </div>
      `).join('');
    }

    function resetBrandPillarsToDefault(brandKey) {
      const nameInput = document.getElementById(brandKey === 'brand_1' ? 'inp-brand1-name' : 'inp-brand2-name');
      const brandName = nameInput ? nameInput.value.trim() : (brandsStore[brandKey] && brandsStore[brandKey].meta.name) || '';
      brandsStore[brandKey].pillars = getDefaultBrandPillars(brandKey, brandName);
      renderBrandPillarsEditorInModal(brandKey, brandKey === 'brand_1' ? 'brand1-pillars-editor' : 'brand2-pillars-editor');
      showToast(`Pilar produk ${brandName || brandKey} direset ke pengaturan standar!`, 'info');
    }

    function reclassifyBrandVideos(brandKey, forceResetLocked = false) {
      const bStore = brandsStore[brandKey];
      if (!bStore || !bStore.db) return false;
      let changed = false;
      (bStore.db.salesVideos || []).forEach(v => {
        if (v.pillarLocked && !forceResetLocked) return;
        if (forceResetLocked) v.pillarLocked = false;
        const det = getPillarClassificationDetails(v.title, v.tags || '', brandKey);
        if (v.pillar !== det.pillar || v.pillarSource !== det.sourceLabel) {
          v.pillar = det.pillar;
          v.pillarSource = det.sourceLabel;
          changed = true;
        }
      });
      (bStore.db.videoList || []).forEach(v => {
        if (v.pillarLocked && !forceResetLocked) return;
        if (forceResetLocked) v.pillarLocked = false;
        const newPil = classifyContentPillar(v.title, '', brandKey);
        if (v.pillar !== newPil) {
          v.pillar = newPil;
          changed = true;
        }
      });
      return changed;
    }

    function openBrandSettingsModal() {
      const m = document.getElementById('modal-brand-settings');
      if (!m) return;
      document.getElementById('inp-brand1-name').value = brandsStore.brand_1.meta.name || 'RAPAtech';
      document.getElementById('inp-brand1-handle').value = brandsStore.brand_1.meta.handle || '@rapa_indonesia';
      document.getElementById('inp-brand2-name').value = brandsStore.brand_2.meta.name || 'MONTRA';
      document.getElementById('inp-brand2-handle').value = brandsStore.brand_2.meta.handle || '@montra_id';
      renderBrandPillarsEditorInModal('brand_1', 'brand1-pillars-editor');
      renderBrandPillarsEditorInModal('brand_2', 'brand2-pillars-editor');
      const pinCfg = getWorkspacePinConfig();
      const pinCheck = document.getElementById('inp-workspace-pin-enabled');
      const pinCode = document.getElementById('inp-workspace-pin-code');
      if (pinCheck) pinCheck.checked = Boolean(pinCfg.enabled);
      if (pinCode) pinCode.value = pinCfg.pin || '';
      m.classList.remove('hidden');
    }

    function closeBrandSettingsModal() {
      const m = document.getElementById('modal-brand-settings');
      if (m) m.classList.add('hidden');
    }

    async function saveBrandSettings() {
      const n1 = document.getElementById('inp-brand1-name').value.trim() || 'RAPAtech';
      const h1 = document.getElementById('inp-brand1-handle').value.trim() || '@rapa_indonesia';
      const n2 = document.getElementById('inp-brand2-name').value.trim() || 'MONTRA';
      const h2 = document.getElementById('inp-brand2-handle').value.trim() || '@montra_id';

      brandsStore.brand_1.meta.name = n1;
      brandsStore.brand_1.meta.handle = h1.startsWith('@') ? h1 : '@' + h1;
      brandsStore.brand_2.meta.name = n2;
      brandsStore.brand_2.meta.handle = h2.startsWith('@') ? h2 : '@' + h2;

      ['brand_1', 'brand_2'].forEach(bk => {
        const pillars = ensureBrandPillars(bk);
        const emojis = bk === 'brand_1' ? ['🔌', '🔋', '📱', '🛡️', '🔴'] : ['✨', '👜', '🪐', '🛡️', '🔴'];
        pillars.forEach((p, idx) => {
          const nameEl = document.getElementById(`inp-${bk}-pillar-name-${idx}`);
          const kwEl = document.getElementById(`inp-${bk}-pillar-kw-${idx}`);
          if (nameEl && nameEl.value.trim()) {
            const cleanName = nameEl.value.trim();
            p.id = cleanName;
            p.name = cleanName;
            const emj = (p.badge && p.badge.split(' ')[0]) || emojis[idx] || '🏷️';
            p.badge = `${emj} ${cleanName}`;
          }
          if (kwEl) {
            const kws = kwEl.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            if (kws.length > 0) p.keywords = kws;
          }
        });
        reclassifyBrandVideos(bk);
      });

      const pinCheck = document.getElementById('inp-workspace-pin-enabled');
      const pinCode = document.getElementById('inp-workspace-pin-code');
      if (pinCheck && pinCode) {
        saveWorkspacePinConfig(pinCheck.checked, pinCode.value);
      }

      await saveToStorage();
      syncActiveBrandPointers();
      renderAllTabs();
      renderWorkspace();
      renderContents();
      closeBrandSettingsModal();
      showToast(`Profil & Pilar Produk disimpan: ${n1} & ${n2}!`, "success");
    }

    function computeBrandMetricsSummary(brandKey, monthYm = null) {
      const store = brandsStore[brandKey];
      const bDb = store ? store.db : createEmptyBrandDB();
      let gmv = 0, gmvDirect = 0, gmvIndirect = 0, sku = 0, impresi = 0, klik = 0;
      let views = 0, reach = 0, followers = 0, netGrowth = 0, erSum = 0, erCount = 0, gpmMax = 0;
      const allDates = Object.keys(bDb.daily || {}).sort();
      const dates = monthYm ? allDates.filter(d => d.startsWith(monthYm)) : allDates;

      dates.forEach(d => {
        const day = bDb.daily[d];
        if (!day) return;
        if (day.overview) {
          views += (day.overview.views || 0);
          reach += (day.overview.reach || 0);
          followers += (day.overview.followers || 0);
          netGrowth += (day.overview.netGrowth || 0);
          if (day.overview.er && Number(day.overview.er) > 0) {
            erSum += Number(day.overview.er);
            erCount++;
          }
        }
        if (day.sales) {
          gmv += (day.sales.tGmvTotal || 0);
          gmvDirect += (day.sales.tGmvDirect || 0);
          gmvIndirect += (day.sales.tGmvIndirect || 0);
          sku += (day.sales.tOrder || 0);
          impresi += (day.sales.tProdView || 0);
          klik += (day.sales.tClick || 0);
          const dayGpm = day.sales.countRows > 0 ? (day.sales.sumGpm / day.sales.countRows) : 0;
          if (dayGpm > gpmMax) gpmMax = dayGpm;
        }
      });

      if (views === 0) {
        dates.forEach(d => {
          const day = bDb.daily[d];
          if (day && day.sales) views += (day.sales.tVV || 0);
        });
      }

      const filterVidByMonth = (v) => {
        if (!monthYm) return true;
        if (v.reportMonth) return v.reportMonth === monthYm;
        return Boolean(v.date && v.date.startsWith(monthYm));
      };

      const filteredSalesVideos = (bDb.salesVideos || []).filter(filterVidByMonth);
      const filteredVideoList = (bDb.videoList || []).filter(filterVidByMonth);

      // If daily Video & Carousel Summary hasn't been uploaded yet for this brand, fallback to Produk & Sales per-video totals for comparison
      let salesVideosGmv = 0, salesVideosSku = 0, salesVideosImpresi = 0, salesVideosKlik = 0, salesVideosVV = 0;
      filteredSalesVideos.forEach(v => {
        salesVideosGmv += (v.gmv || 0);
        salesVideosSku += (v.order || 0);
        salesVideosImpresi += (v.impresi || 0);
        salesVideosKlik += (v.klik || 0);
        salesVideosVV += (v.vv || 0);
      });

      const effectiveGmv = gmv > 0 ? gmv : salesVideosGmv;
      const effectiveSku = sku > 0 ? sku : salesVideosSku;
      const effectiveImpresi = impresi > 0 ? impresi : salesVideosImpresi;
      const effectiveKlik = klik > 0 ? klik : salesVideosKlik;
      const effectiveViews = views > 0 ? views : salesVideosVV;

      const ctr = effectiveImpresi > 0 ? ((effectiveKlik / effectiveImpresi) * 100) : 0;
      const ctor = effectiveKlik > 0 ? ((effectiveSku / effectiveKlik) * 100) : 0;
      const vSource = (filteredVideoList.length > 0) ? filteredVideoList : filteredSalesVideos;
      const qtyVideoHashtag = vSource.filter(v => String(v.title || '').includes('#')).length;

      return {
        meta: store.meta,
        gmv: effectiveGmv,
        vcGmv: gmv,
        salesVideosGmv,
        sku: effectiveSku,
        impresi: effectiveImpresi,
        klik: effectiveKlik,
        ctr,
        ctor,
        views: effectiveViews,
        reach,
        followers,
        netGrowth,
        er: erCount > 0 ? (erSum / erCount) : 0,
        gpmMax,
        qtyVideoHashtag,
        totalVideos: vSource.length,
        salesVideosCount: filteredSalesVideos.length,
        activeDays: dates.length
      };
    }

    function renderHoldingComparison() {
      const container = document.getElementById('holding-brand-cards-container');
      if (!container) return;

      const m1 = computeBrandMetricsSummary('brand_1');
      const m2 = computeBrandMetricsSummary('brand_2');
      const totalHoldingGmv = m1.gmv + m2.gmv;
      const share1 = totalHoldingGmv > 0 ? ((m1.gmv / totalHoldingGmv) * 100) : 50;
      const share2 = totalHoldingGmv > 0 ? ((m2.gmv / totalHoldingGmv) * 100) : 50;

      const badgeEl = document.getElementById('holding-total-gmv-badge');
      if (badgeEl) badgeEl.innerText = `Total Omzet Perusahaan (2 Brand): ${formatRp(totalHoldingGmv)}`;

      const bar1 = document.getElementById('hb-bar-1');
      const bar2 = document.getElementById('hb-bar-2');
      const lbl1 = document.getElementById('hb-bar-label-1');
      const lbl2 = document.getElementById('hb-bar-label-2');
      if (bar1) bar1.style.width = `${share1.toFixed(1)}%`;
      if (bar2) bar2.style.width = `${share2.toFixed(1)}%`;
      if (lbl1) lbl1.innerText = `${m1.meta.name}: ${formatRp(m1.gmv)} (${totalHoldingGmv > 0 ? share1.toFixed(1) : '0.0'}%)`;
      if (lbl2) lbl2.innerText = `${m2.meta.name}: ${formatRp(m2.gmv)} (${totalHoldingGmv > 0 ? share2.toFixed(1) : '0.0'}%)`;

      const renderCard = (m, brandKey, sharePct, isActive, accent) => {
        const borderCls = isActive
          ? (accent === 'blue' ? 'border-blue-400 ring-2 ring-blue-500/30 bg-slate-800/90' : 'border-emerald-400 ring-2 ring-emerald-500/30 bg-slate-800/90')
          : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/60';
        const pillCls = accent === 'blue' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        const gmvCls = accent === 'blue' ? 'text-blue-400' : 'text-emerald-400';

        return `
          <div class="p-4 rounded-xl border ${borderCls} transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2.5">
                  <span class="px-2 py-0.5 text-[10px] font-black uppercase rounded border ${pillCls}">${brandKey === 'brand_1' ? 'Brand 1' : 'Brand 2'}</span>
                  <div>
                    <h3 class="text-sm font-bold text-white leading-tight">${m.meta.name}</h3>
                    <span class="text-[11px] text-slate-400 font-mono">${m.meta.handle}</span>
                  </div>
                </div>
                <button onclick="switchBrand('${brandKey}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${isActive ? 'bg-white text-slate-900 shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}">
                  ${isActive ? '<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i> Sedang Aktif' : 'Buka Workspace <i class="fa-solid fa-arrow-right ml-1 text-[9px]"></i>'}
                </button>
              </div>

              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">1. GMV</span>
                  <span class="text-xs font-extrabold ${gmvCls}">${formatRp(m.gmv)}</span>
                  <span class="text-[9px] text-slate-500 block">${totalHoldingGmv > 0 ? sharePct.toFixed(1) + '% Share' : '0%'}</span>
                </div>
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">2. SKU</span>
                  <span class="text-xs font-extrabold text-white">${formatNumber(m.sku)}</span>
                  <span class="text-[9px] text-slate-500 block">Pesanan</span>
                </div>
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">3. Impresi</span>
                  <span class="text-xs font-extrabold text-sky-400">${formatNumber(m.impresi)}</span>
                  <span class="text-[9px] text-slate-500 block">Produk</span>
                </div>
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">4. CTR (%)</span>
                  <span class="text-xs font-extrabold text-amber-400">${m.ctr.toFixed(2)}%</span>
                  <span class="text-[9px] text-slate-500 block">CTOR ${m.ctor.toFixed(1)}%</span>
                </div>
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">5. Klik</span>
                  <span class="text-xs font-extrabold text-blue-400">${formatNumber(m.klik)}</span>
                  <span class="text-[9px] text-slate-500 block">Keranjang</span>
                </div>
                <div class="p-2 rounded-lg bg-slate-950/60">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Qty Video (#)</span>
                  <span class="text-xs font-extrabold text-pink-400">${formatNumber(m.qtyVideoHashtag)}</span>
                  <span class="text-[9px] text-slate-500 block">${m.activeDays} Hr / ${m.salesVideosCount} Vid</span>
                </div>
              </div>
            </div>
          </div>
        `;
      };

      container.innerHTML =
        renderCard(m1, 'brand_1', share1, activeBrandId === 'brand_1', 'blue') +
        renderCard(m2, 'brand_2', share2, activeBrandId === 'brand_2', 'emerald');
    }

    function getIDB() {
      return new Promise((resolve, reject) => {
        if (idb) return resolve(idb);
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains('workspace')) {
            d.createObjectStore('workspace');
          }
        };
        req.onsuccess = (e) => {
          idb = e.target.result;
          resolve(idb);
        };
        req.onerror = (e) => reject(e);
      });
    }

    async function saveToStorage() {
      try {
        if (activeBrandId === 'brand_1' || activeBrandId === 'brand_2') {
          brandsStore[activeBrandId].db = db;
          brandsStore[activeBrandId].kpiTargets = kpiTargets;
          captureCurrentBrandUploadLabels();
        }

        const dbInstance = await getIDB();
        const tx = dbInstance.transaction('workspace', 'readwrite');
        const store = tx.objectStore('workspace');
        store.put(brandsStore, 'brands_store_v4');
        // Keep legacy keys updated with brand_1 for backward safety
        store.put(brandsStore.brand_1.db, 'main_data');
        store.put(brandsStore.brand_1.kpiTargets, 'kpi_targets');
        
        // Lightweight fallback to localStorage for essential metadata
        try {
          localStorage.setItem('dework_brands_meta', JSON.stringify({
            brand_1: brandsStore.brand_1.meta,
            brand_2: brandsStore.brand_2.meta
          }));
          localStorage.setItem('dework_active_brand', activeBrandId);
        } catch(e) {}

        updateStorageStatusBadge(true);
      } catch (err) {
        console.warn("IndexedDB save error, fallback active", err);
        updateStorageStatusBadge(false);
      }
    }

    async function loadFromStorage() {
      try {
        try { indexedDB.deleteDatabase('DeworkSpaceDB_v2'); } catch(e) {}
        try { indexedDB.deleteDatabase('DeworkSpaceDB_v1'); } catch(e) {}

        const dbInstance = await getIDB();
        const tx = dbInstance.transaction('workspace', 'readonly');
        const store = tx.objectStore('workspace');
        const getMultiReq = store.get('brands_store_v4');
        const getLegacyReq = store.get('main_data');
        const getLegacyKpi = store.get('kpi_targets');

        return new Promise((resolve) => {
          getMultiReq.onsuccess = () => {
            if (getMultiReq.result && getMultiReq.result.brand_1 && getMultiReq.result.brand_2) {
              brandsStore = getMultiReq.result;
              let cleanedContamination = false;
              ['brand_1', 'brand_2'].forEach(bk => {
                if (bk === 'brand_2' && brandsStore[bk].meta && (brandsStore[bk].meta.name === 'Brand Kedua' || !brandsStore[bk].meta.name)) {
                  brandsStore[bk].meta.name = 'MONTRA';
                  if (!brandsStore[bk].meta.handle || brandsStore[bk].meta.handle === '@brand_kedua') {
                    brandsStore[bk].meta.handle = '@montra_id';
                  }
                  cleanedContamination = true;
                }
                ensureBrandPillars(bk);
                if (!brandsStore[bk].uploadLabels) brandsStore[bk].uploadLabels = createDefaultUploadLabels();
                if (!brandsStore[bk].kpiTargets) brandsStore[bk].kpiTargets = { gmv: 0, views: 0, followers: 0, ctr: 0 };
                if (!brandsStore[bk].db) brandsStore[bk].db = createEmptyBrandDB();
                if (!brandsStore[bk].db.lockedMonths) brandsStore[bk].db.lockedMonths = {};
                ensureTeamRoster(brandsStore[bk].db);
                if (scrubSampleContaminationFromDb(brandsStore[bk].db, brandsStore[bk].uploadLabels, bk)) {
                  cleanedContamination = true;
                }
                if (reclassifyBrandVideos(bk, false)) {
                  cleanedContamination = true;
                }
              });
              syncActiveBrandPointers();
              if (cleanedContamination) {
                saveToStorage();
              }
              updateStorageStatusBadge(true);
              resolve(true);
            } else {
              // Check if legacy single-brand data exists and migrate to brand_1
              getLegacyReq.onsuccess = () => {
                if (getLegacyReq.result && (Object.keys(getLegacyReq.result.daily || {}).length > 0 || (getLegacyReq.result.videoList || []).length > 0 || (getLegacyReq.result.salesVideos || []).length > 0)) {
                  brandsStore.brand_1.db = getLegacyReq.result;
                  getLegacyKpi.onsuccess = async () => {
                    if (getLegacyKpi.result) {
                      brandsStore.brand_1.kpiTargets = Object.assign({ gmv: 0, views: 0, followers: 0, ctr: 0 }, getLegacyKpi.result);
                    }
                    syncActiveBrandPointers();
                    await saveToStorage();
                    updateStorageStatusBadge(true);
                    resolve(true);
                  };
                } else {
                  resetAllDataToZero(false, true);
                  resolve(true);
                }
              };
            }
          };
          getMultiReq.onerror = () => {
            resetAllDataToZero(false, true);
            resolve(false);
          };
        });
      } catch (e) {
        resetAllDataToZero(false, true);
      }
    }

    function confirmResetAllToZero() {
      if (activeBrandId === 'all') {
        if (confirm(`Kosongkan data KEDUA BRAND (${brandsStore.brand_1.meta.name} & ${brandsStore.brand_2.meta.name}) ke 0?`)) {
          resetAllDataToZero(true, true);
        }
      } else {
        const activeName = brandsStore[activeBrandId].meta.name;
        if (confirm(`Kosongkan semua data pada "${activeName}" ke 0 untuk siap upload file Excel baru?\n(Data brand lainnya tetap aman dan tidak akan terhapus)`)) {
          resetAllDataToZero(true, false);
        }
      }
    }

    async function resetAllDataToZero(showToastMsg = true, resetAllBrands = false) {
      const targetBrands = (resetAllBrands || activeBrandId === 'all') ? ['brand_1', 'brand_2'] : [activeBrandId];

      targetBrands.forEach(bk => {
        const preservedRoster = (brandsStore[bk] && brandsStore[bk].db && Array.isArray(brandsStore[bk].db.teamRoster) && brandsStore[bk].db.teamRoster.length > 0)
          ? brandsStore[bk].db.teamRoster
          : null;
        brandsStore[bk].db = createEmptyBrandDB();
        if (preservedRoster) {
          brandsStore[bk].db.teamRoster = preservedRoster;
          brandsStore[bk].db.teamMembers = preservedRoster.map(m => getMemberDisplayLabel(m));
        }
        brandsStore[bk].kpiTargets = { gmv: 0, views: 0, followers: 0, ctr: 0 };
        brandsStore[bk].uploadLabels = createDefaultUploadLabels();
      });

      syncActiveBrandPointers();
      await saveToStorage();
      renderAllTabs();
      renderWorkspace();
      renderContents();
      if (showToastMsg) {
        const msg = targetBrands.length > 1
          ? "Semua data pada Kedua Brand telah diset ke 0!"
          : `Data pada ${brandsStore[targetBrands[0]].meta.name} telah diset ke 0! Siap upload file Excel baru.`;
        showToast(msg, "info");
      }
    }

    function updateStorageStatusBadge(isOk) {
      const badge = document.getElementById('storage-status-badge');
      if (!badge) return;
      if (isOk) {
        badge.className = "text-[11px] text-emerald-400 mt-1 uppercase tracking-wider flex items-center font-semibold";
        badge.innerHTML = `<i class="fa-solid fa-database mr-1.5 text-xs text-emerald-400"></i> Multi-Brand DB (Saved)`;
      } else {
        badge.className = "text-[11px] text-amber-400 mt-1 uppercase tracking-wider flex items-center font-semibold";
        badge.innerHTML = `<i class="fa-solid fa-save mr-1.5 text-xs text-amber-400"></i> Local Storage Active`;
      }
    }

    // --- WORKSPACE EXPORT & IMPORT (MULTI-BRAND TEAM SHARING) ---
    function exportWorkspaceJSON() {
      captureCurrentBrandUploadLabels();
      const exportData = {
        meta: {
          app: 'Dework Space - Multi-Brand Content Analytics & Team Hub',
          exportedAt: new Date().toISOString(),
          activeBrandId: activeBrandId,
          multiBrandVersion: 4
        },
        brandsStore: brandsStore
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dework_multibrand_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup Multi-Brand (Brand 1 & Brand 2) berhasil di-export!", "success");
    }

    function importWorkspaceJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed.brandsStore && parsed.brandsStore.brand_1 && parsed.brandsStore.brand_2) {
            brandsStore = parsed.brandsStore;
          } else if (parsed.data) {
            const targetKey = ensureSingleBrandForWrite('mengimpor file JSON');
            brandsStore[targetKey].db = parsed.data;
            if (parsed.kpiTargets) brandsStore[targetKey].kpiTargets = parsed.kpiTargets;
          } else {
            const targetKey = ensureSingleBrandForWrite('mengimpor file JSON');
            brandsStore[targetKey].db = parsed;
          }
          syncActiveBrandPointers();
          await saveToStorage();
          renderAllTabs();
          renderWorkspace();
          renderContents();
          showToast("Workspace Multi-Brand berhasil di-import!", "success");
        } catch (err) {
          showToast("Gagal membaca file JSON: " + err.message, "error");
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // --- CONTENT PILLAR INTELLIGENCE CLASSIFIER (3-LAYER PRIORITY SCORING: TITLE > 1ST TAGGED PRODUCT > BASKET MAJORITY) ---
    const LOW_WEIGHT_PILLAR_KWS = new Set([
      'fast charging', 'fastcharging', 'quick charging', 'watt', '30w', '35w', '45w', '60w',
      'magsafe', 'wireless', 'kabel', 'cable'
    ]);
    const GENERIC_PROMO_KWS = new Set([
      'promo', 'diskon', 'guncang', 'payday', 'deal', 'bundling', 'live', 'paket'
    ]);
    const WORD_BOUNDARY_PILLAR_KWS = new Set([
      'ar', 'tg', 'pb', 'gan', 'mfi', 'avs', 'qi2', 'case', '30w', '35w', '45w', '60w'
    ]);

    function escapeRegexStr(s) {
      return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function matchPillarKeywordSafe(textLower, rawKw) {
      const k = String(rawKw || '').trim().toLowerCase();
      if (!k || !textLower) return -1;

      if (k === 'case') {
        const m = textLower.match(/(?:^|[^a-z0-9]|iphone|clear|aero|leather|orbit|hybrid|set\s+)case(?:$|[^a-z0-9])/i);
        return m ? m.index : -1;
      }
      if (k === 'line') {
        const m = textLower.match(/(?:^|[^a-z0-9])line\s*(?:\+|ii|flash|cable|kabel)(?:$|[^a-z0-9])/i);
        return m ? m.index : -1;
      }
      if (WORD_BOUNDARY_PILLAR_KWS.has(k) || k.length <= 3) {
        const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegexStr(k)}(?:$|[^a-z0-9])`, 'i');
        const m = textLower.match(re);
        return m ? m.index : -1;
      }
      return textLower.indexOf(k);
    }

    function scoreTextForBrandPillars(rawText, pillars, targetBrand) {
      const t = String(rawText || '').toLowerCase();
      const scores = {};
      const firstPos = {};
      pillars.forEach(p => {
        scores[p.id] = 0;
        firstPos[p.id] = 999999;
      });
      if (!t.trim()) return { scores, firstPos, bestPillar: null, maxScore: 0 };

      const hasCaseWord = (matchPillarKeywordSafe(t, 'case') !== -1) || t.includes('casing');
      const hasPbCore = ['powerbank', 'power bank', 'pb', 'origin loop', 'origin on', 'origin link', '5000mah', '10000mah', '10.000 mah', '20000mah', '20.000 mah'].some(
        x => matchPillarKeywordSafe(t, x) !== -1
      );

      pillars.forEach((p, pIdx) => {
        if (!p || !Array.isArray(p.keywords)) return;
        const isPromoPillar = p.id === 'Promo/Live' || String(p.id).toLowerCase().includes('promo');
        const isMontraSpecific = targetBrand === 'brand_2' && pIdx > 0 && !isPromoPillar;

        p.keywords.forEach(rawKw => {
          const kw = String(rawKw || '').trim().toLowerCase();
          if (!kw) return;
          // Prevent MagSafe / Wireless Cases from being misidentified as Power Bank
          if (p.id === 'Power Bank' && (kw === 'magsafe' || kw === 'wireless') && hasCaseWord && !hasPbCore) {
            return;
          }
          const pos = matchPillarKeywordSafe(t, kw);
          if (pos !== -1) {
            let weight = 10;
            if (LOW_WEIGHT_PILLAR_KWS.has(kw)) {
              weight = 2;
            } else if (isPromoPillar && GENERIC_PROMO_KWS.has(kw)) {
              weight = 4;
            } else if (isPromoPillar) {
              weight = 15;
            } else if (isMontraSpecific) {
              weight = 12;
            }
            scores[p.id] = (scores[p.id] || 0) + weight;
            if (pos < firstPos[p.id]) firstPos[p.id] = pos;
          }
        });
      });

      let bestPillar = null;
      let maxScore = 0;
      pillars.forEach(p => {
        const sc = scores[p.id] || 0;
        if (sc > maxScore || (sc > 0 && sc === maxScore && bestPillar && firstPos[p.id] < firstPos[bestPillar])) {
          maxScore = sc;
          bestPillar = p.id;
        }
      });

      return { scores, firstPos, bestPillar, maxScore };
    }

    function getPillarClassificationDetails(title, tagsStr = '', brandKey = null) {
      let targetBrand = brandKey;
      const rawTitle = String(title || '');
      if (!targetBrand) {
        const b2Name = (brandsStore.brand_2 && brandsStore.brand_2.meta && brandsStore.brand_2.meta.name) || 'MONTRA';
        if (activeBrandId === 'brand_2' || rawTitle.toLowerCase().startsWith(`[${b2Name.toLowerCase()}]`) || rawTitle.toLowerCase().includes('#montra')) {
          targetBrand = 'brand_2';
        } else {
          targetBrand = 'brand_1';
        }
      }

      const pillars = ensureBrandPillars(targetBrand);
      const defaultPillar = (pillars[0] && pillars[0].id) || (targetBrand === 'brand_2' ? 'Casing Clear' : 'Charger');
      const prods = parseProductTags(tagsStr);
      const primaryProduct = prods.length > 0 ? prods[0] : '';

      if (!rawTitle.trim() && prods.length === 0) {
        return { pillar: defaultPillar, sourceLabel: 'Default Brand', primaryProduct: '', totalProducts: 0 };
      }

      // LAYER 1: Judul & Hashtag Video (Prioritas Mutlak jika menyebut produk utama >= 10 poin)
      const s1 = scoreTextForBrandPillars(rawTitle, pillars, targetBrand);
      if (s1.maxScore >= 10) {
        // Check if there is an exact tie in Title; if so, break tie with 1st Tagged Product
        const tiedPillars = pillars.filter(p => (s1.scores[p.id] || 0) === s1.maxScore);
        if (tiedPillars.length > 1 && primaryProduct) {
          const sProd1 = scoreTextForBrandPillars(primaryProduct, pillars, targetBrand);
          let tieWinner = s1.bestPillar;
          let bestProdScore = -1;
          tiedPillars.forEach(tp => {
            const pScore = sProd1.scores[tp.id] || 0;
            if (pScore > bestProdScore) {
              bestProdScore = pScore;
              tieWinner = tp.id;
            }
          });
          return { pillar: tieWinner, sourceLabel: 'Judul Video + Produk #1', primaryProduct, totalProducts: prods.length };
        }
        return { pillar: s1.bestPillar, sourceLabel: 'Judul & Hashtag Video', primaryProduct, totalProducts: prods.length };
      }

      // LAYER 2: Produk Pertama (#1) di Keranjang Kuning (Produk Utama yang Di-pin Kreator)
      if (primaryProduct) {
        const s2 = scoreTextForBrandPillars(primaryProduct, pillars, targetBrand);
        if (s2.maxScore > 0) {
          return { pillar: s2.bestPillar, sourceLabel: 'Produk Utama (#1) Ditag', primaryProduct, totalProducts: prods.length };
        }
      }

      // LAYER 3: Dominasi Mayoritas Produk di Keranjang Kuning + Hint Judul
      if (prods.length > 1) {
        const combinedScores = {};
        pillars.forEach(p => { combinedScores[p.id] = (s1.scores[p.id] || 0) * 2; });
        prods.forEach((pr, idx) => {
          const sp = scoreTextForBrandPillars(pr, pillars, targetBrand);
          const mult = idx === 0 ? 3 : 1;
          pillars.forEach(p => {
            combinedScores[p.id] += (sp.scores[p.id] || 0) * mult;
          });
        });
        let best3 = null, max3 = 0;
        pillars.forEach(p => {
          if (combinedScores[p.id] > max3) {
            max3 = combinedScores[p.id];
            best3 = p.id;
          }
        });
        if (best3 && max3 > 0) {
          return { pillar: best3, sourceLabel: 'Dominasi Keranjang Kuning', primaryProduct, totalProducts: prods.length };
        }
      }

      // Secondary fallback if title had a low-weight hint (e.g., generic promo or feature keyword)
      if (s1.bestPillar && s1.maxScore > 0) {
        return { pillar: s1.bestPillar, sourceLabel: 'Konteks Judul Video', primaryProduct, totalProducts: prods.length };
      }

      return { pillar: defaultPillar, sourceLabel: 'Default Brand', primaryProduct, totalProducts: prods.length };
    }

    function classifyContentPillar(title, tagsStr = '', brandKey = null) {
      return getPillarClassificationDetails(title, tagsStr, brandKey).pillar;
    }

    function getPillarBadgeHtml(pillar, brandKey = null) {
      const allPillars = [...ensureBrandPillars('brand_1'), ...ensureBrandPillars('brand_2')];
      const found = allPillars.find(x => x.id === pillar || x.name === pillar);
      const colorMap = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
      };
      if (found) {
        const cls = colorMap[found.color] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        return `<span class="${cls} px-2 py-0.5 rounded text-[10px] font-bold">${found.badge || found.id}</span>`;
      }
      const p = pillar || (activeBrandId === 'brand_2' ? 'Casing Clear' : 'Charger');
      switch (p) {
        case 'Charger': return `<span class="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">🔌 Charger</span>`;
        case 'Power Bank': return `<span class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">🔋 Power Bank</span>`;
        case 'Case': return `<span class="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">📱 Case</span>`;
        case 'Casing Clear': return `<span class="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">✨ Casing Clear</span>`;
        case 'Casing Leather': return `<span class="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">👜 Casing Leather</span>`;
        case 'Casing Orbit': return `<span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">🪐 Casing Orbit</span>`;
        case 'Tempered Glass': return `<span class="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">🛡️ Tempered Glass</span>`;
        case 'Promo/Live': return `<span class="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">🔴 Promo/Live</span>`;
        default: return `<span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">${p}</span>`;
      }
    }

    function populatePillarDropdowns() {
      const pillars = getActiveBrandPillars();
      const selectIds = ['todo-pillar', 'modal-task-pillar', 'c-pillar'];
      selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const prevVal = el.value;
        el.innerHTML = pillars.map(p => `<option value="${p.id}">${p.badge || p.id}</option>`).join('');
        if (prevVal && pillars.some(p => p.id === prevVal)) {
          el.value = prevVal;
        }
      });

      const salesFilterEl = document.getElementById('sales-date-filter');
      if (salesFilterEl) {
        const prevSalesFilter = salesFilterEl.value;
        const baseOpts = [
          '<option value="all">Semua Video</option>',
          '<option value="with-gmv">Video Menghasilkan GMV (>Rp 0)</option>',
          '<option value="hashtag">Video Ber-Hashtag (#)</option>',
          '<option value="organic">Video Konten Utama (≥1K VV)</option>'
        ];
        const pillarOpts = pillars.map(p => `<option value="pillar:${p.id}">Pilar: ${p.name || p.id}</option>`);
        salesFilterEl.innerHTML = [...baseOpts, ...pillarOpts].join('');
        const validVals = ['all', 'with-gmv', 'hashtag', 'organic', ...pillars.map(p => `pillar:${p.id}`)];
        salesFilterEl.value = validVals.includes(prevSalesFilter) ? prevSalesFilter : 'all';
      }

      const todoTitleInp = document.getElementById('todo-title');
      if (todoTitleInp) {
        todoTitleInp.placeholder = activeBrandId === 'brand_2'
          ? 'Contoh: Uji Drop Test Casing Orbit MagSafe Stand vs Casing Leather...'
          : 'Contoh: Perbandingan Powerbank Loop 40W vs 22.5W...';
      }
    }

    // --- UTILS & NUMBER FORMATTING ---
    function formatRp(angka) {
      if (!angka) return 'Rp 0';
      if (angka >= 1e9) return 'Rp ' + (angka / 1e9).toFixed(1) + 'M';
      if (angka >= 1e6) return 'Rp ' + (angka / 1e6).toFixed(1) + 'Jt';
      return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
    }

    function formatNumber(num) {
      if (!num) return '0';
      if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
      return Math.round(num).toLocaleString('id-ID');
    }

    function ensureFullSheetRange(sheet) {
      if (!sheet || typeof XLSX === 'undefined' || !XLSX.utils) return;
      let maxR = 0, maxC = 0, hasCells = false;
      Object.keys(sheet).forEach(key => {
        if (!key || key[0] === '!') return;
        const cell = XLSX.utils.decode_cell(key);
        if (cell && typeof cell.r === 'number' && typeof cell.c === 'number') {
          hasCells = true;
          if (cell.r > maxR) maxR = cell.r;
          if (cell.c > maxC) maxC = cell.c;
        }
      });
      if (hasCells) {
        sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
      }
    }

    function detectDateOrderFromRows(rows, idxDate) {
      if (!Array.isArray(rows) || rows.length === 0) return false;
      let dmyVotes = 0;
      let mdyVotes = 0;
      rows.forEach(row => {
        if (!row) return;
        const raw = idxDate !== -1 && row[idxDate] !== undefined ? row[idxDate] : row[0];
        if (raw === null || raw === undefined || typeof raw === 'number' || raw instanceof Date) return;
        const s = String(raw).trim();
        const m = s.match(/\b(\d{1,2})[\/\-._](\d{1,2})[\/\-._](\d{2,4})\b/);
        if (m) {
          const p1 = Number(m[1]);
          const p2 = Number(m[2]);
          if (p1 > 12 && p2 <= 12) dmyVotes++;
          else if (p2 > 12 && p1 <= 12) mdyVotes++;
        }
      });
      return mdyVotes > dmyVotes;
    }

    function extractDate(val, fallbackYear = 2026, preferMDY = false) {
      if (val === null || val === undefined || val === '') return null;

      // 1. Native JS Date instance
      if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      // 2. Excel Serial Date Number (e.g. 44927 to 55000 -> years ~2023 to 2050)
      if (typeof val === 'number' && val > 40000 && val < 60000) {
        const utcDays = Math.floor(val - 25569);
        const dt = new Date(utcDays * 86400 * 1000);
        if (!isNaN(dt.getTime())) {
          const y = dt.getUTCFullYear();
          const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const d = String(dt.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }

      let s = String(val).trim();
      if (!s || s === '--' || s === '-') return null;

      // Numeric string representing Excel Serial Date
      if (/^\d{5}(\.\d+)?$/.test(s)) {
        const serial = parseFloat(s);
        if (serial > 40000 && serial < 60000) {
          const utcDays = Math.floor(serial - 25569);
          const dt = new Date(utcDays * 86400 * 1000);
          if (!isNaN(dt.getTime())) {
            const y = dt.getUTCFullYear();
            const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const d = String(dt.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
        }
      }

      // 3. Standard YYYY-MM-DD or YYYY/M/D or YYYY.M.D
      const isoMatch = s.match(/\b(\d{4})[\/\-._](\d{1,2})[\/\-._](\d{1,2})\b/);
      if (isoMatch) {
        const y = isoMatch[1];
        const m = String(isoMatch[2]).padStart(2, '0');
        const d = String(isoMatch[3]).padStart(2, '0');
        if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
          return `${y}-${m}-${d}`;
        }
      }

      // 4. DD/MM/YYYY or MM/DD/YYYY (supports 4-digit or 2-digit year, e.g. 15/10/2026, 10/15/2026, 10/15/26)
      const dmyMatch = s.match(/\b(\d{1,2})[\/\-._](\d{1,2})[\/\-._](\d{2,4})\b/);
      if (dmyMatch) {
        let p1 = Number(dmyMatch[1]);
        let p2 = Number(dmyMatch[2]);
        let yNum = Number(dmyMatch[3]);
        if (yNum < 100) yNum += 2000;
        let day = p1, month = p2;
        if (p2 > 12 && p1 <= 12) {
          month = p1;
          day = p2;
        } else if (p1 > 12 && p2 <= 12) {
          day = p1;
          month = p2;
        } else if (preferMDY) {
          month = p1;
          day = p2;
        }
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && yNum >= 2020 && yNum <= 2035) {
          return `${yNum}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // 5. Text Month Formats (Indonesian & English): "15 Oktober 2026", "Oct 15, 2026", "15-Oct-2026", "15 Okt", "Oct 15"
      const monthNamesMap = {
        jan: 1, januari: 1, january: 1,
        feb: 2, februari: 2, february: 2,
        mar: 3, maret: 3, march: 3,
        apr: 4, april: 4,
        mei: 5, may: 5,
        jun: 6, juni: 6, june: 6,
        jul: 7, juli: 7, july: 7,
        aug: 8, ags: 8, agt: 8, agustus: 8, august: 8,
        sep: 9, sept: 9, september: 9,
        oct: 10, okt: 10, oktober: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, des: 12, desember: 12, december: 12
      };

      // Pattern A: "15 Okt 2026" or "15-Oct-2026" or "15 Oktober"
      const dmText = s.toLowerCase().match(/\b(\d{1,2})[\s\-/,]+([a-z]{3,10})(?:[\s\-/,]+(\d{2,4}))?\b/);
      if (dmText && monthNamesMap[dmText[2]]) {
        const day = Number(dmText[1]);
        const month = monthNamesMap[dmText[2]];
        let year = dmText[3] ? Number(dmText[3]) : fallbackYear;
        if (year < 100) year += 2000;
        if (day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // Pattern B: "Oct 15, 2026" or "October 15"
      const mdText = s.toLowerCase().match(/\b([a-z]{3,10})[\s\-/,]+(\d{1,2})(?:[\s\-/,]+(\d{2,4}))?\b/);
      if (mdText && monthNamesMap[mdText[1]]) {
        const month = monthNamesMap[mdText[1]];
        const day = Number(mdText[2]);
        let year = mdText[3] ? Number(mdText[3]) : fallbackYear;
        if (year < 100) year += 2000;
        if (day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      return null;
    }

    function cleanNumber(val) {
      if (val === "--" || val === "-" || val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return val;
      const rawStr = String(val).trim();
      const hasPercent = rawStr.includes('%');
      let str = rawStr.replace(/Rp|IDR|%|\s/gi, '').trim();
      if (hasPercent || /^-?\d+[.,]\d{1,2}$/.test(str) || /^0[.,]\d+$/.test(str)) {
        str = str.replace(/,/g, '.');
      } else {
        // Remove dots or commas when used as thousands separators (followed by 3 digits)
        str = str
          .replace(/\.(?=\d{3}(?:\.|$|,))/g, '')
          .replace(/,(?=\d{3}(?:,|$|\.))/g, '')
          .replace(/,/g, '.');
      }
      let parsed = Number(str);
      return isNaN(parsed) ? 0 : parsed;
    }

    function parseProductTags(rawTagStr) {
      if (!rawTagStr || rawTagStr === 'undefined') return [];
      const s = String(rawTagStr).trim();
      if (!s) return [];
      // If formatted with TikTok product IDs like "Product Name(1735730974568056228),Next Product..."
      if (/\(\d{10,}\)/.test(s)) {
        return s
          .split(/\(\d{10,}\)\s*,?\s*/)
          .map(p => p.trim())
          .filter(p => p.length > 1);
      }
      return s
        .split(/\s*,\s*(?=[A-Z\["(])/)
        .map(p => p.replace(/\(\d{10,}\)/g, '').trim())
        .filter(p => p.length > 1);
    }

    function truncateWords(str, maxWords) {
      if (!str || str === 'undefined') return '';
      const words = String(str).split(' ');
      return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : str;
    }

    // --- MULTI-MONTH (MoM) & SMART MERGE ENGINE (OPSI C) ---
    let uploadMergeMode = localStorage.getItem('dework_upload_merge_mode') || 'merge';
    let compareMode = 'month'; // 'month' | 'custom'
    let compareSelectionMode = 'month'; // 'month' | 'custom'
    let compareNormMode = 'total'; // 'total' | 'daily'

    const MONTH_FULL_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    function formatMonthLabel(ym, short = false) {
      if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '-';
      const [y, m] = ym.split('-').map(Number);
      const idx = Math.max(0, Math.min(11, m - 1));
      return `${short ? MONTH_SHORT_ID[idx] : MONTH_FULL_ID[idx]} ${y}`;
    }

    function getCalendarDaysInMonth(ym) {
      if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return 30;
      const [y, m] = ym.split('-').map(Number);
      return new Date(y, m, 0).getDate();
    }

    function getAvailableMonths() {
      const monthMap = {};
      const dailyDates = Object.keys(db.daily || {}).sort();

      dailyDates.forEach(d => {
        if (!d || d.length < 7) return;
        const ym = d.slice(0, 7);
        if (!monthMap[ym]) {
          monthMap[ym] = { dates: [] };
        }
        monthMap[ym].dates.push(d);
      });

      // Also include any month explicitly tagged via reportMonth on salesVideos or videoList
      [...(db.salesVideos || []), ...(db.videoList || [])].forEach(v => {
        if (v && v.reportMonth && /^\d{4}-\d{2}$/.test(v.reportMonth)) {
          if (!monthMap[v.reportMonth]) {
            monthMap[v.reportMonth] = { dates: [] };
          }
          if (v.date && v.date.startsWith(v.reportMonth) && !monthMap[v.reportMonth].dates.includes(v.date)) {
            monthMap[v.reportMonth].dates.push(v.date);
          }
        }
      });

      // Fallback if db.daily is empty and no reportMonth was set
      if (Object.keys(monthMap).length === 0) {
        const videoDates = [
          ...(db.videoList || []).map(v => v.date),
          ...(db.salesVideos || []).map(v => v.date)
        ].filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

        videoDates.forEach(d => {
          const ym = d.slice(0, 7);
          if (!monthMap[ym]) monthMap[ym] = { dates: [] };
          if (!monthMap[ym].dates.includes(d)) monthMap[ym].dates.push(d);
        });
      }

      return Object.keys(monthMap).sort().map(ym => {
        const dates = monthMap[ym].dates.sort();
        const calDays = getCalendarDaysInMonth(ym);
        return {
          ym: ym,
          label: formatMonthLabel(ym, false),
          shortLabel: formatMonthLabel(ym, true),
          startDate: `${ym}-01`,
          endDate: `${ym}-${String(calDays).padStart(2, '0')}`,
          firstActiveDate: dates[0] || `${ym}-01`,
          lastActiveDate: dates[dates.length - 1] || `${ym}-${String(calDays).padStart(2, '0')}`,
          activeDays: dates.length,
          calendarDays: calDays
        };
      });
    }

    function isMonthLocked(ym) {
      if (!ym || !db) return false;
      if (!db.lockedMonths) db.lockedMonths = {};
      return Boolean(db.lockedMonths[ym]);
    }

    function toggleLockMonth(ym) {
      if (!ym) return;
      ensureSingleBrandForWrite(`mengubah status kunci bulan ${formatMonthLabel(ym)}`);
      if (!db.lockedMonths) db.lockedMonths = {};
      if (db.lockedMonths[ym]) {
        delete db.lockedMonths[ym];
        showToast(`🔓 Kunci Arsip Bulan ${formatMonthLabel(ym)} dibuka. Data bulan ini kini dapat diperbarui.`, 'info');
      } else {
        db.lockedMonths[ym] = true;
        showToast(`🔒 Bulan ${formatMonthLabel(ym)} berhasil DIKUNCI! Aman dari penimpaan & penghapusan tidak sengaja.`, 'success');
      }
      saveToStorage();
      renderAllTabs();
      const modal = document.getElementById('modal-monthly-vault');
      if (modal && !modal.classList.contains('hidden')) {
        renderMonthlyVaultModal();
      }
    }

    function getSellerCenter60DayStatus(ym) {
      if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return { isExpired: false, isWarning: false, daysAgo: 0, badgeHtml: '' };
      const firstDay = new Date(`${ym}-01T00:00:00`);
      const now = new Date();
      const diffDays = Math.floor((now - firstDay) / (1000 * 60 * 60 * 24));
      if (diffDays > 60) {
        return {
          isExpired: true,
          isWarning: false,
          daysAgo: diffDays,
          badgeHtml: `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800" title="Data awal bulan ini sudah >60 hari lalu (${diffDays} hari) dan tidak bisa ditarik ulang dari Seller Center. Wajib Lock & Backup!"><i class="fa-solid fa-clock-rotate-left"></i> >60 Hari (${diffDays}hr lalu)</span>`
        };
      } else if (diffDays >= 35) {
        return {
          isExpired: false,
          isWarning: true,
          daysAgo: diffDays,
          badgeHtml: `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Mendekati batas 60 hari penarikan Seller Center (${60 - diffDays} hari tersisa). Segera kunci & backup!"><i class="fa-solid fa-hourglass-half"></i> Sisa ${Math.max(1, 60 - diffDays)} Hr di Seller Center</span>`
        };
      }
      return {
        isExpired: false,
        isWarning: false,
        daysAgo: Math.max(0, diffDays),
        badgeHtml: `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><i class="fa-solid fa-shield-check"></i> Dalam Rentang 60 Hari</span>`
      };
    }

    function getMonthCompletenessDetails(ym) {
      let overviewDays = 0, audienceDays = 0, vcSummaryDays = 0;
      Object.keys(db.daily || {}).forEach(d => {
        if (!d.startsWith(ym)) return;
        const day = db.daily[d];
        if (!day) return;
        if (day.overview && ((day.overview.views || 0) > 0 || (day.overview.reach || 0) > 0 || (day.overview.followers || 0) > 0)) overviewDays++;
        if (day.audience && ((day.audience.reach || 0) > 0 || (day.audience.engaged || 0) > 0)) audienceDays++;
        if (day.sales && ((day.sales.tGmvTotal || 0) > 0 || (day.sales.tProdView || 0) > 0 || (day.sales.tClick || 0) > 0 || (day.sales.tOrder || 0) > 0)) vcSummaryDays++;
      });

      const videoPerfCount = (db.videoList || []).filter(v => (v.reportMonth === ym) || (!v.reportMonth && v.date && v.date.startsWith(ym))).length;
      const productSalesVideos = (db.salesVideos || []).filter(v => (v.reportMonth === ym) || (!v.reportMonth && v.date && v.date.startsWith(ym)));
      const productSalesCount = productSalesVideos.length;
      const productSalesGmv = productSalesVideos.reduce((acc, v) => acc + (v.gmv || 0), 0);

      const filesCompleted =
        (overviewDays > 0 ? 1 : 0) +
        (audienceDays > 0 ? 1 : 0) +
        (videoPerfCount > 0 ? 1 : 0) +
        (vcSummaryDays > 0 ? 1 : 0) +
        (productSalesCount > 0 ? 1 : 0);

      return {
        overviewDays,
        audienceDays,
        videoPerfCount,
        vcSummaryDays,
        productSalesCount,
        productSalesGmv,
        filesCompleted
      };
    }

    function setUploadMergeMode(mode) {
      uploadMergeMode = (mode === 'replace') ? 'replace' : 'merge';
      localStorage.setItem('dework_upload_merge_mode', uploadMergeMode);
      const sel = document.getElementById('upload-merge-mode-select');
      if (sel && sel.value !== uploadMergeMode) sel.value = uploadMergeMode;
      showToast(
        uploadMergeMode === 'merge'
          ? 'Mode Smart Merge Aktif: Upload file bulan baru akan digabungkan dengan bulan sebelumnya!'
          : 'Mode Replace Aktif: Upload daftar video baru akan menggantikan daftar sebelumnya.',
        'info'
      );
    }

    function deleteStoredMonth(ym) {
      if (!ym) return;
      ensureSingleBrandForWrite(`menghapus data bulan ${formatMonthLabel(ym)}`);
      const label = formatMonthLabel(ym, false);
      if (isMonthLocked(ym)) {
        showToast(`🔒 Bulan ${label} sedang DIKUNCI. Buka kunci terlebih dahulu di Arsip Bulanan (Vault) jika ingin menghapusnya.`, 'error');
        return;
      }
      if (!confirm(`Hapus seluruh data arsip untuk bulan ${label} dari brand ini?`)) return;

      Object.keys(db.daily || {}).forEach(d => {
        if (d.startsWith(ym)) delete db.daily[d];
      });
      db.videoList = (db.videoList || []).filter(v => {
        if (v.reportMonth) return v.reportMonth !== ym;
        return !(v.date && v.date.startsWith(ym));
      });
      db.salesVideos = (db.salesVideos || []).filter(v => {
        if (v.reportMonth) return v.reportMonth !== ym;
        return !(v.date && v.date.startsWith(ym));
      });
      db.globalTimeStats = rebuildGlobalTimeStats(db.salesVideos);
      saveToStorage();
      renderAllTabs();
      const modal = document.getElementById('modal-monthly-vault');
      if (modal && !modal.classList.contains('hidden')) {
        renderMonthlyVaultModal();
      }
      showToast(`Data arsip bulan ${label} telah dihapus.`, 'info');
    }

    function mergeVideosList(existingList, newList) {
      if (uploadMergeMode === 'replace') {
        const lockedItems = (existingList || []).filter(ev => {
          const ym = ev.reportMonth || (ev.date ? ev.date.slice(0, 7) : '');
          return ym && isMonthLocked(ym);
        });
        return [...lockedItems, ...newList];
      }
      if (!Array.isArray(existingList) || existingList.length === 0) {
        return newList;
      }
      const merged = [...existingList];
      newList.forEach(nv => {
        const nvYm = nv.reportMonth || (nv.date ? nv.date.slice(0, 7) : '');
        const idx = merged.findIndex(ev => {
          const evYm = ev.reportMonth || (ev.date ? ev.date.slice(0, 7) : '');
          return evYm === nvYm && (
            (nv.link && ev.link && nv.link === ev.link) ||
            (ev.title === nv.title && ev.date === nv.date)
          );
        });
        if (idx > -1) {
          if (merged[idx].pillarLocked) {
            nv.pillar = merged[idx].pillar;
            nv.pillarLocked = true;
            nv.pillarSource = 'Manual Lock';
          }
          merged[idx] = nv;
        } else {
          merged.push(nv);
        }
      });
      return merged;
    }

    function mergeSalesVideosList(existingList, newList) {
      if (uploadMergeMode === 'replace') {
        const lockedItems = (existingList || []).filter(ev => {
          const ym = ev.reportMonth || (ev.date ? ev.date.slice(0, 7) : '');
          return ym && isMonthLocked(ym);
        });
        return [...lockedItems, ...newList];
      }
      if (!Array.isArray(existingList) || existingList.length === 0) {
        return newList;
      }
      const merged = [...existingList];
      newList.forEach(nv => {
        const nvYm = nv.reportMonth || '';
        const idx = merged.findIndex(ev =>
          ev.title === nv.title &&
          ev.date === nv.date &&
          (ev.reportMonth || '') === nvYm
        );
        if (idx > -1) {
          if (merged[idx].pillarLocked) {
            nv.pillar = merged[idx].pillar;
            nv.pillarLocked = true;
            nv.pillarSource = 'Manual Lock';
          }
          merged[idx] = nv;
        } else {
          merged.push(nv);
        }
      });
      return merged;
    }

    function rebuildGlobalTimeStats(salesVideosArr) {
      const stats = {};
      (salesVideosArr || []).forEach(v => {
        const rawTime = String(v.time || '');
        const timeMatch = rawTime.match(/(\d{2}):\d{2}/);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1], 10);
          if (!stats[hour]) stats[hour] = { vv: 0, gmv: 0, count: 0 };
          stats[hour].vv += Number(v.vv || 0);
          stats[hour].gmv += Number(v.gmv || 0);
          stats[hour].count++;
        }
      });
      return stats;
    }

    function renderStoredMonthsBar() {
      const months = getAvailableMonths();
      const badge = document.getElementById('multi-month-count-badge');
      const sidebarBadge = document.getElementById('sidebar-vault-count-badge');
      const topBtnLabel = document.getElementById('top-vault-btn-label');
      const pillsEl = document.getElementById('stored-months-pills');
      const mergeSel = document.getElementById('upload-merge-mode-select');
      if (mergeSel) mergeSel.value = uploadMergeMode;

      if (badge) badge.innerText = `${months.length} Bulan Tersimpan`;
      if (sidebarBadge) sidebarBadge.innerText = `${months.length} Bln`;
      if (topBtnLabel) topBtnLabel.innerText = `Arsip Bulanan (${months.length} Bln)`;
      if (!pillsEl) return;

      if (months.length === 0) {
        pillsEl.innerHTML = `<span class="text-xs text-slate-400">Belum ada bulan tersimpan. Silakan upload file Excel (misal: September & Oktober) atau klik tombol <strong>"Simulasi Data Sep vs Okt"</strong>.</span>`;
        return;
      }

      pillsEl.innerHTML = months.map((m, idx) => {
        const isLatest = idx === months.length - 1;
        const locked = isMonthLocked(m.ym);
        const comp = getMonthCompletenessDetails(m.ym);
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            locked
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : isLatest
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }">
            <button type="button" onclick="toggleLockMonth('${m.ym}')" class="hover:scale-110 transition cursor-pointer" title="${locked ? 'Bulan Dikunci (Klik untuk buka kunci)' : 'Klik untuk mengunci (Lock) bulan ini agar aman dari penimpaan'}">
              <i class="fa-solid ${locked ? 'fa-lock text-amber-500' : 'fa-lock-open text-slate-400 hover:text-amber-500'} text-[10px]"></i>
            </button>
            <span>${m.label}</span>
            <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-800 text-slate-500" title="Hari aktif & kelengkapan 5 file Excel">${m.activeDays}hr • ${comp.filesCompleted}/5 File</span>
            ${activeBrandId !== 'all' && !locked ? `<button type="button" onclick="deleteStoredMonth('${m.ym}')" class="text-slate-400 hover:text-rose-500 ml-0.5 transition" title="Hapus bulan ${m.label}"><i class="fa-solid fa-xmark text-[10px]"></i></button>` : ''}
          </div>
        `;
      }).join('');
    }

    // --- MONTHLY DATA VAULT MODAL & SNAPSHOT BACKUP/RESTORE ENGINE (IDE 1, 2, 3) ---
    function openMonthlyVaultModal() {
      const modal = document.getElementById('modal-monthly-vault');
      if (!modal) return;
      const months = getAvailableMonths();
      const quickTargetInput = document.getElementById('vault-quick-target-month');
      if (quickTargetInput && !quickTargetInput.value) {
        const latestYm = months.length > 0 ? months[months.length - 1].ym : new Date().toISOString().slice(0, 7);
        quickTargetInput.value = latestYm;
        syncVaultTargetMonth(latestYm);
      }
      renderMonthlyVaultModal();
      modal.classList.remove('hidden');
    }

    function closeMonthlyVaultModal() {
      const modal = document.getElementById('modal-monthly-vault');
      if (modal) modal.classList.add('hidden');
    }

    function syncVaultTargetMonth(ym) {
      const prodTarget = document.getElementById('product-upload-target-month');
      const vidTarget = document.getElementById('video-upload-target-month');
      if (prodTarget) prodTarget.value = ym || '';
      if (vidTarget) vidTarget.value = ym || '';
    }

    function triggerUploadFromVault(type) {
      const quickTargetInput = document.getElementById('vault-quick-target-month');
      const ym = quickTargetInput ? quickTargetInput.value : '';
      if (ym && isMonthLocked(ym)) {
        showToast(`🔒 Bulan ${formatMonthLabel(ym)} sedang DIKUNCI. Buka kunci bulan tersebut jika ingin mengunggah/memperbarui datanya.`, 'error');
        return;
      }
      syncVaultTargetMonth(ym);
      if (type === 'overview') document.getElementById('file-overview').click();
      else if (type === 'audience') document.getElementById('file-audience').click();
      else if (type === 'video') document.getElementById('file-video').click();
      else if (type === 'vc-summary') document.getElementById('file-vc-summary').click();
      else if (type === 'product') document.getElementById('file-product').click();
    }

    function renderMonthlyVaultModal() {
      const subtitleEl = document.getElementById('vault-brand-subtitle');
      const totalSummaryEl = document.getElementById('vault-total-months-summary');
      const gridEl = document.getElementById('vault-months-grid');
      if (!gridEl) return;

      const b1Meta = brandsStore.brand_1.meta;
      const b2Meta = brandsStore.brand_2.meta;
      if (subtitleEl) {
        subtitleEl.innerText = activeBrandId === 'brand_1'
          ? `${b1Meta.name} (${b1Meta.handle})`
          : activeBrandId === 'brand_2'
            ? `${b2Meta.name} (${b2Meta.handle})`
            : `Holding Gabungan (${b1Meta.name} + ${b2Meta.name})`;
      }

      const months = [...getAvailableMonths()].reverse(); // Newest month first
      if (totalSummaryEl) {
        const lockedCount = months.filter(m => isMonthLocked(m.ym)).length;
        totalSummaryEl.innerText = `${months.length} Bulan Tersimpan (${lockedCount} Dikunci 🔒)`;
      }

      if (months.length === 0) {
        gridEl.innerHTML = `
          <div class="col-span-full p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <i class="fa-solid fa-vault text-3xl text-slate-400 mb-2"></i>
            <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">Brankas Arsip Bulanan Masih Kosong</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-lg mx-auto">Silakan pilih bulan di bagian "Upload Cepat File Excel" di atas atau klik tombol <strong>"Muat Contoh Arsip 2 Bulan (Sep & Okt)"</strong> untuk melihat simulasi penyimpanan multi-bulan.</p>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = months.map(m => {
        const locked = isMonthLocked(m.ym);
        const comp = getMonthCompletenessDetails(m.ym);
        const agg = getAggregatedData(m.startDate, m.endDate);
        const scStatus = getSellerCenter60DayStatus(m.ym);
        const dayCoveragePct = Math.min(100, Math.round((m.activeDays / Math.max(1, m.calendarDays)) * 100));
        const effectiveGmv = agg.gmv > 0 ? agg.gmv : comp.productSalesGmv;

        const pillCheck = (ok, label, sub) => `
          <div class="p-2 rounded-lg border text-left ${ok ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'}">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-extrabold ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}">${label}</span>
              <i class="fa-solid ${ok ? 'fa-circle-check text-emerald-500' : 'fa-circle-minus text-slate-400'} text-[10px]"></i>
            </div>
            <span class="text-[9px] text-slate-400 block mt-0.5 truncate">${sub}</span>
          </div>
        `;

        return `
          <div class="p-5 rounded-2xl border transition flex flex-col justify-between shadow-xs ${
            locked
              ? 'bg-amber-50/20 dark:bg-slate-800/90 border-amber-400 dark:border-amber-600/80 ring-1 ring-amber-400/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }">
            <div>
              <!-- Card Top Header -->
              <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      ${locked ? '<i class="fa-solid fa-lock text-amber-500 text-xs"></i>' : '<i class="fa-regular fa-calendar-check text-emerald-500 text-xs"></i>'}
                      ${m.label}
                    </h4>
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${comp.filesCompleted === 5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}">
                      ${comp.filesCompleted}/5 File Lengkap
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Rentang Aktif: <strong>${m.firstActiveDate}</strong> s/d <strong>${m.lastActiveDate}</strong></p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  ${scStatus.badgeHtml}
                </div>
              </div>

              <!-- Day Coverage Progress Bar -->
              <div class="mb-3">
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-500 font-semibold">Kelengkapan Hari Kalender:</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">${m.activeDays} dari ${m.calendarDays} Hari (${dayCoveragePct}%)</span>
                </div>
                <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-2 rounded-full ${dayCoveragePct >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}" style="width: ${dayCoveragePct}%"></div>
                </div>
              </div>

              <!-- 5-File Checklist -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3">
                ${pillCheck(comp.overviewDays > 0, '1. Overview', `${comp.overviewDays} Hari`)}
                ${pillCheck(comp.audienceDays > 0, '2. Audience', `${comp.audienceDays} Hari`)}
                ${pillCheck(comp.videoPerfCount > 0, '3. Video Perf', `${comp.videoPerfCount} Video`)}
                ${pillCheck(comp.vcSummaryDays > 0, '4. V&C Summary', `${comp.vcSummaryDays} Hari`)}
                ${pillCheck(comp.productSalesCount > 0, '5. Produk Sales', `${comp.productSalesCount} Video`)}
              </div>

              <!-- Mini Monthly KPI Summary -->
              <div class="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700/70 text-center mb-4">
                <div>
                  <span class="text-[9px] font-bold uppercase text-slate-400 block">GMV Bulan Ini</span>
                  <span class="text-xs font-black text-emerald-600 dark:text-emerald-400">${formatRp(effectiveGmv)}</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold uppercase text-slate-400 block">Pesanan SKU</span>
                  <span class="text-xs font-black text-slate-800 dark:text-white">${formatNumber(agg.order)}</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold uppercase text-slate-400 block">CTR Produk</span>
                  <span class="text-xs font-black text-amber-500">${agg.ctr.toFixed(2)}%</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold uppercase text-slate-400 block">Qty Video (#)</span>
                  <span class="text-xs font-black text-pink-600">${formatNumber(agg.qtyVideoHashtag)}</span>
                </div>
              </div>
            </div>

            <!-- Action Footer per Month -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="toggleLockMonth('${m.ym}')" class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  locked
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                }">
                  <i class="fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'}"></i>
                  ${locked ? 'Terkunci (Klik Buka)' : 'Kunci Bulan (Lock)'}
                </button>
                <button type="button" onclick="exportSingleMonthJSON('${m.ym}')" class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 cursor-pointer" title="Download file backup .json khusus bulan ${m.label}">
                  <i class="fa-solid fa-file-arrow-down"></i> Backup .JSON Bulan Ini
                </button>
              </div>
              ${activeBrandId !== 'all' ? `
                <button type="button" onclick="deleteStoredMonth('${m.ym}')" class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${locked ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'} transition" title="${locked ? 'Buka kunci terlebih dahulu untuk menghapus' : 'Hapus arsip bulan ini'}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    function exportSingleMonthJSON(ym) {
      if (!ym) return;
      const targetKey = activeBrandId === 'all' ? 'brand_1' : activeBrandId;
      const brandObj = brandsStore[targetKey];
      const bDb = brandObj.db;
      const monthDaily = {};
      Object.keys(bDb.daily || {}).forEach(d => {
        if (d.startsWith(ym)) monthDaily[d] = bDb.daily[d];
      });
      const monthVideos = (bDb.videoList || []).filter(v => (v.reportMonth === ym) || (!v.reportMonth && v.date && v.date.startsWith(ym)));
      const monthSalesVideos = (bDb.salesVideos || []).filter(v => (v.reportMonth === ym) || (!v.reportMonth && v.date && v.date.startsWith(ym)));

      const payload = {
        meta: {
          app: 'Dework Space - Monthly Archive Snapshot',
          snapshotType: 'single_month',
          monthYm: ym,
          monthLabel: formatMonthLabel(ym, false),
          brandId: targetKey,
          brandName: brandObj.meta.name,
          exportedAt: new Date().toISOString()
        },
        monthData: {
          ym: ym,
          locked: Boolean(bDb.lockedMonths && bDb.lockedMonths[ym]),
          daily: monthDaily,
          videoList: monthVideos,
          salesVideos: monthSalesVideos
        }
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanBrand = String(brandObj.meta.name || 'Brand').replace(/[^a-zA-Z0-9_-]/g, '');
      a.download = `Dework_Arsip_${cleanBrand}_${ym}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Snapshot Arsip Bulan ${formatMonthLabel(ym)} (${brandObj.meta.name}) berhasil di-download!`, 'success');
    }

    function mergeMonthDataIntoBrandDb(targetDb, monthData) {
      if (!targetDb || !monthData) return 0;
      let daysMerged = 0;
      if (!targetDb.daily) targetDb.daily = {};
      if (!targetDb.lockedMonths) targetDb.lockedMonths = {};

      Object.entries(monthData.daily || {}).forEach(([d, val]) => {
        const ym = d.slice(0, 7);
        if (targetDb.lockedMonths[ym]) return; // Respect existing lock
        targetDb.daily[d] = val;
        daysMerged++;
      });

      const savedMode = uploadMergeMode;
      uploadMergeMode = 'merge';
      if (Array.isArray(monthData.videoList) && monthData.videoList.length > 0) {
        targetDb.videoList = mergeVideosList(targetDb.videoList || [], monthData.videoList);
      }
      if (Array.isArray(monthData.salesVideos) && monthData.salesVideos.length > 0) {
        targetDb.salesVideos = mergeSalesVideosList(targetDb.salesVideos || [], monthData.salesVideos);
        targetDb.globalTimeStats = rebuildGlobalTimeStats(targetDb.salesVideos);
      }
      uploadMergeMode = savedMode;

      if (monthData.ym && monthData.locked) {
        targetDb.lockedMonths[monthData.ym] = true;
      }
      return daysMerged;
    }

    function importVaultSmartMergeJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed.meta && parsed.meta.snapshotType === 'single_month' && parsed.monthData) {
            const targetKey = ensureSingleBrandForWrite(`menggabungkan arsip bulan ${parsed.meta.monthLabel || parsed.monthData.ym}`);
            const daysMerged = mergeMonthDataIntoBrandDb(brandsStore[targetKey].db, parsed.monthData);
            syncActiveBrandPointers();
            await saveToStorage();
            renderAllTabs();
            renderMonthlyVaultModal();
            showToast(`Arsip Bulan ${parsed.meta.monthLabel || parsed.monthData.ym} (${daysMerged} Hari) berhasil digabungkan ke ${brandsStore[targetKey].meta.name}!`, 'success');
          } else if (parsed.brandsStore && parsed.brandsStore.brand_1 && parsed.brandsStore.brand_2) {
            ['brand_1', 'brand_2'].forEach(bk => {
              const srcDb = parsed.brandsStore[bk].db || {};
              mergeMonthDataIntoBrandDb(brandsStore[bk].db, {
                daily: srcDb.daily || {},
                videoList: srcDb.videoList || [],
                salesVideos: srcDb.salesVideos || []
              });
              Object.assign(brandsStore[bk].db.lockedMonths, srcDb.lockedMonths || {});
            });
            syncActiveBrandPointers();
            await saveToStorage();
            renderAllTabs();
            renderMonthlyVaultModal();
            showToast('Seluruh bulan dari file Multi-Brand Backup berhasil digabungkan (Smart Merge)!', 'success');
          } else {
            const targetKey = ensureSingleBrandForWrite('menggabungkan file JSON');
            const src = parsed.data || parsed;
            mergeMonthDataIntoBrandDb(brandsStore[targetKey].db, {
              daily: src.daily || {},
              videoList: src.videoList || [],
              salesVideos: src.salesVideos || []
            });
            syncActiveBrandPointers();
            await saveToStorage();
            renderAllTabs();
            renderMonthlyVaultModal();
            showToast('File arsip berhasil digabungkan ke database!', 'success');
          }
        } catch (err) {
          showToast('Gagal membaca file arsip JSON: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    // --- SMART DROPDOWNS & NAVIGATION ---
    function updateDateDropdowns() {
      const dates = Object.keys(db.daily).sort().reverse();
      const months = getAvailableMonths(); // ascending
      const monthsDesc = [...months].reverse();

      const selOverviewMonth = document.getElementById('overview-month-filter');
      const selA = document.getElementById('analytics-date-filter');
      const selVC = document.getElementById('vc-date-filter');
      const selSalesMonth = document.getElementById('sales-month-filter');
      const selCmpA = document.getElementById('compare-month-a');
      const selCmpB = document.getElementById('compare-month-b');

      const prevOverviewMonth = selOverviewMonth ? selOverviewMonth.value : 'all';
      const valA = selA ? selA.value : '';
      const valVC = selVC ? selVC.value : '';
      const prevSalesMonth = selSalesMonth ? selSalesMonth.value : 'all';
      const prevCmpA = selCmpA ? selCmpA.value : '';
      const prevCmpB = selCmpB ? selCmpB.value : '';

      // 1. Overview Month Filter
      if (selOverviewMonth) {
        selOverviewMonth.innerHTML = `<option value="all">Semua Bulan (${months.length > 0 ? months.length + ' Bln' : 'Total'})</option>`;
        monthsDesc.forEach(m => {
          selOverviewMonth.innerHTML += `<option value="month:${m.ym}">${m.label} (${m.activeDays} Hari)</option>`;
        });
        const validOverviewVals = ['all', ...months.map(m => `month:${m.ym}`)];
        selOverviewMonth.value = validOverviewVals.includes(prevOverviewMonth) ? prevOverviewMonth : 'all';
      }

      // 1B. Produk & Sales Month Filter (#sales-month-filter)
      if (selSalesMonth) {
        selSalesMonth.innerHTML = `<option value="all">Semua Bulan (${(db.salesVideos || []).length} Video)</option>`;
        monthsDesc.forEach(m => {
          const countInMonth = (db.salesVideos || []).filter(v => (v.reportMonth === m.ym) || (!v.reportMonth && v.date && v.date.startsWith(m.ym))).length;
          selSalesMonth.innerHTML += `<option value="month:${m.ym}">📅 ${m.label} (${countInMonth} Video)</option>`;
        });
        const validSalesMonthVals = ['all', ...months.map(m => `month:${m.ym}`)];
        selSalesMonth.value = validSalesMonthVals.includes(prevSalesMonth) ? prevSalesMonth : 'all';
      }

      // 2. Analytics & VC Summary Date/Month Filters
      if (selA) selA.innerHTML = '';
      if (selVC) selVC.innerHTML = '';

      if (dates.length === 0) {
        const noData = '<option value="">Belum Ada Data Tanggal</option>';
        if (selA) selA.innerHTML = noData;
        if (selVC) selVC.innerHTML = noData;
        const startA = document.getElementById('start-date-a');
        const endA = document.getElementById('end-date-a');
        const startB = document.getElementById('start-date-b');
        const endB = document.getElementById('end-date-b');
        if (startA) startA.value = '';
        if (endA) endA.value = '';
        if (startB) startB.value = '';
        if (endB) endB.value = '';
      } else {
        const allOpt = '<option value="all">Semua Tanggal (Aggregated)</option>';
        let monthGroupHtml = '';
        if (monthsDesc.length > 0) {
          monthGroupHtml = `<optgroup label="Filter Per Bulan (MoM)">` +
            monthsDesc.map(m => `<option value="month:${m.ym}">📅 Bulan: ${m.label} (${m.activeDays} Hari)</option>`).join('') +
            `</optgroup>`;
        }
        const dateGroupHtml = `<optgroup label="Tanggal Harian Spesifik">` +
          dates.map(d => `<option value="${d}">${d}</option>`).join('') +
          `</optgroup>`;

        if (selA) {
          selA.innerHTML = allOpt + monthGroupHtml + dateGroupHtml;
        }
        if (selVC) {
          selVC.innerHTML = allOpt +
            '<option value="31d">⚡ 31 Hari Terakhir</option>' +
            '<option value="30d">⚡ 30 Hari Terakhir</option>' +
            '<option value="14d">⚡ 14 Hari Terakhir</option>' +
            '<option value="7d">⚡ 7 Hari Terakhir</option>' +
            monthGroupHtml +
            dateGroupHtml;
        }

        const validMonthOpts = months.map(m => `month:${m.ym}`);
        if (selA) selA.value = (valA && (dates.includes(valA) || validMonthOpts.includes(valA) || valA === 'all')) ? valA : 'all';
        if (selVC) selVC.value = (valVC && (dates.includes(valVC) || validMonthOpts.includes(valVC) || ['all', '31d', '30d', '14d', '7d'].includes(valVC))) ? valVC : 'all';
      }

      // 3. MoM Month Comparison Dropdowns (#compare-month-b = Bulan Awal/Lalu, #compare-month-a = Bulan Target/Ini)
      if (selCmpA && selCmpB) {
        if (months.length === 0) {
          selCmpA.innerHTML = '<option value="">Belum Ada Data Bulan</option>';
          selCmpB.innerHTML = '<option value="">Belum Ada Data Bulan</option>';
        } else {
          const optsHtml = monthsDesc.map(m => `<option value="${m.ym}">${m.label} (${m.activeDays} Hari Aktif)</option>`).join('');
          selCmpA.innerHTML = optsHtml;
          selCmpB.innerHTML = optsHtml;

          const ymList = months.map(m => m.ym);
          const defaultA = ymList[ymList.length - 1]; // Latest month (e.g., 2026-10 Oktober)
          const defaultB = ymList.length >= 2 ? ymList[ymList.length - 2] : ymList[0]; // Previous month (e.g., 2026-09 September)

          selCmpA.value = (prevCmpA && ymList.includes(prevCmpA)) ? prevCmpA : defaultA;
          selCmpB.value = (prevCmpB && ymList.includes(prevCmpB) && (ymList.length === 1 || prevCmpB !== selCmpA.value)) ? prevCmpB : defaultB;
        }
      }

      // 4. Sync Custom Date Inputs
      if (dates.length > 0) {
        const startA = document.getElementById('start-date-a');
        const endA = document.getElementById('end-date-a');
        const startB = document.getElementById('start-date-b');
        const endB = document.getElementById('end-date-b');

        if (compareMode === 'month' && months.length >= 1) {
          const mA = months.find(m => m.ym === (selCmpA ? selCmpA.value : '')) || months[months.length - 1];
          const mB = months.find(m => m.ym === (selCmpB ? selCmpB.value : '')) || (months.length >= 2 ? months[months.length - 2] : months[0]);
          if (mA && startA && endA) {
            startA.value = mA.firstActiveDate;
            endA.value = mA.lastActiveDate;
          }
          if (mB && startB && endB) {
            startB.value = mB.firstActiveDate;
            endB.value = mB.lastActiveDate;
          }
        } else {
          if (startA && !startA.value) startA.value = dates[Math.min(6, dates.length - 1)];
          if (endA && !endA.value) endA.value = dates[0];
          if (startB && !startB.value) startB.value = dates[dates.length - 1];
          if (endB && !endB.value) endB.value = dates[Math.min(7, dates.length - 1)];
        }
      }

      renderStoredMonthsBar();
    }

    function renderAllTabs() {
      updateBrandUIHeaders();
      renderHoldingComparison();
      updateDateDropdowns();
      renderOverviewTab();
      renderVCSummaryTab();
      renderAnalytics();
      renderSales();
      renderComparisonTable();
      if (typeof currentWorkspaceView !== 'undefined') {
        if (currentWorkspaceView === 'kanban') renderTodos();
        else if (currentWorkspaceView === 'calendar') renderCalendarView();
        else if (currentWorkspaceView === 'scorecard') renderTeamScorecard();
      } else {
        renderTodos();
      }
    }

    function toggleTrendMetric(metric) {
      currentTrendMetric = metric;
      ['views', 'reach', 'gmv'].forEach(m => {
        const b = document.getElementById(`btn-trend-${m}`);
        if (b) {
          if (m === metric) b.className = "px-3 py-1 font-semibold rounded-md bg-blue-600 text-white shadow-sm";
          else b.className = "px-3 py-1 font-semibold rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400";
        }
      });
      renderOverviewTab();
    }

    // --- HELPER: COUNT QUANTITY VIDEO WITH HASHTAG (#) & TOTAL VIDEOS BY UPLOAD DATE ---
    function getHashtagVideosCount(dateFilter = 'all') {
      const sourceList = (db.videoList && db.videoList.length > 0) ? db.videoList : (db.salesVideos || []);
      return sourceList.filter(v => {
        const hasHash = String(v.title || '').includes('#');
        if (!hasHash) return false;
        if (!dateFilter || dateFilter === 'all') return true;
        if (dateFilter.startsWith('month:')) {
          const ym = dateFilter.replace('month:', '');
          if (v.date) return v.date.startsWith(ym);
          return v.reportMonth && v.reportMonth === ym;
        }
        if (/^\d{4}-\d{2}$/.test(dateFilter)) {
          if (v.date) return v.date.startsWith(dateFilter);
          return v.reportMonth && v.reportMonth === dateFilter;
        }
        return v.date === dateFilter;
      }).length;
    }

    function getTotalUploadedVideosCount(dateFilter = 'all') {
      const sourceList = (db.videoList && db.videoList.length > 0) ? db.videoList : (db.salesVideos || []);
      return sourceList.filter(v => {
        if (!dateFilter || dateFilter === 'all') return true;
        if (dateFilter.startsWith('month:')) {
          const ym = dateFilter.replace('month:', '');
          if (v.date) return v.date.startsWith(ym);
          return v.reportMonth && v.reportMonth === ym;
        }
        if (/^\d{4}-\d{2}$/.test(dateFilter)) {
          if (v.date) return v.date.startsWith(dateFilter);
          return v.reportMonth && v.reportMonth === dateFilter;
        }
        return v.date === dateFilter;
      }).length;
    }

    // --- DEFAULT RAPATECH DATASET (FULL 30 DAYS SEPTEMBER & FULL 31 DAYS OCTOBER 2026 MULTI-MONTH READY) ---
    function getDefaultRAPADailyRows(includeSeptemberBaseline = true) {
      // Baseline September 2026 (Full 30 Calendar Days: Sep 01 - Sep 30, 2026 — Total Views: 10,355,057, Calibrated to +2.70% MoM vs Oct 31 Days: 10,634,644)
      const septemberRows = includeSeptemberBaseline ? [
        { date: '2026-09-01', views: 279335, reach: 194200, profile: 980, likes: 1320, shares: 165, comments: 28, netGrowth: 21, newFollowers: 65, lostFollowers: 44, engaged: 2490, gmvTotal: 15800000, gmvDirect: 11200000, gmvIndirect: 4600000, vv: 152000, gpm: 103947, order: 68, orderDirect: 48, orderIndirect: 20, buyers: 65, impresi: 164000, klik: 8200 },
        { date: '2026-09-02', views: 296035, reach: 205800, profile: 1040, likes: 1410, shares: 178, comments: 31, netGrowth: 25, newFollowers: 71, lostFollowers: 46, engaged: 2640, gmvTotal: 16950000, gmvDirect: 12150000, gmvIndirect: 4800000, vv: 161500, gpm: 104953, order: 72, orderDirect: 51, orderIndirect: 21, buyers: 69, impresi: 172000, klik: 8772 },
        { date: '2026-09-03', views: 339725, reach: 238900, profile: 1180, likes: 1690, shares: 212, comments: 36, netGrowth: 34, newFollowers: 84, lostFollowers: 50, engaged: 3120, gmvTotal: 19400000, gmvDirect: 14100000, gmvIndirect: 5300000, vv: 184000, gpm: 105434, order: 82, orderDirect: 60, orderIndirect: 22, buyers: 78, impresi: 196000, klik: 10192 },
        { date: '2026-09-04', views: 309155, reach: 214600, profile: 1090, likes: 1510, shares: 188, comments: 32, netGrowth: 27, newFollowers: 75, lostFollowers: 48, engaged: 2810, gmvTotal: 17650000, gmvDirect: 12700000, gmvIndirect: 4950000, vv: 169000, gpm: 104437, order: 75, orderDirect: 54, orderIndirect: 21, buyers: 71, impresi: 181000, klik: 9231 },
        { date: '2026-09-05', views: 324375, reach: 227400, profile: 1150, likes: 1580, shares: 196, comments: 35, netGrowth: 31, newFollowers: 79, lostFollowers: 48, engaged: 2950, gmvTotal: 18900000, gmvDirect: 13600000, gmvIndirect: 5300000, vv: 177500, gpm: 106478, order: 80, orderDirect: 58, orderIndirect: 22, buyers: 76, impresi: 188500, klik: 9613 },
        { date: '2026-09-06', views: 352585, reach: 248200, profile: 1230, likes: 1760, shares: 225, comments: 39, netGrowth: 38, newFollowers: 88, lostFollowers: 50, engaged: 3280, gmvTotal: 20850000, gmvDirect: 15100000, gmvIndirect: 5750000, vv: 192000, gpm: 108593, order: 88, orderDirect: 64, orderIndirect: 24, buyers: 84, impresi: 205000, klik: 10660 },
        { date: '2026-09-07', views: 298885, reach: 209100, profile: 1060, likes: 1450, shares: 182, comments: 29, netGrowth: 23, newFollowers: 69, lostFollowers: 46, engaged: 2690, gmvTotal: 16400000, gmvDirect: 11800000, gmvIndirect: 4600000, vv: 158000, gpm: 103797, order: 70, orderDirect: 50, orderIndirect: 20, buyers: 67, impresi: 169500, klik: 8475 },
        { date: '2026-09-08', views: 379565, reach: 268500, profile: 1320, likes: 1980, shares: 254, comments: 44, netGrowth: 46, newFollowers: 98, lostFollowers: 52, engaged: 3650, gmvTotal: 23500000, gmvDirect: 17200000, gmvIndirect: 6300000, vv: 218000, gpm: 107798, order: 98, orderDirect: 72, orderIndirect: 26, buyers: 94, impresi: 231000, klik: 12474 },
        { date: '2026-09-09', views: 523605, reach: 376400, profile: 1680, likes: 3150, shares: 430, comments: 58, netGrowth: 94, newFollowers: 152, lostFollowers: 58, engaged: 5340, gmvTotal: 36400000, gmvDirect: 27800000, gmvIndirect: 8600000, vv: 318000, gpm: 114465, order: 146, orderDirect: 112, orderIndirect: 34, buyers: 140, impresi: 342000, klik: 20178 },
        { date: '2026-09-10', views: 364345, reach: 257300, profile: 1290, likes: 1840, shares: 238, comments: 41, netGrowth: 42, newFollowers: 94, lostFollowers: 52, engaged: 3420, gmvTotal: 22100000, gmvDirect: 16300000, gmvIndirect: 5800000, vv: 204000, gpm: 108333, order: 93, orderDirect: 69, orderIndirect: 24, buyers: 89, impresi: 218000, klik: 11336 },
        { date: '2026-09-11', views: 318185, reach: 222400, profile: 1130, likes: 1560, shares: 194, comments: 33, netGrowth: 29, newFollowers: 77, lostFollowers: 48, engaged: 2890, gmvTotal: 18200000, gmvDirect: 13200000, gmvIndirect: 5000000, vv: 171000, gpm: 106432, order: 77, orderDirect: 56, orderIndirect: 21, buyers: 73, impresi: 183000, klik: 9333 },
        { date: '2026-09-12', views: 333655, reach: 234800, profile: 1170, likes: 1640, shares: 208, comments: 36, netGrowth: 32, newFollowers: 82, lostFollowers: 50, engaged: 3060, gmvTotal: 19600000, gmvDirect: 14300000, gmvIndirect: 5300000, vv: 182000, gpm: 107692, order: 83, orderDirect: 60, orderIndirect: 23, buyers: 79, impresi: 194000, klik: 9894 },
        { date: '2026-09-13', views: 345535, reach: 243100, profile: 1210, likes: 1720, shares: 218, comments: 37, netGrowth: 35, newFollowers: 86, lostFollowers: 51, engaged: 3190, gmvTotal: 20100000, gmvDirect: 14700000, gmvIndirect: 5400000, vv: 189000, gpm: 106349, order: 85, orderDirect: 62, orderIndirect: 23, buyers: 81, impresi: 201000, klik: 10452 },
        { date: '2026-09-14', views: 304335, reach: 212800, profile: 1070, likes: 1490, shares: 186, comments: 30, netGrowth: 26, newFollowers: 73, lostFollowers: 47, engaged: 2740, gmvTotal: 17100000, gmvDirect: 12300000, gmvIndirect: 4800000, vv: 164000, gpm: 104268, order: 73, orderDirect: 52, orderIndirect: 21, buyers: 69, impresi: 175000, klik: 8925 },
        { date: '2026-09-15', views: 349865, reach: 246900, profile: 1220, likes: 1750, shares: 222, comments: 38, netGrowth: 37, newFollowers: 87, lostFollowers: 50, engaged: 3240, gmvTotal: 21200000, gmvDirect: 15500000, gmvIndirect: 5700000, vv: 195000, gpm: 108717, order: 89, orderDirect: 65, orderIndirect: 24, buyers: 85, impresi: 208000, klik: 10816 },
        { date: '2026-09-16', views: 321905, reach: 225600, profile: 1140, likes: 1590, shares: 198, comments: 34, netGrowth: 30, newFollowers: 78, lostFollowers: 48, engaged: 2920, gmvTotal: 18500000, gmvDirect: 13400000, gmvIndirect: 5100000, vv: 174000, gpm: 106321, order: 78, orderDirect: 56, orderIndirect: 22, buyers: 74, impresi: 186000, klik: 9486 },
        { date: '2026-09-17', views: 312375, reach: 218400, profile: 1120, likes: 1480, shares: 190, comments: 34, netGrowth: 24, newFollowers: 72, lostFollowers: 48, engaged: 2750, gmvTotal: 17450000, gmvDirect: 12100000, gmvIndirect: 5350000, vv: 168000, gpm: 103869, order: 74, orderDirect: 50, orderIndirect: 24, buyers: 70, impresi: 178500, klik: 8925 },
        { date: '2026-09-18', views: 333165, reach: 234100, profile: 1190, likes: 1620, shares: 215, comments: 38, netGrowth: 28, newFollowers: 81, lostFollowers: 53, engaged: 3010, gmvTotal: 19240000, gmvDirect: 14200000, gmvIndirect: 5040000, vv: 179400, gpm: 107246, order: 81, orderDirect: 60, orderIndirect: 21, buyers: 78, impresi: 189200, klik: 9649 },
        { date: '2026-09-19', views: 489695, reach: 352000, profile: 1490, likes: 2890, shares: 410, comments: 49, netGrowth: 88, newFollowers: 142, lostFollowers: 54, engaged: 4920, gmvTotal: 16800000, gmvDirect: 12400000, gmvIndirect: 4400000, vv: 295000, gpm: 56949, order: 66, orderDirect: 49, orderIndirect: 17, buyers: 64, impresi: 312000, klik: 18096 },
        { date: '2026-09-20', views: 370405, reach: 264500, profile: 1280, likes: 2040, shares: 265, comments: 52, netGrowth: 48, newFollowers: 112, lostFollowers: 64, engaged: 3820, gmvTotal: 20450000, gmvDirect: 15800000, gmvIndirect: 4650000, vv: 248000, gpm: 82459, order: 84, orderDirect: 64, orderIndirect: 20, buyers: 80, impresi: 256000, klik: 14848 },
        { date: '2026-09-21', views: 320295, reach: 221000, profile: 1080, likes: 1540, shares: 185, comments: 29, netGrowth: 22, newFollowers: 78, lostFollowers: 56, engaged: 2790, gmvTotal: 18120000, gmvDirect: 13100000, gmvIndirect: 5020000, vv: 204000, gpm: 88823, order: 72, orderDirect: 52, orderIndirect: 20, buyers: 69, impresi: 192000, klik: 9984 },
        { date: '2026-09-22', views: 327345, reach: 219800, profile: 1140, likes: 1680, shares: 210, comments: 31, netGrowth: 33, newFollowers: 85, lostFollowers: 52, engaged: 3040, gmvTotal: 15200000, gmvDirect: 11200000, gmvIndirect: 4000000, vv: 174000, gpm: 87356, order: 62, orderDirect: 45, orderIndirect: 17, buyers: 59, impresi: 176500, klik: 9178 },
        { date: '2026-09-23', views: 358525, reach: 256000, profile: 1240, likes: 2110, shares: 280, comments: 35, netGrowth: 49, newFollowers: 96, lostFollowers: 47, engaged: 3690, gmvTotal: 21400000, gmvDirect: 16200000, gmvIndirect: 5200000, vv: 194000, gpm: 110309, order: 85, orderDirect: 65, orderIndirect: 20, buyers: 82, impresi: 214000, klik: 12626 },
        { date: '2026-09-24', views: 435995, reach: 315000, profile: 1310, likes: 2450, shares: 295, comments: 51, netGrowth: 56, newFollowers: 104, lostFollowers: 48, engaged: 4410, gmvTotal: 28900000, gmvDirect: 21800000, gmvIndirect: 7100000, vv: 352000, gpm: 82102, order: 114, orderDirect: 86, orderIndirect: 28, buyers: 109, impresi: 388000, klik: 22892 },
        { date: '2026-09-25', views: 335765, reach: 232000, profile: 1270, likes: 1420, shares: 195, comments: 36, netGrowth: 47, newFollowers: 92, lostFollowers: 45, engaged: 2680, gmvTotal: 27400000, gmvDirect: 22900000, gmvIndirect: 4500000, vv: 176000, gpm: 155681, order: 116, orderDirect: 95, orderIndirect: 21, buyers: 112, impresi: 198000, klik: 8712 },
        { date: '2026-09-26', views: 364835, reach: 251000, profile: 1350, likes: 1390, shares: 215, comments: 24, netGrowth: 45, newFollowers: 91, lostFollowers: 46, engaged: 2640, gmvTotal: 31800000, gmvDirect: 24900000, gmvIndirect: 6900000, vv: 202000, gpm: 157425, order: 128, orderDirect: 100, orderIndirect: 28, buyers: 123, impresi: 212000, klik: 9328 },
        { date: '2026-09-27', views: 275125, reach: 191000, profile: 1020, likes: 1190, shares: 160, comments: 26, netGrowth: 29, newFollowers: 74, lostFollowers: 45, engaged: 2410, gmvTotal: 22100000, gmvDirect: 16100000, gmvIndirect: 6000000, vv: 129000, gpm: 171317, order: 92, orderDirect: 68, orderIndirect: 24, buyers: 88, impresi: 158000, klik: 7426 },
        { date: '2026-09-28', views: 296035, reach: 206500, profile: 1110, likes: 1320, shares: 175, comments: 31, netGrowth: 34, newFollowers: 79, lostFollowers: 45, engaged: 2540, gmvTotal: 23600000, gmvDirect: 16400000, gmvIndirect: 7200000, vv: 139000, gpm: 169784, order: 96, orderDirect: 67, orderIndirect: 29, buyers: 92, impresi: 161000, klik: 7567 },
        { date: '2026-09-29', views: 339475, reach: 241000, profile: 1210, likes: 1590, shares: 210, comments: 36, netGrowth: 39, newFollowers: 89, lostFollowers: 50, engaged: 2980, gmvTotal: 25800000, gmvDirect: 20600000, gmvIndirect: 5200000, vv: 178000, gpm: 144943, order: 106, orderDirect: 84, orderIndirect: 22, buyers: 102, impresi: 191000, klik: 8404 },
        { date: '2026-09-30', views: 354932, reach: 254000, profile: 1150, likes: 1810, shares: 220, comments: 39, netGrowth: 25, newFollowers: 84, lostFollowers: 59, engaged: 3110, gmvTotal: 18400000, gmvDirect: 12500000, gmvIndirect: 5900000, vv: 212000, gpm: 86792, order: 74, orderDirect: 50, orderIndirect: 24, buyers: 71, impresi: 234000, klik: 10296 }
      ] : [];

      // 1. Overview, Audience & Daily Video & Carousel Summary Data (Full 31 Calendar Days: Oct 01 - Oct 31, 2026 — Total Views: 10,634,644)
      const octoberRows = [
        { date: '2026-10-01', views: 303837, reach: 280567, profile: 1387, likes: 1841, shares: 245, comments: 46, netGrowth: 30, newFollowers: 86, lostFollowers: 56, engaged: 3405, gmvTotal: 21772602, gmvDirect: 14205005, gmvIndirect: 7567597, vv: 206320, gpm: 105528, order: 91, orderDirect: 60, orderIndirect: 31, buyers: 87, impresi: 207460, klik: 9584 },
        { date: '2026-10-02', views: 291377, reach: 269109, profile: 1270, likes: 2109, shares: 323, comments: 42, netGrowth: 27, newFollowers: 93, lostFollowers: 66, engaged: 3790, gmvTotal: 23788317, gmvDirect: 20106415, gmvIndirect: 3681902, vv: 211186, gpm: 112642, order: 97, orderDirect: 77, orderIndirect: 20, buyers: 95, impresi: 215347, klik: 12137 },
        { date: '2026-10-03', views: 541002, reach: 500615, profile: 1870, likes: 4068, shares: 577, comments: 60, netGrowth: 135, newFollowers: 199, lostFollowers: 64, engaged: 6879, gmvTotal: 19966483, gmvDirect: 15024332, gmvIndirect: 4942151, vv: 398645, gpm: 50086, order: 75, orderDirect: 57, orderIndirect: 18, buyers: 74, impresi: 390752, klik: 26072 },
        { date: '2026-10-04', views: 348605, reach: 328466, profile: 1506, likes: 2589, shares: 339, comments: 71, netGrowth: 64, newFollowers: 145, lostFollowers: 81, engaged: 4711, gmvTotal: 25204249, gmvDirect: 20221517, gmvIndirect: 4982732, vv: 317958, gpm: 79269, order: 100, orderDirect: 78, orderIndirect: 22, buyers: 94, impresi: 310989, klik: 20489 },
        { date: '2026-10-05', views: 293821, reach: 258942, profile: 1250, likes: 1890, shares: 231, comments: 37, netGrowth: 27, newFollowers: 97, lostFollowers: 70, engaged: 3302, gmvTotal: 22122268, gmvDirect: 15573334, gmvIndirect: 6548934, vv: 251715, gpm: 87886, order: 85, orderDirect: 59, orderIndirect: 26, buyers: 81, impresi: 220947, klik: 12851 },
        { date: '2026-10-06', views: 304814, reach: 257457, profile: 1363, likes: 2041, shares: 273, comments: 39, netGrowth: 42, newFollowers: 105, lostFollowers: 63, engaged: 3700, gmvTotal: 17751928, gmvDirect: 13242862, gmvIndirect: 4509066, vv: 203105, gpm: 87403, order: 72, orderDirect: 53, orderIndirect: 19, buyers: 67, impresi: 204525, klik: 12008 },
        { date: '2026-10-07', views: 342066, reach: 317697, profile: 1480, likes: 2626, shares: 350, comments: 42, netGrowth: 63, newFollowers: 119, lostFollowers: 56, engaged: 4454, gmvTotal: 26548316, gmvDirect: 20411787, gmvIndirect: 6136529, vv: 231395, gpm: 114732, order: 100, orderDirect: 80, orderIndirect: 20, buyers: 98, impresi: 254063, klik: 17590 },
        { date: '2026-10-08', views: 445788, reach: 412170, profile: 1526, likes: 3122, shares: 365, comments: 65, netGrowth: 71, newFollowers: 128, lostFollowers: 57, engaged: 5634, gmvTotal: 37609169, gmvDirect: 28880525, gmvIndirect: 8728644, vv: 463111, gpm: 81210, order: 145, orderDirect: 110, orderIndirect: 35, buyers: 138, impresi: 502793, klik: 34138 },
        { date: '2026-10-09', views: 300492, reach: 267956, profile: 1507, likes: 1666, shares: 238, comments: 44, netGrowth: 60, newFollowers: 114, lostFollowers: 54, engaged: 3160, gmvTotal: 35228914, gmvDirect: 30169690, gmvIndirect: 5059224, vv: 203831, gpm: 172834, order: 148, orderDirect: 123, orderIndirect: 25, buyers: 143, impresi: 234791, klik: 10330 },
        { date: '2026-10-10', views: 351022, reach: 309004, profile: 1642, likes: 1652, shares: 269, comments: 27, netGrowth: 58, newFollowers: 114, lostFollowers: 56, engaged: 3131, gmvTotal: 43475099, gmvDirect: 34128404, gmvIndirect: 9346695, vv: 249874, gpm: 173988, order: 172, orderDirect: 136, orderIndirect: 36, buyers: 167, impresi: 253130, klik: 11053 },
        { date: '2026-10-11', views: 245120, reach: 221400, profile: 1180, likes: 1420, shares: 195, comments: 31, netGrowth: 35, newFollowers: 88, lostFollowers: 53, engaged: 2840, gmvTotal: 27810618, gmvDirect: 20234056, gmvIndirect: 7576562, vv: 148240, gpm: 187605, order: 115, orderDirect: 85, orderIndirect: 30, buyers: 110, impresi: 184366, klik: 9012 },
        { date: '2026-10-12', views: 268400, reach: 242110, profile: 1290, likes: 1580, shares: 210, comments: 38, netGrowth: 41, newFollowers: 95, lostFollowers: 54, engaged: 2990, gmvTotal: 29993382, gmvDirect: 20522277, gmvIndirect: 9471105, vv: 161871, gpm: 185292, order: 119, orderDirect: 83, orderIndirect: 36, buyers: 115, impresi: 183129, klik: 8722 },
        { date: '2026-10-13', views: 312500, reach: 284900, profile: 1410, likes: 1920, shares: 255, comments: 44, netGrowth: 49, newFollowers: 108, lostFollowers: 59, engaged: 3520, gmvTotal: 32519353, gmvDirect: 26368305, gmvIndirect: 6151048, vv: 211764, gpm: 153564, order: 133, orderDirect: 106, orderIndirect: 27, buyers: 129, impresi: 222487, klik: 9813 },
        { date: '2026-10-14', views: 332300, reach: 307100, profile: 1320, likes: 2210, shares: 268, comments: 47, netGrowth: 30, newFollowers: 101, lostFollowers: 71, engaged: 3680, gmvTotal: 21508166, gmvDirect: 14454671, gmvIndirect: 7053495, vv: 255262, gpm: 84259, order: 89, orderDirect: 57, orderIndirect: 32, buyers: 85, impresi: 282473, klik: 12610 },
        { date: '2026-10-15', views: 318400, reach: 289500, profile: 1390, likes: 2080, shares: 262, comments: 45, netGrowth: 44, newFollowers: 104, lostFollowers: 60, engaged: 3610, gmvTotal: 26450000, gmvDirect: 19800000, gmvIndirect: 6650000, vv: 224000, gpm: 118080, order: 108, orderDirect: 81, orderIndirect: 27, buyers: 103, impresi: 242000, klik: 14036 },
        { date: '2026-10-16', views: 329600, reach: 298200, profile: 1430, likes: 2150, shares: 278, comments: 48, netGrowth: 48, newFollowers: 109, lostFollowers: 61, engaged: 3780, gmvTotal: 27800000, gmvDirect: 20900000, gmvIndirect: 6900000, vv: 236000, gpm: 117796, order: 114, orderDirect: 86, orderIndirect: 28, buyers: 109, impresi: 254000, klik: 14986 },
        { date: '2026-10-17', views: 295400, reach: 266800, profile: 1280, likes: 1890, shares: 240, comments: 39, netGrowth: 36, newFollowers: 94, lostFollowers: 58, engaged: 3340, gmvTotal: 24100000, gmvDirect: 17900000, gmvIndirect: 6200000, vv: 208000, gpm: 115865, order: 99, orderDirect: 74, orderIndirect: 25, buyers: 94, impresi: 225000, klik: 12825 },
        { date: '2026-10-18', views: 310200, reach: 281400, profile: 1340, likes: 1990, shares: 252, comments: 42, netGrowth: 41, newFollowers: 99, lostFollowers: 58, engaged: 3490, gmvTotal: 25600000, gmvDirect: 19100000, gmvIndirect: 6500000, vv: 219000, gpm: 116894, order: 105, orderDirect: 78, orderIndirect: 27, buyers: 100, impresi: 236000, klik: 13688 },
        { date: '2026-10-19', views: 344800, reach: 314200, profile: 1490, likes: 2290, shares: 294, comments: 51, netGrowth: 53, newFollowers: 115, lostFollowers: 62, engaged: 3980, gmvTotal: 29200000, gmvDirect: 21900000, gmvIndirect: 7300000, vv: 248000, gpm: 117741, order: 120, orderDirect: 90, orderIndirect: 30, buyers: 115, impresi: 268000, klik: 15812 },
        { date: '2026-10-20', views: 362500, reach: 331000, profile: 1540, likes: 2410, shares: 312, comments: 54, netGrowth: 58, newFollowers: 121, lostFollowers: 63, engaged: 4190, gmvTotal: 31400000, gmvDirect: 23600000, gmvIndirect: 7800000, vv: 262000, gpm: 119847, order: 128, orderDirect: 96, orderIndirect: 32, buyers: 122, impresi: 284000, klik: 17040 },
        { date: '2026-10-21', views: 308900, reach: 279600, profile: 1330, likes: 1960, shares: 248, comments: 41, netGrowth: 39, newFollowers: 97, lostFollowers: 58, engaged: 3450, gmvTotal: 25100000, gmvDirect: 18700000, gmvIndirect: 6400000, vv: 215000, gpm: 116744, order: 103, orderDirect: 77, orderIndirect: 26, buyers: 98, impresi: 232000, klik: 13456 },
        { date: '2026-10-22', views: 326400, reach: 296800, profile: 1410, likes: 2120, shares: 270, comments: 46, netGrowth: 45, newFollowers: 106, lostFollowers: 61, engaged: 3710, gmvTotal: 27300000, gmvDirect: 20400000, gmvIndirect: 6900000, vv: 231000, gpm: 118181, order: 112, orderDirect: 84, orderIndirect: 28, buyers: 107, impresi: 249000, klik: 14691 },
        { date: '2026-10-23', views: 354200, reach: 322500, profile: 1510, likes: 2340, shares: 302, comments: 52, netGrowth: 55, newFollowers: 118, lostFollowers: 63, engaged: 4080, gmvTotal: 30500000, gmvDirect: 22900000, gmvIndirect: 7600000, vv: 256000, gpm: 119140, order: 125, orderDirect: 94, orderIndirect: 31, buyers: 119, impresi: 276000, klik: 16560 },
        { date: '2026-10-24', views: 389600, reach: 356400, profile: 1620, likes: 2680, shares: 345, comments: 59, netGrowth: 68, newFollowers: 132, lostFollowers: 64, engaged: 4590, gmvTotal: 34800000, gmvDirect: 26200000, gmvIndirect: 8600000, vv: 289000, gpm: 120415, order: 142, orderDirect: 107, orderIndirect: 35, buyers: 136, impresi: 312000, klik: 19344 },
        { date: '2026-10-25', views: 468500, reach: 429800, profile: 1840, likes: 3420, shares: 448, comments: 72, netGrowth: 96, newFollowers: 164, lostFollowers: 68, engaged: 5820, gmvTotal: 44600000, gmvDirect: 34200000, gmvIndirect: 10400000, vv: 358000, gpm: 124581, order: 178, orderDirect: 136, orderIndirect: 42, buyers: 171, impresi: 386000, klik: 24704 },
        { date: '2026-10-26', views: 376200, reach: 342900, profile: 1580, likes: 2540, shares: 328, comments: 56, netGrowth: 62, newFollowers: 126, lostFollowers: 64, engaged: 4380, gmvTotal: 33200000, gmvDirect: 25100000, gmvIndirect: 8100000, vv: 274000, gpm: 121167, order: 136, orderDirect: 103, orderIndirect: 33, buyers: 130, impresi: 298000, klik: 18178 },
        { date: '2026-10-27', views: 319800, reach: 291200, profile: 1380, likes: 2060, shares: 264, comments: 44, netGrowth: 43, newFollowers: 103, lostFollowers: 60, engaged: 3590, gmvTotal: 26900000, gmvDirect: 20100000, gmvIndirect: 6800000, vv: 228000, gpm: 117982, order: 110, orderDirect: 82, orderIndirect: 28, buyers: 105, impresi: 246000, klik: 14514 },
        { date: '2026-10-28', views: 334500, reach: 304600, profile: 1440, likes: 2180, shares: 280, comments: 47, netGrowth: 49, newFollowers: 110, lostFollowers: 61, engaged: 3810, gmvTotal: 28400000, gmvDirect: 21300000, gmvIndirect: 7100000, vv: 239000, gpm: 118828, order: 116, orderDirect: 87, orderIndirect: 29, buyers: 111, impresi: 258000, klik: 15222 },
        { date: '2026-10-29', views: 348900, reach: 318400, profile: 1490, likes: 2280, shares: 296, comments: 50, netGrowth: 52, newFollowers: 114, lostFollowers: 62, engaged: 3960, gmvTotal: 29800000, gmvDirect: 22400000, gmvIndirect: 7400000, vv: 251000, gpm: 118725, order: 122, orderDirect: 92, orderIndirect: 30, buyers: 117, impresi: 271000, klik: 16260 },
        { date: '2026-10-30', views: 371400, reach: 339200, profile: 1560, likes: 2460, shares: 318, comments: 55, netGrowth: 59, newFollowers: 122, lostFollowers: 63, engaged: 4260, gmvTotal: 32100000, gmvDirect: 24200000, gmvIndirect: 7900000, vv: 268000, gpm: 119776, order: 131, orderDirect: 99, orderIndirect: 32, buyers: 125, impresi: 289000, klik: 17629 },
        { date: '2026-10-31', views: 394200, reach: 361500, profile: 1640, likes: 2620, shares: 338, comments: 58, netGrowth: 64, newFollowers: 129, lostFollowers: 65, engaged: 4510, gmvTotal: 35400000, gmvDirect: 26800000, gmvIndirect: 8600000, vv: 292000, gpm: 121232, order: 144, orderDirect: 109, orderIndirect: 35, buyers: 138, impresi: 316000, klik: 19592 }
      ];

      return [...septemberRows, ...octoberRows];
    }

    // --- DEFAULT MONTRA DATASET (IDE B: FULL 30 DAYS SEPTEMBER & FULL 31 DAYS OCTOBER 2026 — CASING CLEAR, LEATHER, ORBIT & TEMPERED GLASS) ---
    function getDefaultMontraDailyRows(includeSeptemberBaseline = true) {
      const baseRows = getDefaultRAPADailyRows(includeSeptemberBaseline);
      return baseRows.map((r, idx) => {
        const isOct = r.date.startsWith('2026-10');
        const factor = isOct ? 0.64 : 0.61;
        const wave = 1 + ((idx % 5) - 2) * 0.025;
        const mult = factor * wave;
        const views = Math.round(r.views * mult);
        const reach = Math.round(r.reach * mult);
        const likes = Math.round(r.likes * mult * 1.08);
        const shares = Math.round(r.shares * mult * 1.05);
        const comments = Math.max(8, Math.round(r.comments * mult));
        const newFollowers = Math.max(20, Math.round(r.newFollowers * mult));
        const lostFollowers = Math.max(10, Math.round(r.lostFollowers * mult * 0.85));
        const netGrowth = newFollowers - lostFollowers;
        const gmvTotal = Math.round((r.gmvTotal * mult) / 1000) * 1000;
        const gmvDirect = Math.round((gmvTotal * 0.76) / 1000) * 1000;
        const gmvIndirect = gmvTotal - gmvDirect;
        const vv = Math.round(r.vv * mult);
        const impresi = Math.round(r.impresi * mult * 1.04);
        const klik = Math.round(r.klik * mult * 1.09);
        const order = Math.max(18, Math.round(r.order * mult * 1.12));
        const orderDirect = Math.round(order * 0.76);
        const orderIndirect = order - orderDirect;
        const buyers = Math.max(16, Math.round(order * 0.95));
        const gpm = vv > 0 ? Math.round((gmvTotal / vv) * 1000) : 115000;
        return {
          date: r.date,
          views,
          reach,
          profile: Math.round(r.profile * mult),
          likes,
          shares,
          comments,
          netGrowth,
          newFollowers,
          lostFollowers,
          engaged: Math.round(r.engaged * mult * 1.06),
          gmvTotal,
          gmvDirect,
          gmvIndirect,
          vv,
          gpm,
          order,
          orderDirect,
          orderIndirect,
          buyers,
          impresi,
          klik
        };
      });
    }

    function applyDailyRowToDb(targetDb, r) {
      const er = r.views > 0 ? (((r.likes + r.comments + r.shares) / r.views) * 100).toFixed(2) : '0';
      targetDb.daily[r.date] = {
        overview: {
          views: r.views,
          reach: r.reach,
          profile: r.profile,
          likes: r.likes,
          shares: r.shares,
          comments: r.comments,
          netGrowth: r.netGrowth,
          followers: r.newFollowers,
          lostFollowers: r.lostFollowers,
          er: er
        },
        audience: {
          reach: r.reach,
          engaged: r.engaged,
          newFollowers: r.newFollowers,
          lostFollowers: r.lostFollowers,
          er: r.reach > 0 ? ((r.engaged / r.reach) * 100).toFixed(2) : '0'
        },
        video: {
          top5: [],
          hashtagVideoCount: 0
        },
        sales: {
          tVV: r.vv, tProdView: r.impresi, tClick: r.klik, tOrder: r.order,
          tOrderDirect: r.orderDirect, tOrderIndirect: r.orderIndirect, tBuyers: r.buyers,
          tGmvTotal: r.gmvTotal, tGmvDirect: r.gmvDirect, tGmvIndirect: r.gmvIndirect,
          countRows: 1, sumGpm: r.gpm, sumRet: 3.2, videos: [], tags: {}
        }
      };
    }

    function scrubSampleContaminationFromDb(targetDb, uploadLabels = null, brandKey = null) {
      if (!targetDb || !targetDb.daily) return false;
      const resolvedBrandKey = brandKey || (targetDb === (brandsStore.brand_2 && brandsStore.brand_2.db) ? 'brand_2' : 'brand_1');
      const isMontraSample = resolvedBrandKey === 'brand_2' && (targetDb.salesVideos || []).some(v => String(v.title || '').toLowerCase().includes('montra') || String(v.tags || '').toLowerCase().includes('montra'));
      const sampleRows = isMontraSample ? getDefaultMontraDailyRows(true) : getDefaultRAPADailyRows(true);

      const allDates = Object.keys(targetDb.daily);
      if (allDates.length === 0) return false;

      let modified = false;

      // Dynamically respect exact calendar days per month (e.g. 2026-09 = 30 days, 2026-10 = 31 days, 2026-11 = 30 days, 2026-12 = 31 days)
      const activeMonths = new Set();
      Object.keys(targetDb.daily).forEach(d => {
        if (d && d.length >= 7) activeMonths.add(d.slice(0, 7));
      });

      const legacySepViewsSet = new Set([
        215400, 228900, 264200, 239500, 251800, 274600, 231200, 296400, 412800, 284100,
        246800, 259300, 268900, 235600, 272400, 249800, 242100, 258900, 385400, 289000,
        248500, 254200, 279400, 342000, 261000, 284500, 212000, 228900, 264000, 276500,
        266540, 283240, 326930, 296360, 311580, 339790, 286090, 366770, 510810, 351550,
        305390, 320860, 332740, 291540, 337070, 309110, 299580, 320370, 476900, 357610,
        307500, 314550, 345730, 423200, 322970, 352040, 262330, 283240, 326680, 342150
      ]);

      // Non-destructively heal any partial 14/16/30-day months so September has full 30 days (01..30) and October has full 31 days (01..31)
      ['2026-09', '2026-10'].forEach(ym => {
        if (!activeMonths.has(ym)) return;
        sampleRows.filter(r => r.date.startsWith(ym)).forEach(r => {
          if (!targetDb.daily[r.date]) {
            applyDailyRowToDb(targetDb, r);
            modified = true;
            return;
          }
          const day = targetDb.daily[r.date];
          const er = r.views > 0 ? (((r.likes + r.comments + r.shares) / r.views) * 100).toFixed(2) : '0';
          if (!day.overview || ((day.overview.views || 0) === 0 && (day.overview.reach || 0) === 0)) {
            day.overview = {
              views: r.views, reach: r.reach, profile: r.profile, likes: r.likes,
              shares: r.shares, comments: r.comments, netGrowth: r.netGrowth,
              followers: r.newFollowers, lostFollowers: r.lostFollowers, er: er
            };
            modified = true;
          } else if (ym === '2026-09' && !isMontraSample && legacySepViewsSet.has(day.overview.views) && day.overview.views !== r.views) {
            day.overview.views = r.views;
            day.overview.er = er;
            modified = true;
          }
          if (!day.audience || ((day.audience.reach || 0) === 0 && (day.audience.engaged || 0) === 0)) {
            day.audience = {
              reach: r.reach, engaged: r.engaged, newFollowers: r.newFollowers,
              lostFollowers: r.lostFollowers, er: r.reach > 0 ? ((r.engaged / r.reach) * 100).toFixed(2) : '0'
            };
            modified = true;
          }
          if (!day.sales || ((day.sales.tGmvTotal || 0) === 0 && (day.sales.tVV || 0) === 0 && (day.sales.tProdView || 0) === 0)) {
            day.sales = {
              tVV: r.vv, tProdView: r.impresi, tClick: r.klik, tOrder: r.order,
              tOrderDirect: r.orderDirect, tOrderIndirect: r.orderIndirect, tBuyers: r.buyers,
              tGmvTotal: r.gmvTotal, tGmvDirect: r.gmvDirect, tGmvIndirect: r.gmvIndirect,
              countRows: 1, sumGpm: r.gpm, sumRet: 3.2, videos: [], tags: {}
            };
            modified = true;
          }
        });
      });

      // Sync audience.newFollowers into overview.followers if overview.followers is 0
      Object.keys(targetDb.daily).forEach(d => {
        const day = targetDb.daily[d];
        if (!day) return;
        if (day.overview && (!day.overview.followers || day.overview.followers === 0) && day.audience && day.audience.newFollowers > 0) {
          day.overview.followers = day.audience.newFollowers;
          modified = true;
        }
      });

      // Update saved upload labels if they previously showed partial 14/16 days or 30 days when October (31 days) is loaded
      if (uploadLabels && typeof uploadLabels === 'object') {
        const hasOct = activeMonths.has('2026-10');
        const hasSep = activeMonths.has('2026-09');
        const octDaysCount = Object.keys(targetDb.daily).filter(d => d.startsWith('2026-10')).length;
        const targetDayLabel = (hasOct && hasSep)
          ? `31 Hari Okt & 30 Hari Sep (61 Hari)`
          : hasOct
            ? `${octDaysCount} Hari (Oktober)`
            : `${Object.keys(targetDb.daily).length} Hari`;
        const vcLbl = String(uploadLabels['filename-vc-summary'] || '');
        if (vcLbl.includes('14 Hari') || vcLbl.includes('16 Hari') || (hasOct && vcLbl.includes('30 Hari Video'))) {
          uploadLabels['filename-vc-summary'] = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${targetDayLabel} Video & Carousel Summary Terekstrak`;
          modified = true;
        }
        ['filename-overview', 'filename-audience'].forEach(k => {
          const l = String(uploadLabels[k] || '');
          if (l.includes('14 Hari') || l.includes('16 Hari') || (hasOct && (l.includes('30 Hari Berhasil') || l.includes('30 Hari Audience')))) {
            uploadLabels[k] = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${targetDayLabel} Berhasil Diproses`;
            modified = true;
          }
        });
      }

      return modified;
    }

    function initDefaultRAPAData(showNotification = true, includeSeptemberBaseline = true) {
      db.daily = {};
      db.videoList = [];
      db.salesVideos = [];
      db.globalTimeStats = {};

      const overviewRows = getDefaultRAPADailyRows(includeSeptemberBaseline);
      overviewRows.forEach(r => applyDailyRowToDb(db, r));

      // 2. Real Per-Video Dataset for "Produk & Sales" (From attached Video Performance List CSV)
      const salesRaw = [
        { title: "iPhone 15 - 17 bisa langsung cek keranjang kuning⚡️🔋 #iphone15 #iphone16 #iphone17", time: "2026/06/26 15:10:44", date: "2026-06-26", vv: 204051, impresi: 240531, klik: 6351, order: 110, itemsSold: 110, gmv: 32420233, direct: 26699383, indirect: 5720850, gpm: 158883, ret: 2.45, tags: "RAPAtech Power ION GaN 45W AVS PD 3.2 Fast Charger(1735730974568056228),RAPAtech Power Bank 3C/CCC 10000 mAh Origin ON Wireless(1729602965379843492),RAPAtech Power II Charger MFi 20W(1732180006164399524)" },
        { title: "Ada yang tau🤔 #traveling #powerbanktravel #powerbankmini", time: "2026/09/29 20:00:00", date: "2026-09-29", vv: 1008249, impresi: 1073318, klik: 85404, order: 78, itemsSold: 82, gmv: 31183056, direct: 24644321, indirect: 6538735, gpm: 30928, ret: 10.92, tags: "RAPAtech Power Bank Origin Loop PD40W Retractable Cable(1732576379053442468),RAPAtech Power Bank Origin Loop 22,5W Dual Cable(1734421847203284388),RAPAtech Origin Link Power Bank Ultra Mini(1733024101840094628)" },
        { title: "pasti bikin iPhone lu makin awet #chargeriphone #chargermfi #iphone", time: "2024/03/06 20:24:40", date: "2024-03-06", vv: 122303, impresi: 66444, klik: 4672, order: 82, itemsSold: 82, gmv: 12914272, direct: 10457736, indirect: 2456536, gpm: 105592, ret: 1.26, tags: "RAPAtech Charger MFi For iPhone 11-17 Fast Charging GaN(1729605425583851940),RAPAtech Power II Charger MFi 20W(1731087867147224484),RAPAtech LINE + I Kabel Charging MFi(1734234206211507620)" },
        { title: "Mending mana? Tonton sampai habis✅ (intinya sesuai kebutuhan ya👍) #powerbank #fastcharging #rapatech #compact #typec", time: "2026/07/02 16:38:30", date: "2026-07-02", vv: 60515, impresi: 76018, klik: 3806, order: 34, itemsSold: 34, gmv: 12415180, direct: 8683466, indirect: 3731714, gpm: 205159, ret: 2.16, tags: "RAPAtech Power Bank Origin Loop PD40W Retractable Cable(1732576379053442468),RAPAtech Origin Link Power Bank Ultra Mini(1733024101840094628),RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628)" },
        { title: "Jujur pb ini pas buat siapapun😭 #iphone17 #iphone13 #powerbankmini", time: "2026/08/30 13:08:00", date: "2026-08-30", vv: 82758, impresi: 91285, klik: 3802, order: 41, itemsSold: 41, gmv: 11845269, direct: 8599998, indirect: 3245271, gpm: 143131, ret: 4.15, tags: "RAPAtech Origin Link Power Bank Ultra Mini(1733024101840094628),RAPAtech Power Bank Wireless Origin ON+ LED Display(1730309157957764516),RAPAtech Power Bank Origin Loop PD40W(1732576379053442468)" },
        { title: "Hal wajib buat yang baru beli iPhone 18 Pro langsung pasangin Case & Tempered Glass biar makin aman✨ #iphone18pro #iphonecase #clearcase", time: "2026/09/18 17:00:00", date: "2026-09-18", vv: 21146, impresi: 30267, klik: 1546, order: 31, itemsSold: 32, gmv: 10080613, direct: 8062579, indirect: 2018034, gpm: 476715, ret: 2.16, tags: "RAPAtech Set iPhone 18 AERO Case ICE Clear + TG AR(1737557311010473380),RAPAtech AR Tempered Glass Tanpa List Hitam(1733141402110100900),RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628)" },
        { title: "iPhone 18 Pro sebentar lagi rilis di Indonesia 😭 #iphone18pro", time: "2026/09/30 23:00:00", date: "2026-09-30", vv: 46518, impresi: 51086, klik: 1789, order: 35, itemsSold: 35, gmv: 8010368, direct: 6871553, indirect: 1138815, gpm: 172199, ret: 1.81, tags: "RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628),RAPAtech Charger GaN iPhone Lightning MFi(1736148314407994788),RAPAtech Wireless Power Bank Qi2.2 35W(1733242422474212772)" },
        { title: "Pengguna iPhone 11 - 14 series bisa pake charger ini kalo kau awet🔋 #iphone #iphone11 #iphone13", time: "2026/08/23 14:00:00", date: "2026-08-23", vv: 74071, impresi: 82814, klik: 3728, order: 50, itemsSold: 50, gmv: 7565828, direct: 6424026, indirect: 1141802, gpm: 102143, ret: 3.03, tags: "RAPAtech Charger MFi For iPhone 11-17 Fast Charging GaN(1729605425583851940),RAPAtech Charger Nylon MFi For iPhone(1729549125518264740),RAPAtech Line II Cable MFi C To Lightning(1731241843647350180)" },
        { title: "Charger iPhone 18 Pro & iPhone 17 Pro⚡️🔋 #iphone18pro #iphone17pro", time: "2026/09/21 19:00:42", date: "2026-09-21", vv: 38563, impresi: 44012, klik: 1509, order: 31, itemsSold: 31, gmv: 6947850, direct: 5123260, indirect: 1824590, gpm: 180169, ret: 1.98, tags: "RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628),RAPAtech Power Zen GaN 45W Fast Charger PD3.2 AVS(1732576502273836452),RAPAtech Power ION GaN 45W AVS(1735730974568056228)" },
        { title: "Buat iPhone 8-14 auto aman #lebaranextraseru #chargeriphone #RAPAtech", time: "2024/04/04 12:11:23", date: "2024-04-04", vv: 12684, impresi: 18281, klik: 1711, order: 48, itemsSold: 48, gmv: 6736691, direct: 5200422, indirect: 1536269, gpm: 531117, ret: 2.96, tags: "RAPAtech Charger Nylon MFi For iPhone(1729549125518264740),RAPAtech LINE + I Kabel Charging MFi(1729641210020137380),RAPAtech Charger MFi For iPhone 11-17 Fast Charging GaN(1729605425583851940)" },
        { title: "Powerbank Spek Komplit nih #ramadanekstraseru #thrspesial #powerbank #magsafe", time: "2025/03/19 03:00:00", date: "2025-03-19", vv: 19010, impresi: 22868, klik: 1133, order: 18, itemsSold: 18, gmv: 6586452, direct: 5579221, indirect: 1007231, gpm: 346473, ret: 1.86, tags: "RAPAtech Power Bank Wireless Origin ON+ LED Display(1730309157957764516),RAPAtech Power Bank 3C/CCC 10000 mAh Origin ON Wireless(1729602965379843492)" },
        { title: "Casing iPhone 18 Pro Glacier✨ #iphone18pro", time: "2026/09/21 21:00:00", date: "2026-09-21", vv: 29310, impresi: 37563, klik: 1654, order: 17, itemsSold: 19, gmv: 6093934, direct: 4685369, indirect: 1408565, gpm: 207913, ret: 4.51, tags: "RAPAtech Set iPhone 18 AERO Case ICE Clear + TG AR(1737557311010473380)" },
        { title: "Membalas @G.M Sya'ari buat ip 13 pake ini aja udah pasti BH bakal awet🔋 #wibgajian #chargermfi #chargeriphone", time: "2024/05/25 21:09:13", date: "2024-05-25", vv: 5541, impresi: 17489, klik: 1332, order: 35, itemsSold: 35, gmv: 5932557, direct: 4857662, indirect: 1074895, gpm: 1070665, ret: 4.87, tags: "RAPAtech Charger MFi For iPhone 11-17 Fast Charging GaN(1729605425583851940),RAPAtech Power ION GaN 45W AVS(1735730974568056228)" },
        { title: "Punya 2 device? No problem! Powerbank ini udah build in cable lightning + type C !✅✨ #powerbank #lightning #typec #compact #concert", time: "2026/05/21 12:00:00", date: "2026-05-21", vv: 18689, impresi: 26139, klik: 1106, order: 19, itemsSold: 19, gmv: 5870668, direct: 4569720, indirect: 1300948, gpm: 314124, ret: 2.19, tags: "RAPAtech Origin Link Power Bank Ultra Mini(1733024101840094628),RAPAtech Power Bank Origin Loop 22,5W Dual Cable(1734421847203284388)" },
        { title: "Canggih! Charger ada display-nya!📱⚡️ #powerion #fastcharging #AVS #iphone #iphone17", time: "2026/08/03 16:25:42", date: "2026-08-03", vv: 9087, impresi: 18586, klik: 467, order: 19, itemsSold: 19, gmv: 5678864, direct: 5301010, indirect: 377854, gpm: 624944, ret: 1.30, tags: "RAPAtech Power ION GaN 45W AVS PD 3.2 Fast Charger(1735730974568056228),RAPAtech LINE + I Kabel Charging MFi(1729641210020137380)" },
        { title: "Powerbank Ultra Slim turun harga khusus bulan ini!!! #magsafe #powerbank #iphonetips", time: "2025/05/17 22:35:00", date: "2025-05-17", vv: 168033, impresi: 9130, klik: 804, order: 11, itemsSold: 11, gmv: 4961887, direct: 1985645, indirect: 2976242, gpm: 29529, ret: 1.02, tags: "RAPAtech Power Bank Wireless Origin ON+ LED Display(1730309157957764516),RAPAtech Wireless Power Bank Qi2.2 35W(1733242422474212772)" },
        { title: "Pilih PB sesuai sama kebutuhan lo😁 #powerbank #iphone #promoguncang99", time: "2024/09/02 17:32:33", date: "2024-09-02", vv: 10243, impresi: 16244, klik: 1091, order: 12, itemsSold: 12, gmv: 4720813, direct: 3962054, indirect: 758759, gpm: 460882, ret: 6.95, tags: "RAPAtech Power Bank 3C/CCC 10000 mAh Origin ON Wireless(1729602965379843492),RAPAtech Power Bank Origin Loop PD40W(1732576379053442468)" },
        { title: "User iPhone 11-14 series wajib pake charger MFi ini sih🔋 #iphone11 #iphone13 #iphone14", time: "2026/09/03 22:15:00", date: "2026-09-03", vv: 48101, impresi: 51711, klik: 2550, order: 26, itemsSold: 26, gmv: 4590052, direct: 3743656, indirect: 846396, gpm: 95425, ret: 3.11, tags: "RAPAtech Charger MFi For iPhone 11-17 Fast Charging GaN(1729605425583851940),RAPAtech LINE + I Kabel Charging MFi(1734234206211507620)" },
        { title: "mending mana 5000mAh apa 10000mAh ?? #magsafe #iphone #powerbankwireless", time: "2025/07/17 09:45:39", date: "2025-07-17", vv: 23362, impresi: 27991, klik: 2618, order: 10, itemsSold: 10, gmv: 4361495, direct: 3423609, indirect: 937886, gpm: 186692, ret: 4.32, tags: "RAPAtech Power Bank Wireless Origin ON+ LED Display(1730309157957764516),RAPAtech Wireless Power Bank Qi2.2 35W(1733242422474212772)" },
        { title: "Clear Case komplit buat iPhone 18 PRO 📱#iphone18pro #clearcase", time: "2026/10/01 15:00:00", date: "2026-10-01", vv: 8712, impresi: 10425, klik: 527, order: 8, itemsSold: 8, gmv: 2397959, direct: 1289216, indirect: 1108743, gpm: 275248, ret: 3.54, tags: "RAPAtech Set iPhone 18 AERO Case ICE Clear + TG AR(1737557311010473380),RAPAtech CASE ICE Hybrid Case Magsafe(1732565198851966372)" }
      ];

      const septSalesRaw = includeSeptemberBaseline ? [
        { title: "Ada yang tau🤔 #traveling #powerbanktravel #powerbankmini", time: "2026/09/29 20:00:00", date: "2026-09-29", reportMonth: "2026-09", vv: 760400, impresi: 810200, klik: 64100, order: 61, itemsSold: 64, gmv: 24150000, direct: 19200000, indirect: 4950000, gpm: 31759, ret: 10.45, tags: "RAPAtech Power Bank Origin Loop PD40W Retractable Cable(1732576379053442468),RAPAtech Power Bank Origin Loop 22,5W Dual Cable(1734421847203284388)" },
        { title: "iPhone 15 - 17 bisa langsung cek keranjang kuning⚡️🔋 #iphone15 #iphone16 #iphone17", time: "2026/06/26 15:10:44", date: "2026-06-26", reportMonth: "2026-09", vv: 168000, impresi: 195400, klik: 5120, order: 88, itemsSold: 88, gmv: 25800000, direct: 21100000, indirect: 4700000, gpm: 153571, ret: 2.38, tags: "RAPAtech Power ION GaN 45W AVS PD 3.2 Fast Charger(1735730974568056228),RAPAtech Power II Charger MFi 20W(1732180006164399524)" },
        { title: "Hal wajib buat yang baru beli iPhone 18 Pro langsung pasangin Case & Tempered Glass biar makin aman✨ #iphone18pro #iphonecase #clearcase", time: "2026/09/18 17:00:00", date: "2026-09-18", reportMonth: "2026-09", vv: 19800, impresi: 28400, klik: 1420, order: 28, itemsSold: 29, gmv: 9120000, direct: 7300000, indirect: 1820000, gpm: 460606, ret: 2.12, tags: "RAPAtech Set iPhone 18 AERO Case ICE Clear + TG AR(1737557311010473380),RAPAtech AR Tempered Glass Tanpa List Hitam(1733141402110100900)" },
        { title: "iPhone 18 Pro sebentar lagi rilis di Indonesia 😭 #iphone18pro", time: "2026/09/30 23:00:00", date: "2026-09-30", reportMonth: "2026-09", vv: 41200, impresi: 46800, klik: 1640, order: 31, itemsSold: 31, gmv: 7180000, direct: 6120000, indirect: 1060000, gpm: 174271, ret: 1.79, tags: "RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628),RAPAtech Wireless Power Bank Qi2.2 35W(1733242422474212772)" },
        { title: "Charger iPhone 18 Pro & iPhone 17 Pro⚡️🔋 #iphone18pro #iphone17pro", time: "2026/09/21 19:00:42", date: "2026-09-21", reportMonth: "2026-09", vv: 34200, impresi: 39800, klik: 1380, order: 27, itemsSold: 27, gmv: 6140000, direct: 4520000, indirect: 1620000, gpm: 179532, ret: 1.95, tags: "RAPAtech Charger ZeN Pro GaN60W AVS(1737531869492446628),RAPAtech Power Zen GaN 45W Fast Charger PD3.2 AVS(1732576502273836452)" }
      ] : [];

      const octSalesMapped = salesRaw.map(v => {
        const det = getPillarClassificationDetails(v.title, v.tags || '', 'brand_1');
        return {
          ...v,
          reportMonth: '2026-10',
          pillar: det.pillar,
          pillarSource: det.sourceLabel
        };
      });
      const septSalesMapped = septSalesRaw.map(v => {
        const det = getPillarClassificationDetails(v.title, v.tags || '', 'brand_1');
        return {
          ...v,
          pillar: det.pillar,
          pillarSource: det.sourceLabel
        };
      });

      db.salesVideos = [...septSalesMapped, ...octSalesMapped];

      // 3. Real Video Performance Tracking (September + October 2026 Videos)
      const septVideoRaw = includeSeptemberBaseline ? [
        { title: "Ada yang tau🤔 #traveling #powerbanktravel #powerbankmini", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000001", time: "2026-09-29 20:00:00", views: 42850, likes: 215, comments: 14, shares: 28, favorites: 45 },
        { title: "Hal wajib buat yang baru beli iPhone 18 Pro pasangin Case & Tempered Glass✨ #iphone18pro #iphonecase #clearcase", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000002", time: "2026-09-18 17:00:00", views: 21146, likes: 110, comments: 8, shares: 15, favorites: 22 },
        { title: "iPhone 18 Pro sebentar lagi rilis di Indonesia 😭 #iphone18pro", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000003", time: "2026-09-30 23:00:00", views: 46518, likes: 190, comments: 11, shares: 19, favorites: 34 },
        { title: "Charger iPhone 18 Pro & iPhone 17 Pro⚡️🔋 #iphone18pro #iphone17pro", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000004", time: "2026-09-21 19:00:42", views: 38563, likes: 142, comments: 6, shares: 14, favorites: 28 },
        { title: "Casing iPhone 18 Pro Glacier✨ #iphone18pro", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000005", time: "2026-09-21 21:00:00", views: 29310, likes: 118, comments: 5, shares: 11, favorites: 19 },
        { title: "User iPhone 11-14 series wajib pake charger MFi ini sih🔋 #iphone11 #iphone13 #iphone14", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000006", time: "2026-09-19 22:15:00", views: 24800, likes: 95, comments: 4, shares: 9, favorites: 16 },
        { title: "Powerbank Origin Loop PD40W kabel tarik super praktis! #powerbank #originloop #rapatech", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000007", time: "2026-09-23 18:30:00", views: 19450, likes: 84, comments: 3, shares: 7, favorites: 14 },
        { title: "Kenapa Tempered Glass AR RAPAtech beda jauh sama TG biasa? #temperedglass #iphone17 #antiintip", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000008", time: "2026-09-24 12:00:00", views: 17200, likes: 76, comments: 2, shares: 6, favorites: 12 },
        { title: "Tips cas iPhone malam hari biar aman & dingin ⚡️ #chargeriphone #gancharger #tipsiphone", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000009", time: "2026-09-25 19:45:00", views: 15800, likes: 68, comments: 3, shares: 5, favorites: 11 },
        { title: "Spill isi tas kerja bareng Powerbank Ultra Mini Origin Link #powerbankmini #dailycarry #rapatech", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000010", time: "2026-09-26 16:20:00", views: 14900, likes: 64, comments: 2, shares: 4, favorites: 10 },
        { title: "Jangan tunggu layar baret baru pasang Tempered Glass AR! #temperedglass #iphone18pro", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000011", time: "2026-09-27 14:10:00", views: 12400, likes: 52, comments: 1, shares: 3, favorites: 8 },
        { title: "Payday Sale akhir September di Live RAPAtech malam ini! #promolive #paydaysale", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000012", time: "2026-09-28 18:00:00", views: 11300, likes: 45, comments: 1, shares: 2, favorites: 6 },
        { title: "Case Bening Anti Kuning 6 Bulan Garansi Resmi #clearcase #casingiphone #rapatech", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000013", time: "2026-09-22 15:00:00", views: 10850, likes: 41, comments: 1, shares: 3, favorites: 7 },
        { title: "Charger 60W ZeN Pro GaN buat MacBook & iPhone sekaligus #gancharger #fastcharging #rapatech", link: "https://www.tiktok.com/@rapa_indonesia/video/7689100000000000014", time: "2026-09-20 13:00:00", views: 9800, likes: 38, comments: 0, shares: 2, favorites: 5 }
      ] : [];

      const octVideoRaw = [
        { title: "Jangan asal pilih charger, kalau ngga mau Battery Health kalian ngedrop! #chargeriphone #MFi #iPhone", link: "https://www.tiktok.com/@rapa_indonesia/video/7693878997586939144", time: "2026-10-07 11:02:21", views: 31361, likes: 94, comments: 1, shares: 6, favorites: 31 },
        { title: "Promo Special 10.10 Big Sale RAPAtech nanti malam, jangan sampai ketinggalan!🚀 #promolive #tiktoklive", link: "https://www.tiktok.com/@rapa_indonesia/video/7694560316545371413", time: "2026-10-09 07:03:57", views: 23644, likes: 37, comments: 0, shares: 3, favorites: 4 },
        { title: "Aero Case for iPhone 18 Pro & iPhone 17 Pro‼️💪 #iphone18pro #casingiphone #iphone17pro", link: "https://www.tiktok.com/@rapa_indonesia/video/7693104805362863380", time: "2026-10-05 08:55:51", views: 17403, likes: 62, comments: 0, shares: 6, favorites: 18 },
        { title: "Mending beli iPhone 18 Pro di Indonesia! 🇮🇩 #iPhone18pro #worthit #indonesia", link: "https://www.tiktok.com/@rapa_indonesia/video/7693842284319673607", time: "2026-10-07 09:00:00", views: 16184, likes: 80, comments: 1, shares: 8, favorites: 8 },
        { title: "Biar bersih nih iPhone 18 Pro burgundy #iphone18pro #burgundy", link: "https://www.tiktok.com/@rapa_indonesia/video/7694616000855133460", time: "2026-10-09 13:00:00", views: 15875, likes: 72, comments: 1, shares: 13, favorites: 7 },
        { title: "Kalian ada yang ngalamin Bug ini juga ga sih?🥲 #iPhone #iOS27 #siri #appleintelligence", link: "https://www.tiktok.com/@rapa_indonesia/video/7694515566299598088", time: "2026-10-09 04:10:42", views: 15421, likes: 117, comments: 12, shares: 3, favorites: 13 },
        { title: "Ga sabar mau beli iPhone Duo, beli warna apa yak? 😭 #iphoneduo #foldable #ios", link: "https://www.tiktok.com/@rapa_indonesia/video/7692308872253426951", time: "2026-10-03 07:00:00", views: 14665, likes: 96, comments: 0, shares: 3, favorites: 8 },
        { title: "Menurut kalian, apalagi yang bakal di hilangkan Apple?👀#iPhone #apple", link: "https://www.tiktok.com/@rapa_indonesia/video/7694242551024438529", time: "2026-10-08 11:00:00", views: 13521, likes: 83, comments: 17, shares: 4, favorites: 9 },
        { title: "Siapa nih yang baru tau? 🧐 #tipsandtricks", link: "https://www.tiktok.com/@rapa_indonesia/video/7691600061909814529", time: "2026-10-01 10:00:00", views: 11911, likes: 58, comments: 0, shares: 5, favorites: 7 },
        { title: "Ultra Slim Magsafe Powerbank🤏🔋 #iphoneair #magsafe #powerbankiphone", link: "https://www.tiktok.com/@rapa_indonesia/video/7694621696699010325", time: "2026-10-10 07:31:00", views: 11861, likes: 36, comments: 0, shares: 0, favorites: 2 },
        { title: "Barang yang wajib punya sih ini 🔥#iPhone #worthit #powerbank #fastcharging", link: "https://www.tiktok.com/@rapa_indonesia/video/7694183276977655058", time: "2026-10-08 07:00:00", views: 9987, likes: 29, comments: 0, shares: 3, favorites: 6 },
        { title: "Clear Case komplit buat iPhone 18 PRO 📱#iphone18pro #clearcase", link: "https://www.tiktok.com/@rapa_indonesia/video/7691595938502135092", time: "2026-10-01 08:00:00", views: 9972, likes: 59, comments: 0, shares: 6, favorites: 16 },
        { title: "Promo Ambyar 10.10 cuma di live RAPAtech 🎉‼️ Join Live Sekarang🙌 #promolive", link: "https://www.tiktok.com/@rapa_indonesia/video/7691656739028045077", time: "2026-10-02 02:00:00", views: 9645, likes: 21, comments: 1, shares: 0, favorites: 1 },
        { title: "Udah pakai iPhone 18 Pro, jangan salah pakai charger 📱🔋 #iphone18pro #fastcharge #60w", link: "https://www.tiktok.com/@rapa_indonesia/video/7692014494813277458", time: "2026-10-02 15:00:00", views: 8990, likes: 37, comments: 0, shares: 6, favorites: 8 },
        { title: "Mending beli di Indo / Luar Negeri ya? 🧐 #iPhone18pro #indonesia #worthit", link: "https://www.tiktok.com/@rapa_indonesia/video/7693132541842197768", time: "2026-10-05 11:00:00", views: 8780, likes: 77, comments: 1, shares: 5, favorites: 5 },
        { title: "Coba komen, kalian pake iPhone berapa deh? biar aku bantu nilai 🥳 #iPhone #tipsandtricks", link: "https://www.tiktok.com/@rapa_indonesia/video/7693447113421769992", time: "2026-10-06 07:04:35", views: 8256, likes: 32, comments: 0, shares: 1, favorites: 2 },
        { title: "Charger yang aman buat iPhone 18 Pro😎 #iPhone18pro #fastcharge #60w #tipsandtricks", link: "https://www.tiktok.com/@rapa_indonesia/video/7693135229334539527", time: "2026-10-05 13:00:00", views: 8166, likes: 18, comments: 3, shares: 9, favorites: 6 },
        { title: "Agar supaya battery health iPhone kalian lebih awet 😎🔋 #iphone18pro #fastcharge #60w", link: "https://www.tiktok.com/@rapa_indonesia/video/7692309684065160456", time: "2026-10-03 09:00:00", views: 8065, likes: 31, comments: 0, shares: 3, favorites: 7 },
        { title: "1 Charger bisa buat semua device 😮‍💨#iphone18pro #fastcharge #60w #worthit", link: "https://www.tiktok.com/@rapa_indonesia/video/7692631953593355528", time: "2026-10-04 07:00:00", views: 7716, likes: 16, comments: 0, shares: 8, favorites: 3 },
        { title: "Combo mematikan iPhone Air🤏🔋 #iphoneair #iphone #powerbankiphone", link: "https://www.tiktok.com/@rapa_indonesia/video/7694614663945817365", time: "2026-10-09 10:34:51", views: 7595, likes: 16, comments: 0, shares: 8, favorites: 6 }
      ];

      const videoRaw = [
        ...septVideoRaw.map(v => ({ ...v, reportMonth: '2026-09' })),
        ...octVideoRaw.map(v => ({ ...v, reportMonth: '2026-10' }))
      ];

      db.videoList = videoRaw.map(v => ({
        ...v,
        pillar: classifyContentPillar(v.title),
        date: extractDate(v.time),
        reportMonth: v.reportMonth || (extractDate(v.time) ? extractDate(v.time).slice(0, 7) : '')
      }));

      // Hourly time stats for 24h heatmap
      const hourlyGMV = [0, 0, 450000, 780000, 1200000, 850000, 920000, 3100000, 4200000, 2800000, 3500000, 4900000, 5600000, 6800000, 9500000, 12800000, 14200000, 18500000, 24500000, 28900000, 34200000, 26800000, 15400000, 8900000];
      for (let i = 0; i < 24; i++) {
        db.globalTimeStats[i] = {
          gmv: hourlyGMV[i] || 0,
          vv: Math.round((hourlyGMV[i] || 100000) / 45),
          count: Math.max(1, Math.round(hourlyGMV[i] / 3000000))
        };
      }

      // Starter Kanban Tasks for Team
      db.todos = [
        { id: 101, title: "Review Case Ice Clear Garansi Yellowing 6 Bulan (Uji Ketahanan)", stage: "Filming", pillar: "Case", assignee: "Alex (Talent)", priority: "High", due: "2026-10-18", note: "Fokus ke visual airbag 4 sudut & demonstrasi anti nguning vs case abal-abal." },
        { id: 102, title: "A/B Testing Hook 3 Detik: Powerbank Loop 40W vs 22.5W", stage: "Scripting", pillar: "Power Bank", assignee: "Sarah (Script)", priority: "High", due: "2026-10-16", note: "Hook 1: 'Pake kabel ribet? Mending ini!'\nHook 2: 'Powerbank kecil tapi 40W?!'" },
        { id: 103, title: "Edukasi Protokol AVS & GaN 45W vs Charger Bawaan iPhone", stage: "Ideas", pillar: "Charger", assignee: "Rian (Editor)", priority: "Medium", due: "2026-10-19", note: "Jelaskan kenapa fitur AVS bisa adaptif jaga battery health iPhone 15-18 series." },
        { id: 104, title: "Tutorial Pasang Tempered Glass AR Anti-Reflection 5 Detik", stage: "Ready to Post", pillar: "Tempered Glass", assignee: "Budi (Host)", priority: "Medium", due: "2026-10-17", note: "Video sudah siap di-export, tinggal nunggu jadwal slot posting sore jam 18:00." },
        { id: 105, title: "Promo Special 10.10 Mega Sale Teaser Snippet", stage: "Published", pillar: "Promo/Live", assignee: "Team (All)", priority: "High", due: "2026-10-09", note: "Telah tayang dan menghasilkan ribuan views sebelum live dimulai." }
      ];

      // Starter Content Log
      db.contents = [
        { id: 201, title: "Jangan asal pilih charger, kalau ngga mau Battery Health kalian ngedrop!", date: "2026-10-07", pillar: "Charger", link: "https://www.tiktok.com/@rapa_indonesia/video/7693878997586939144", views: 31361, likes: 94 },
        { id: 202, title: "Aero Case for iPhone 18 Pro & iPhone 17 Pro‼️💪", date: "2026-10-05", pillar: "Case", link: "https://www.tiktok.com/@rapa_indonesia/video/7693104805362863380", views: 17403, likes: 62 },
        { id: 203, title: "Biar bersih nih iPhone 18 Pro burgundy", date: "2026-10-09", pillar: "Case", link: "https://www.tiktok.com/@rapa_indonesia/video/7694616000855133460", views: 15875, likes: 72 },
        { id: 204, title: "Ada yang tau🤔 #traveling #powerbanktravel", date: "2026-10-02", pillar: "Power Bank", link: "https://www.tiktok.com/@rapa_indonesia", views: 984815, likes: 8762 }
      ];

      const totalDaysCount = Object.keys(db.daily || {}).length;
      const hashVidCount = (db.videoList || []).filter(v => String(v.title || '').includes('#')).length;
      const ovLabel = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Berhasil Diproses`;
      const audLabel = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Audience Diproses`;
      const vidLabel = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${hashVidCount} Video (#) dari ${(db.videoList || []).length} Total Video`;
      const vcLabel = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Video & Carousel Summary Terekstrak`;
      const prodLabel = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${(db.salesVideos || []).length} Video (Sep & Okt Menghasilkan GMV)`;

      if (document.getElementById('filename-overview')) document.getElementById('filename-overview').innerHTML = ovLabel;
      if (document.getElementById('filename-audience')) document.getElementById('filename-audience').innerHTML = audLabel;
      if (document.getElementById('filename-video')) document.getElementById('filename-video').innerHTML = vidLabel;
      if (document.getElementById('filename-vc-summary')) document.getElementById('filename-vc-summary').innerHTML = vcLabel;
      if (document.getElementById('filename-product')) document.getElementById('filename-product').innerHTML = prodLabel;

      saveToStorage();
      const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'RAPAtech';
      if (showNotification) showToast(`Data contoh Multi-Bulan Penuh (30 Hari September & 31 Hari Oktober 2026) untuk ${bName} berhasil dimuat!`, "success");
    }

    // --- MONTRA SAMPLE DATASET GENERATOR (IDE B: CASING CLEAR, CASING LEATHER, CASING ORBIT & TEMPERED GLASS) ---
    function initDefaultMontraData(showNotification = true, includeSeptemberBaseline = true, targetDbObj = null) {
      const targetDb = targetDbObj || db;
      targetDb.daily = {};
      targetDb.videoList = [];
      targetDb.salesVideos = [];
      targetDb.globalTimeStats = {};

      const montraDailyRows = getDefaultMontraDailyRows(includeSeptemberBaseline);
      montraDailyRows.forEach(r => applyDailyRowToDb(targetDb, r));

      const montraSalesSep = includeSeptemberBaseline ? [
        { title: "Casing Orbit MagSafe Stand bisa putar 360 derajat! Nonton & kerja makin praktis🪐✨ #montra #casingorbit #magsafestand #iphone17pro", time: "2026/09/26 19:15:00", date: "2026-09-26", reportMonth: "2026-09", vv: 382400, impresi: 412000, klik: 28400, order: 142, itemsSold: 148, gmv: 28258000, direct: 22100000, indirect: 6158000, gpm: 73896, ret: 5.4, tags: "MONTRA Casing Orbit 360 Rotating MagSafe Stand iPhone 15-18 Pro(18401101),MONTRA Tempered Glass Corning AR DustFree(18401104)" },
        { title: "Udah 6 bulan pake Casing Clear MONTRA beneran anti nguning & bening kristal💎 #montra #casingclear #antiyellowing #clearcase", time: "2026/09/20 18:30:00", date: "2026-09-20", reportMonth: "2026-09", vv: 294500, impresi: 318000, klik: 21600, order: 128, itemsSold: 132, gmv: 21632000, direct: 16800000, indirect: 4832000, gpm: 73453, ret: 4.2, tags: "MONTRA Crystal Casing Clear Anti-Yellowing MagSafe(18401102)" },
        { title: "Look mewah & eksekutif pake Casing Leather Premium MONTRA👜 tekstur kulitnya juara! #montra #casingleather #leathercase #iphone18pro", time: "2026/09/14 20:00:00", date: "2026-09-14", reportMonth: "2026-09", vv: 186200, impresi: 204500, klik: 13800, order: 88, itemsSold: 90, gmv: 19272000, direct: 15100000, indirect: 4172000, gpm: 103501, ret: 3.8, tags: "MONTRA Magnetic Vegan Casing Leather Premium(18401103)" },
        { title: "Pasang Tempered Glass Anti-Spy 5 detik langsung presisi tanpa debu🛡️ #montra #temperedglass #antispy #screenprotector", time: "2026/09/09 12:15:00", date: "2026-09-09", reportMonth: "2026-09", vv: 245800, impresi: 268000, klik: 18900, order: 134, itemsSold: 145, gmv: 18626000, direct: 14500000, indirect: 4126000, gpm: 75777, ret: 4.9, tags: "MONTRA Tempered Glass Privacy Anti-Spy EasyFit Box(18401104)" },
        { title: "Promo Bundling 9.9 MONTRA: Casing Clear + Tempered Glass hemat 40%!🔴 #montra #promobundling #tiktoklive", time: "2026/09/08 19:45:00", date: "2026-09-08", reportMonth: "2026-09", vv: 164000, impresi: 182000, klik: 12400, order: 76, itemsSold: 84, gmv: 15124000, direct: 11800000, indirect: 3324000, gpm: 92219, ret: 3.1, tags: "MONTRA Bundling Casing Clear + Tempered Glass AR(18401105)" }
      ] : [];

      const montraSalesOct = [
        { title: "Uji banting & putar 360° Casing Orbit MONTRA di iPhone 18 Pro! Ring stand paling kokoh🪐🔥 #montra #casingorbit #magsafestand #iphone18pro", time: "2026/10/24 19:30:00", date: "2026-10-24", reportMonth: "2026-10", vv: 468000, impresi: 512000, klik: 38900, order: 186, itemsSold: 194, gmv: 37014000, direct: 29400000, indirect: 7614000, gpm: 79089, ret: 6.4, tags: "MONTRA Casing Orbit 360 Rotating MagSafe Stand iPhone 15-18 Pro(18401101)" },
        { title: "Kenapa Casing Clear MONTRA berani kasih garansi anti nguning? Ini rahasianya✨💎 #montra #casingclear #clearcase #antiyellowing", time: "2026/10/18 18:15:00", date: "2026-10-18", reportMonth: "2026-10", vv: 356400, impresi: 392000, klik: 27400, order: 164, itemsSold: 170, gmv: 27716000, direct: 21800000, indirect: 5916000, gpm: 77766, ret: 4.8, tags: "MONTRA Crystal Casing Clear Anti-Yellowing MagSafe(18401102)" },
        { title: "Battle Casing MONTRA: Casing Leather elegan vs Casing Orbit fungsional, tim mana kalian?👜🪐 #montra #casingleather #casingorbit", time: "2026/10/10 20:00:00", date: "2026-10-10", reportMonth: "2026-10", vv: 289000, impresi: 324000, klik: 22800, order: 132, itemsSold: 138, gmv: 28908000, direct: 22900000, indirect: 6008000, gpm: 100027, ret: 5.1, tags: "MONTRA Magnetic Vegan Casing Leather Premium(18401103),MONTRA Casing Orbit 360 Rotating MagSafe Stand(18401101)" },
        { title: "Jangan biarin layar iPhone 18 Pro baret! Pasang Tempered Glass Corning AR MONTRA🛡️✨ #montra #temperedglass #screenguard #antispy", time: "2026/10/15 17:00:00", date: "2026-10-15", reportMonth: "2026-10", vv: 268500, impresi: 296000, klik: 20400, order: 148, itemsSold: 156, gmv: 20572000, direct: 16200000, indirect: 4372000, gpm: 76618, ret: 4.5, tags: "MONTRA Tempered Glass Privacy Anti-Spy EasyFit Box(18401104)" },
        { title: "Review jujur Casing Leather MONTRA warna Saddle Brown & Midnight Black👜🔥 #montra #casingleather #leathercase #iphone17pro", time: "2026/10/22 19:00:00", date: "2026-10-22", reportMonth: "2026-10", vv: 198400, impresi: 221000, klik: 15200, order: 96, itemsSold: 98, gmv: 21024000, direct: 16700000, indirect: 4324000, gpm: 105967, ret: 3.9, tags: "MONTRA Magnetic Vegan Casing Leather Premium(18401103)" },
        { title: "Spesial Live 10.10 MONTRA: Tebus Murah Tempered Glass setiap beli Casing Orbit/Clear!🔴🎉 #montra #promolive #bundling", time: "2026/10/09 19:30:00", date: "2026-10-09", reportMonth: "2026-10", vv: 184200, impresi: 210000, klik: 14900, order: 92, itemsSold: 104, gmv: 18308000, direct: 14400000, indirect: 3908000, gpm: 99391, ret: 3.4, tags: "MONTRA Bundling Casing Orbit + Tempered Glass AR(18401105)" },
        { title: "Casing Clear tipis tapi tahan banting? Ini tes airbag 4 sudut MONTRA Ice Clear✨ #montra #casingclear #clearcase #dropproof", time: "2026/10/28 18:45:00", date: "2026-10-28", reportMonth: "2026-10", vv: 214000, impresi: 238000, klik: 16400, order: 104, itemsSold: 108, gmv: 17576000, direct: 13900000, indirect: 3676000, gpm: 82130, ret: 4.3, tags: "MONTRA Crystal Casing Clear Anti-Yellowing MagSafe(18401102)" }
      ];

      const allMontraSales = [...montraSalesSep, ...montraSalesOct];
      targetDb.salesVideos = allMontraSales.map(v => ({
        ...v,
        pillar: classifyContentPillar(v.title, v.tags, 'brand_2')
      }));

      targetDb.videoList = allMontraSales.map((v, idx) => ({
        title: v.title,
        link: `https://www.tiktok.com/@montra_id/video/7695000000000000${idx + 10}`,
        time: v.time.replace(/\//g, '-'),
        date: v.date,
        reportMonth: v.reportMonth,
        views: v.vv,
        likes: Math.round(v.vv * 0.042),
        comments: Math.round(v.vv * 0.002),
        shares: Math.round(v.vv * 0.006),
        favorites: Math.round(v.vv * 0.008),
        pillar: classifyContentPillar(v.title, v.tags, 'brand_2')
      }));

      targetDb.globalTimeStats = rebuildGlobalTimeStats(targetDb.salesVideos);

      targetDb.todos = [
        { id: 301, title: "Uji Drop Test & Putar 360° Casing Orbit MagSafe Stand", stage: "Filming", pillar: "Casing Orbit", assignee: "Alex (Talent)", priority: "High", due: "2026-10-25", note: "Tunjukkan engsel O-Ring Casing Orbit yang kokoh untuk posisi portrait & landscape." },
        { id: 302, title: "Eksperimen UV Comparison: Casing Clear MONTRA vs Case Biasa", stage: "Scripting", pillar: "Casing Clear", assignee: "Sarah (Script)", priority: "High", due: "2026-10-23", note: "Highlight material Bayer TPU Anti-Yellowing pada Casing Clear." },
        { id: 303, title: "ASMR Unboxing & Tes Magnet Casing Leather Premium", stage: "Editing", pillar: "Casing Leather", assignee: "Rian (Editor)", priority: "Medium", due: "2026-10-26", note: "Fokus pada tekstur kulit premium, tombol metal, dan daya rekat MagSafe." },
        { id: 304, title: "Demo Pasang Tempered Glass Dust-Free Auto Alignment 5 Detik", stage: "Ready to Post", pillar: "Tempered Glass", assignee: "Budi (Host)", priority: "High", due: "2026-10-24", note: "Tunjukkan hasil layar jernih tanpa gelembung & sudut pandang Anti-Spy 28 derajat." },
        { id: 305, title: "Teaser Live Bundling Casing Orbit + Tempered Glass", stage: "Published", pillar: "Promo/Live", assignee: "Team (All)", priority: "Medium", due: "2026-10-10", note: "Tayang sebelum sesi Live Payday." }
      ];

      targetDb.contents = [
        { id: 401, title: "Uji banting & putar 360° Casing Orbit MONTRA di iPhone 18 Pro! #montra #casingorbit", date: "2026-10-24", pillar: "Casing Orbit", link: "https://www.tiktok.com/@montra_id/video/769500000000000015", views: 468000, likes: 19656 },
        { id: 402, title: "Kenapa Casing Clear MONTRA berani kasih garansi anti nguning? #montra #casingclear", date: "2026-10-18", pillar: "Casing Clear", link: "https://www.tiktok.com/@montra_id/video/769500000000000016", views: 356400, likes: 14968 },
        { id: 403, title: "Battle Casing MONTRA: Casing Leather elegan vs Casing Orbit fungsional #montra #casingleather", date: "2026-10-10", pillar: "Casing Leather", link: "https://www.tiktok.com/@montra_id/video/769500000000000017", views: 289000, likes: 12138 },
        { id: 404, title: "Jangan biarin layar iPhone 18 Pro baret! Pasang Tempered Glass Corning AR MONTRA #montra #temperedglass", date: "2026-10-15", pillar: "Tempered Glass", link: "https://www.tiktok.com/@montra_id/video/769500000000000018", views: 268500, likes: 11277 }
      ];

      const totalDaysCount = Object.keys(targetDb.daily || {}).length;
      const hashVidCount = (targetDb.videoList || []).filter(v => String(v.title || '').includes('#')).length;
      const labelsObj = {
        'filename-overview': `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Berhasil Diproses`,
        'filename-audience': `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Audience Diproses`,
        'filename-video': `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${hashVidCount} Video (#) dari ${(targetDb.videoList || []).length} Total Video`,
        'filename-vc-summary': `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> 31 Hari Okt & 30 Hari Sep (${totalDaysCount} Hari) Video & Carousel Summary Terekstrak`,
        'filename-product': `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${(targetDb.salesVideos || []).length} Video MONTRA (Sep & Okt Menghasilkan GMV)`
      };

      if (brandsStore.brand_2) {
        brandsStore.brand_2.uploadLabels = labelsObj;
      }
      if (!targetDbObj || targetDb === db) {
        Object.entries(labelsObj).forEach(([k, val]) => {
          const el = document.getElementById(k);
          if (el) el.innerHTML = val;
        });
      }

      saveToStorage();
      const bName = (brandsStore.brand_2 && brandsStore.brand_2.meta.name) || 'MONTRA';
      if (showNotification) showToast(`Data contoh Multi-Bulan Penuh (30 Hari September & 31 Hari Oktober 2026) untuk ${bName} (Casing Clear, Leather, Orbit & TG) berhasil dimuat!`, "success");
    }

    function loadSampleRAPAData() {
      const targetBrand = ensureSingleBrandForWrite('memuat contoh data');
      if (targetBrand === 'brand_2') {
        brandsStore.brand_2.kpiTargets = { gmv: 350000000, views: 4500000, followers: 1800, ctr: 6.2 };
        kpiTargets = brandsStore.brand_2.kpiTargets;
        initDefaultMontraData(true, true);
      } else {
        brandsStore.brand_1.kpiTargets = { gmv: 500000000, views: 6000000, followers: 2500, ctr: 6.0 };
        kpiTargets = brandsStore.brand_1.kpiTargets;
        initDefaultRAPAData(true, true);
        // Also initialize MONTRA sample data if brand_2 is currently empty so Holding & Multi-Brand Report work out of the box
        if (brandsStore.brand_2 && Object.keys(brandsStore.brand_2.db.daily || {}).length === 0) {
          brandsStore.brand_2.kpiTargets = { gmv: 350000000, views: 4500000, followers: 1800, ctr: 6.2 };
          initDefaultMontraData(false, true, brandsStore.brand_2.db);
        }
      }
      const selOverviewMonth = document.getElementById('overview-month-filter');
      if (selOverviewMonth) selOverviewMonth.value = 'month:2026-10';
      renderAllTabs();
      renderWorkspace();
      renderContents();
    }

    function loadSampleMultiMonthData() {
      loadSampleRAPAData();
      switchCompareMode('month');
    }

    // --- UPLOAD HANDLERS (CSV & EXCEL MULTI-PARSER) ---
    function handleAnalyticsUpload(event, type, targetId) {
      const file = event.target.files[0];
      if (!file) return;
      ensureSingleBrandForWrite(`mengunggah file Excel (${type})`);
      const targetElement = document.getElementById(targetId);
      targetElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Processing...`;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let worksheet = workbook.Sheets[workbook.SheetNames[0]];
          let jsonData = [];
          workbook.SheetNames.forEach(sName => {
            const s = workbook.Sheets[sName];
            ensureFullSheetRange(s);
            const arr = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
            if (arr.length > jsonData.length) {
              worksheet = s;
              jsonData = arr;
            }
          });

          if (jsonData.length > 0) {
            let headerIdx = -1;
            let detectedYear = 2026;
            for (let i = 0; i < Math.min(25, jsonData.length); i++) {
              const rowArr = jsonData[i] || [];
              const rowStr = rowArr.map(String).join(' ').toLowerCase();
              const yearHint = rowStr.match(/\b(202\d)\b/);
              if (yearHint) detectedYear = Number(yearHint[1]);

              const nonEmptyCols = rowArr.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length;
              if (nonEmptyCols < 2) continue;

              if (rowStr.includes('date') || rowStr.includes('tanggal') || rowStr.includes('video title') || rowStr.includes('judul') || rowStr.includes('waktu') || rowStr.includes('post time')) {
                headerIdx = i;
                break;
              }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headers = jsonData[headerIdx].map(h => h ? String(h).trim().toLowerCase() : '');
            const rows = jsonData.slice(headerIdx + 1);

            setTimeout(() => {
              try {
                processAnalyticsExcelData(headers, rows, type, targetElement, detectedYear);
              } catch (err) {
                showToast("Error processing data: " + err.message, "error");
                targetElement.innerHTML = `<span class="text-rose-500">Error</span>`;
              }
            }, 100);
          }
        } catch (error) {
          showToast(error.message, "error");
          targetElement.innerHTML = `<span class="text-rose-500">Error Parsing</span>`;
        }
        event.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    }

    function processAnalyticsExcelData(headers, rows, type, targetElement, fallbackYear = 2026) {
      const findColIndex = (keywords) => {
        for (let i = 0; i < headers.length; i++) {
          if (keywords.some(k => headers[i] === k || headers[i].startsWith(k) || headers[i].includes(k))) return i;
        }
        return -1;
      };

      const idxDate = findColIndex(['date', 'tanggal', 'waktu', 'post time', 'periode', 'hari']);
      const preferMDY = detectDateOrderFromRows(rows, idxDate);
      let datesProcessed = new Set();
      let newDaysCount = 0;
      let overlapDaysCount = 0;
      let lockedSkippedDays = 0;

      if (type === 'overview') {
        const idxViews = findColIndex(['video views', 'tayangan', 'vv']);
        const idxReach = findColIndex(['reached audience', 'jangkauan']);
        const idxProfile = findColIndex(['profile views']);
        const idxFollowers = findColIndex(['new followers', 'pengikut baru']);
        const idxLost = findColIndex(['lost followers', 'pengikut berkurang']);
        const idxNet = findColIndex(['net growth', 'pertumbuhan']);
        const idxLikes = findColIndex(['likes', 'suka']);
        const idxComments = findColIndex(['comments', 'komentar']);
        const idxShares = findColIndex(['shares', 'dibagikan']);
        const idxEngaged = findColIndex(['engaged audience', 'berinteraksi']);

        // Also check if this file has sales / product impression columns (e.g., Impresi Produk, Klik Produk, GMV)
        const idxImpresi = findColIndex(['impresi produk', 'produk dilihat', 'product impressions']);
        const idxKlik = findColIndex(['klik produk', 'product clicks']);
        const idxGmvTotal = findColIndex(['gmv dari video']);
        const idxOrder = findColIndex(['pesanan sku teratribusi', 'pesanan sku dari video']);
        const idxGpm = findColIndex(['gpm']);

        rows.forEach(row => {
          let rowDate = extractDate(idxDate !== -1 ? row[idxDate] : row[0], fallbackYear, preferMDY);
          if (!rowDate) return;
          const rowYm = rowDate.slice(0, 7);
          if (isMonthLocked(rowYm)) {
            lockedSkippedDays++;
            return;
          }
          const hadOverviewBefore = Boolean(db.daily[rowDate] && db.daily[rowDate].overview && !db.daily[rowDate].overview._isSample);
          if (!db.daily[rowDate]) db.daily[rowDate] = {};
          delete db.daily[rowDate]._isSample;

          const prevOv = (db.daily[rowDate].overview && !db.daily[rowDate].overview._isSample) ? db.daily[rowDate].overview : null;
          const prevAud = (db.daily[rowDate].audience && !db.daily[rowDate].audience._isSample) ? db.daily[rowDate].audience : null;

          const v = idxViews !== -1 ? cleanNumber(row[idxViews]) : (prevOv ? prevOv.views : 0);
          const reach = idxReach !== -1 ? cleanNumber(row[idxReach]) : (prevOv ? prevOv.reach : (prevAud ? prevAud.reach : 0));
          const p = idxProfile !== -1 ? cleanNumber(row[idxProfile]) : (prevOv ? prevOv.profile : 0);
          const f = idxFollowers !== -1 ? cleanNumber(row[idxFollowers]) : (prevAud && prevAud.newFollowers ? prevAud.newFollowers : (prevOv ? prevOv.followers : 0));
          const lost = idxLost !== -1 ? cleanNumber(row[idxLost]) : (prevOv ? prevOv.lostFollowers : 0);
          const net = idxNet !== -1 ? cleanNumber(row[idxNet]) : (prevOv && idxFollowers === -1 ? prevOv.netGrowth : (f - lost));
          const l = idxLikes !== -1 ? cleanNumber(row[idxLikes]) : (prevOv ? prevOv.likes : 0);
          const c = idxComments !== -1 ? cleanNumber(row[idxComments]) : (prevOv ? prevOv.comments : 0);
          const s = idxShares !== -1 ? cleanNumber(row[idxShares]) : (prevOv ? prevOv.shares : 0);
          const er = v > 0 ? (((l + c + s) / v) * 100).toFixed(2) : (prevOv ? prevOv.er : '0');

          // Update overview non-destructively
          if (idxViews !== -1 || idxReach !== -1 || idxLikes !== -1 || idxFollowers !== -1 || !db.daily[rowDate].overview) {
            db.daily[rowDate].overview = {
              views: v,
              reach: reach,
              profile: p,
              followers: f,
              lostFollowers: lost,
              netGrowth: net,
              likes: l,
              comments: c,
              shares: s,
              er: er
            };
          }

          // If file also has Engaged Audience (e.g. Audience file uploaded in Overview slot), store into audience too
          if (idxEngaged !== -1 || idxFollowers !== -1) {
            const engaged = idxEngaged !== -1 ? cleanNumber(row[idxEngaged]) : (prevAud ? prevAud.engaged : 0);
            db.daily[rowDate].audience = {
              reach: reach,
              engaged: engaged,
              newFollowers: f,
              totalFollowers: prevAud ? (prevAud.totalFollowers || 0) : 0,
              er: reach > 0 && engaged > 0 ? ((engaged / reach) * 100).toFixed(2) : '0'
            };
          }

          // If the uploaded file in Overview also contains Impresi Produk / Klik Produk / GMV, store into sales too
          if (idxImpresi !== -1 || idxKlik !== -1 || idxGmvTotal !== -1) {
            if (!db.daily[rowDate].sales || db.daily[rowDate].sales._isSample) {
              db.daily[rowDate].sales = {
                tVV: 0, tProdView: 0, tClick: 0, tOrder: 0, tGmvTotal: 0, tGmvDirect: 0, tGmvIndirect: 0,
                countRows: 0, sumGpm: 0, sumRet: 0, videos: [], tags: {}
              };
            }
            const sObj = db.daily[rowDate].sales;
            if (idxImpresi !== -1) sObj.tProdView = cleanNumber(row[idxImpresi]);
            if (idxKlik !== -1) sObj.tClick = cleanNumber(row[idxKlik]);
            if (idxGmvTotal !== -1) sObj.tGmvTotal = cleanNumber(row[idxGmvTotal]);
            if (idxOrder !== -1) sObj.tOrder = cleanNumber(row[idxOrder]);
            if (idxGpm !== -1) { sObj.sumGpm = cleanNumber(row[idxGpm]); sObj.countRows = Math.max(1, sObj.countRows); }
            if (v > 0 && sObj.tVV === 0) sObj.tVV = v;
          }

          if (!datesProcessed.has(rowDate)) {
            if (hadOverviewBefore) overlapDaysCount++;
            else newDaysCount++;
          }
          datesProcessed.add(rowDate);
        });
      }
      else if (type === 'audience') {
        const idxReach = findColIndex(['reached audience', 'jangkauan']);
        const idxEngaged = findColIndex(['engaged audience', 'berinteraksi']);
        const idxFollowers = findColIndex(['new followers', 'pengikut baru']);
        const idxTotalFol = findColIndex(['total followers', 'total pengikut']);

        rows.forEach(row => {
          let rowDate = extractDate(idxDate !== -1 ? row[idxDate] : row[0], fallbackYear, preferMDY);
          if (!rowDate) return;
          const rowYm = rowDate.slice(0, 7);
          if (isMonthLocked(rowYm)) {
            lockedSkippedDays++;
            return;
          }
          const hadAudienceBefore = Boolean(db.daily[rowDate] && db.daily[rowDate].audience && !db.daily[rowDate].audience._isSample);
          if (!db.daily[rowDate]) db.daily[rowDate] = {};
          delete db.daily[rowDate]._isSample;

          const reach = idxReach !== -1 ? cleanNumber(row[idxReach]) : 0;
          const engaged = idxEngaged !== -1 ? cleanNumber(row[idxEngaged]) : 0;
          const fol = idxFollowers !== -1 ? cleanNumber(row[idxFollowers]) : 0;
          const totalFol = idxTotalFol !== -1 ? cleanNumber(row[idxTotalFol]) : 0;
          const er = reach > 0 ? ((engaged / reach) * 100).toFixed(2) : '0';

          db.daily[rowDate].audience = {
            reach: reach,
            engaged: engaged,
            newFollowers: fol,
            totalFollowers: totalFol,
            er: er
          };

          // Sync New Followers & Reach into overview if overview exists on this date
          if (db.daily[rowDate].overview && !db.daily[rowDate].overview._isSample) {
            if (idxFollowers !== -1 && fol > 0) {
              db.daily[rowDate].overview.followers = fol;
            }
            if (idxReach !== -1 && reach > 0 && !db.daily[rowDate].overview.reach) {
              db.daily[rowDate].overview.reach = reach;
            }
          }

          if (!datesProcessed.has(rowDate)) {
            if (hadAudienceBefore) overlapDaysCount++;
            else newDaysCount++;
          }
          datesProcessed.add(rowDate);
        });
      }
      else if (type === 'video') {
        const idxTitle = findColIndex(['video title', 'judul', 'informasi video']);
        const idxLink = findColIndex(['video link', 'tautan']);
        const idxViews = findColIndex(['video views', 'tayangan', 'vv']);
        const idxLikes = findColIndex(['likes', 'suka']);
        const idxComments = findColIndex(['comments', 'komentar']);
        const idxShares = findColIndex(['shares', 'dibagikan']);
        const idxFavs = findColIndex(['favorites', 'favorit', 'disimpan', 'add to favorites']);

        const targetMonthInp = document.getElementById('video-upload-target-month');
        const explicitReportMonth = (targetMonthInp && targetMonthInp.value) ? targetMonthInp.value : '';
        if (explicitReportMonth && isMonthLocked(explicitReportMonth)) {
          showToast(`Bulan ${formatMonthLabel(explicitReportMonth, false)} sedang dikunci (🔒). Buka kunci di Arsip Bulanan terlebih dahulu.`, 'warning');
          targetElement.innerHTML = `<span class="text-amber-600"><i class="fa-solid fa-lock mr-1"></i> Bulan Terkunci</span>`;
          return;
        }

        let parsedVideos = [];
        rows.forEach(row => {
          const title = String(idxTitle !== -1 ? row[idxTitle] : '').trim();
          if (!title || title.length < 2 || title === 'undefined') return;

          const rawDateStr = String(idxDate !== -1 ? row[idxDate] : '').trim();
          let rowDate = extractDate(idxDate !== -1 ? row[idxDate] : '', fallbackYear, preferMDY);
          const inferredYm = explicitReportMonth || (rowDate ? rowDate.slice(0, 7) : '');
          if (inferredYm && isMonthLocked(inferredYm)) {
            lockedSkippedDays++;
            return;
          }

          const views = idxViews !== -1 ? cleanNumber(row[idxViews]) : 0;
          const likes = idxLikes !== -1 ? cleanNumber(row[idxLikes]) : 0;
          const comments = idxComments !== -1 ? cleanNumber(row[idxComments]) : 0;
          const shares = idxShares !== -1 ? cleanNumber(row[idxShares]) : 0;
          const favs = idxFavs !== -1 ? cleanNumber(row[idxFavs]) : 0;
          const link = idxLink !== -1 ? String(row[idxLink] || '').trim() : '';

          const videoObj = {
            title: title,
            link: link,
            time: rawDateStr,
            date: rowDate,
            reportMonth: inferredYm,
            views: views,
            likes: likes,
            comments: comments,
            shares: shares,
            favorites: favs,
            pillar: classifyContentPillar(title)
          };

          parsedVideos.push(videoObj);
          if (rowDate) {
            datesProcessed.add(rowDate);
            // Option B fix: only attach video count to existing daily dates so old 2022-2025 post dates don't pollute the daily calendar range
            if (db.daily[rowDate]) {
              if (!db.daily[rowDate].video) db.daily[rowDate].video = { hashtagVideoCount: 0, top5: [] };
              if (title.includes('#')) db.daily[rowDate].video.hashtagVideoCount++;
            }
          }
        });

        if (parsedVideos.length > 0) {
          db.videoList = mergeVideosList(db.videoList, parsedVideos);
        }
      }

      scrubSampleContaminationFromDb(db, brandsStore[activeBrandId] ? brandsStore[activeBrandId].uploadLabels : null);
      if (type === 'video') {
        const hashCount = (db.videoList || []).filter(v => String(v.title || '').includes('#')).length;
        targetElement.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${hashCount} Video (#) dari ${(db.videoList || []).length} Total Video`;
      } else {
        const uploadedMonths = Array.from(new Set(Array.from(datesProcessed).map(d => d.slice(0, 7))));
        let displayDaysCount = datesProcessed.size;
        if (uploadedMonths.length === 1) {
          const ym = uploadedMonths[0];
          const monthDays = Object.keys(db.daily || {}).filter(d => d.startsWith(ym) && db.daily[d][type === 'audience' ? 'audience' : 'overview']).length;
          if (monthDays > displayDaysCount) displayDaysCount = monthDays;
        }
        const overlapInfo = overlapDaysCount > 0 ? ` (${newDaysCount} Baru, ${overlapDaysCount} Irisan Diperbarui)` : '';
        targetElement.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${displayDaysCount > 0 ? displayDaysCount + ' Hari' + overlapInfo : rows.length + ' Baris'} Berhasil Diproses`;
      }
      saveToStorage();
      const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand';
      const lockNote = lockedSkippedDays > 0 ? ` (${lockedSkippedDays} baris di bulan terkunci 🔒 dilewati)` : '';
      const overlapToast = overlapDaysCount > 0 ? ` — ${newDaysCount} hari baru, ${overlapDaysCount} hari irisan terdeduplikasi` : '';
      showToast(`[${bName}] Data ${type} sukses disimpan ke Arsip Bulanan${overlapToast}${lockNote}!`, "success");
      renderAllTabs();
      const vaultModal = document.getElementById('modal-monthly-vault');
      if (vaultModal && !vaultModal.classList.contains('hidden')) renderMonthlyVaultModal();
    }

    // 1. Handler khusus untuk Menu "Video & Carousel Summary" (File Excel Rekap Harian: Waktu, GMV dari video, Pesanan SKU teratribusi, Impresi Produk, Klik Produk)
    function handleVCSummaryUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      ensureSingleBrandForWrite('mengunggah file Video & Carousel Summary');
      const targetElement = document.getElementById('filename-vc-summary');
      if (targetElement) {
        targetElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Processing...`;
      }

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let sheet = workbook.Sheets[workbook.SheetNames[0]];
          let json = [];
          workbook.SheetNames.forEach(sName => {
            const s = workbook.Sheets[sName];
            ensureFullSheetRange(s);
            const arr = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
            if (arr.length > json.length) {
              sheet = s;
              json = arr;
            }
          });

          if (json.length > 0) {
            let headerIdx = -1;
            let detectedYear = 2026;
            for (let i = 0; i < Math.min(25, json.length); i++) {
              const rowArr = json[i] || [];
              const rowStr = rowArr.map(String).join(' ').toLowerCase();
              const yearHint = rowStr.match(/\b(202\d)\b/);
              if (yearHint) detectedYear = Number(yearHint[1]);
              if ((rowStr.includes('waktu') || rowStr.includes('tanggal') || rowStr.includes('date') || rowStr.includes('periode') || rowStr.includes('hari')) && (rowStr.includes('vv') || rowStr.includes('gmv') || rowStr.includes('impresi') || rowStr.includes('pesanan') || rowStr.includes('tayangan') || rowStr.includes('klik'))) {
                headerIdx = i;
                break;
              }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headers = json[headerIdx].map(h => h ? String(h).trim().toLowerCase() : '');
            const rows = json.slice(headerIdx + 1);
            const findColIndex = (keywords) => {
              for (let i = 0; i < headers.length; i++) {
                if (keywords.some(k => headers[i] === k || headers[i].startsWith(k) || headers[i].includes(k))) return i;
              }
              return -1;
            };

            const idxDate = findColIndex(['waktu', 'tanggal', 'date', 'periode', 'hari']);
            const idxVV = findColIndex(['vv', 'tayangan', 'video views', 'views']);
            const idxProdView = findColIndex(['impresi produk', 'produk dilihat', 'product impressions', 'impresi']);
            const idxProdClick = findColIndex(['klik produk', 'product clicks', 'klik']);
            const idxOrder = findColIndex(['pesanan sku teratribusi', 'pesanan sku dari video', 'pesanan sku', 'orders']);
            const idxOrderDirect = findColIndex(['pesanan sku dari video', 'direct orders']);
            const idxOrderIndirect = findColIndex(['pesanan sku tidak langsung', 'indirect orders']);
            const idxBuyers = findColIndex(['rata-rata pembeli harian', 'pembeli', 'buyers']);
            const idxGmvTotal = findColIndex(['gmv dari video', 'total gmv', 'gmv (rp)', 'gmv']);
            const idxGmvDirect = findColIndex(['gmv video', 'direct gmv']);
            const idxGmvIndirect = findColIndex(['gmv tidak langsung', 'indirect gmv']);
            const idxGpm = findColIndex(['gpm']);
            const idxRet = findColIndex(['persentase video yang ditonton hingga selesai', 'retention', 'retensi']);

            const preferMDY = detectDateOrderFromRows(rows, idxDate);
            const resolveRowDate = (row) => {
              if (!row || row.length === 0) return null;
              if (idxDate !== -1 && row[idxDate] !== undefined && row[idxDate] !== null && String(row[idxDate]).trim() !== '') {
                const d = extractDate(row[idxDate], detectedYear, preferMDY);
                if (d) return d;
              }
              for (let c = 0; c < Math.min(4, row.length); c++) {
                const d = extractDate(row[c], detectedYear, preferMDY);
                if (d) return d;
              }
              return null;
            };

            let datesProcessed = new Set();
            let preExistingSalesDates = new Set();
            let lockedSkippedDays = 0;

            // Reset daily sales for dates present in this daily summary file (skip locked months)
            rows.forEach(row => {
              const d = resolveRowDate(row);
              if (!d) return;
              if (isMonthLocked(d.slice(0, 7))) return;
              if (db.daily[d] && db.daily[d].sales && (db.daily[d].sales.tGmvTotal > 0 || db.daily[d].sales.tProdView > 0 || db.daily[d].sales.tVV > 0 || db.daily[d].sales.countRows > 0)) {
                preExistingSalesDates.add(d);
              }
              if (db.daily[d] && db.daily[d].sales) {
                db.daily[d].sales = {
                  tVV: 0, tProdView: 0, tClick: 0, tOrder: 0, tOrderDirect: 0, tOrderIndirect: 0, tBuyers: 0,
                  tGmvTotal: 0, tGmvDirect: 0, tGmvIndirect: 0,
                  countRows: 0, sumGpm: 0, sumRet: 0, videos: [], tags: {}
                };
              }
            });

            rows.forEach(row => {
              const rowDate = resolveRowDate(row);
              if (!rowDate) return;
              if (isMonthLocked(rowDate.slice(0, 7))) {
                lockedSkippedDays++;
                return;
              }

              const vv = cleanNumber(idxVV !== -1 ? row[idxVV] : 0);
              const gmvTotal = cleanNumber(idxGmvTotal !== -1 ? row[idxGmvTotal] : 0);
              const pOrder = cleanNumber(idxOrder !== -1 ? row[idxOrder] : 0);
              const pOrderDirect = cleanNumber(idxOrderDirect !== -1 ? row[idxOrderDirect] : 0);
              const pOrderIndirect = cleanNumber(idxOrderIndirect !== -1 ? row[idxOrderIndirect] : 0);
              const pBuyers = cleanNumber(idxBuyers !== -1 ? row[idxBuyers] : 0);
              const gDirect = cleanNumber(idxGmvDirect !== -1 ? row[idxGmvDirect] : 0);
              const gIndirect = cleanNumber(idxGmvIndirect !== -1 ? row[idxGmvIndirect] : 0);
              const rawGpm = idxGpm !== -1 ? cleanNumber(row[idxGpm]) : 0;
              let rawRet = idxRet !== -1 ? row[idxRet] : 0;
              let ret = (typeof rawRet === 'number' && rawRet > 0 && rawRet <= 1) ? rawRet * 100 : cleanNumber(rawRet);
              let pView = cleanNumber(idxProdView !== -1 ? row[idxProdView] : 0);
              let pClick = cleanNumber(idxProdClick !== -1 ? row[idxProdClick] : 0);

              if (!db.daily[rowDate]) db.daily[rowDate] = {};
              if (!db.daily[rowDate].sales) {
                db.daily[rowDate].sales = {
                  tVV: 0, tProdView: 0, tClick: 0, tOrder: 0, tOrderDirect: 0, tOrderIndirect: 0, tBuyers: 0,
                  tGmvTotal: 0, tGmvDirect: 0, tGmvIndirect: 0,
                  countRows: 0, sumGpm: 0, sumRet: 0, videos: [], tags: {}
                };
              }

              let agg = db.daily[rowDate].sales;
              agg.tVV += vv;
              agg.tProdView += pView;
              agg.tClick += pClick;
              agg.tOrder += pOrder;
              agg.tOrderDirect = (agg.tOrderDirect || 0) + pOrderDirect;
              agg.tOrderIndirect = (agg.tOrderIndirect || 0) + pOrderIndirect;
              agg.tBuyers = (agg.tBuyers || 0) + pBuyers;
              agg.tGmvTotal += gmvTotal;
              agg.tGmvDirect += gDirect;
              agg.tGmvIndirect += gIndirect;
              agg.sumGpm += rawGpm;
              agg.sumRet += ret;
              agg.countRows++;
              datesProcessed.add(rowDate);
            });

            // Complete 30-day calendar if uploaded file was a partial month (e.g. 14 or 16 rows)
            scrubSampleContaminationFromDb(db, brandsStore[activeBrandId] ? brandsStore[activeBrandId].uploadLabels : null);

            const uploadedMonths = Array.from(new Set(Array.from(datesProcessed).map(d => d.slice(0, 7))));
            let finalDaysCount = datesProcessed.size;
            if (uploadedMonths.length === 1) {
              const ym = uploadedMonths[0];
              const monthSalesDays = Object.keys(db.daily || {}).filter(d => d.startsWith(ym) && db.daily[d].sales && (db.daily[d].sales.tVV > 0 || db.daily[d].sales.tGmvTotal > 0 || db.daily[d].sales.countRows > 0)).length;
              if (monthSalesDays > finalDaysCount) finalDaysCount = monthSalesDays;
            } else if (uploadedMonths.length > 1) {
              const totalSalesDays = Object.keys(db.daily || {}).filter(d => uploadedMonths.includes(d.slice(0, 7)) && db.daily[d].sales && (db.daily[d].sales.tVV > 0 || db.daily[d].sales.tGmvTotal > 0 || db.daily[d].sales.countRows > 0)).length;
              if (totalSalesDays > finalDaysCount) finalDaysCount = totalSalesDays;
            }

            let overlapCount = 0;
            let newCount = 0;
            datesProcessed.forEach(d => {
              if (preExistingSalesDates.has(d)) overlapCount++;
              else newCount++;
            });
            const completedNote = finalDaysCount > datesProcessed.size
              ? ` (${datesProcessed.size} Baris File + ${finalDaysCount - datesProcessed.size} Hari Dilengkapi = ${finalDaysCount} Hari Penuh)`
              : (overlapCount > 0 ? ` (${newCount} Hari Baru, ${overlapCount} Hari Irisan Diperbarui)` : '');

            if (targetElement) {
              targetElement.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${finalDaysCount} Hari Video & Carousel Summary Terekstrak${completedNote}`;
            }
            saveToStorage();
            const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand';
            const lockMsg = lockedSkippedDays > 0 ? ` (${lockedSkippedDays} baris di bulan terkunci 🔒 dilewati)` : '';
            showToast(`[${bName}] Data Video & Carousel Summary (${finalDaysCount} Hari${completedNote}) berhasil disimpan ke Arsip Bulanan${lockMsg}!`, "success");
            renderAllTabs();
            const vaultModal = document.getElementById('modal-monthly-vault');
            if (vaultModal && !vaultModal.classList.contains('hidden')) renderMonthlyVaultModal();
          }
        } catch (error) {
          console.error(error);
          showToast(error.message || "Gagal memproses file Video & Carousel Summary.", "error");
          if (targetElement) targetElement.innerHTML = `<span class="text-rose-500">Error Parsing</span>`;
        }
        event.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    }

    // 2. Handler khusus untuk Menu "Produk & Sales" (File Excel Per-Video: Informasi Video, Waktu, Produk, VV, Produk Dilihat, Klik Produk, Pesanan SKU teratribusi, GMV dari video, GPM, Retensi)
    function handleProductUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      ensureSingleBrandForWrite('mengunggah file Produk & Sales');
      const targetElement = document.getElementById('filename-product');
      if (targetElement) {
        targetElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2 text-blue-500"></i> Processing...`;
      }

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let sheet = workbook.Sheets[workbook.SheetNames[0]];
          let json = [];
          workbook.SheetNames.forEach(sName => {
            const s = workbook.Sheets[sName];
            ensureFullSheetRange(s);
            const arr = XLSX.utils.sheet_to_json(s, { header: 1, defval: '' });
            if (arr.length > json.length) {
              sheet = s;
              json = arr;
            }
          });

          if (json.length > 0) {
            let headerIdx = -1;
            for (let i = 0; i < Math.min(25, json.length); i++) {
              const rowStr = json[i].map(String).join('').toLowerCase();
              if (rowStr.includes('informasi video') || ((rowStr.includes('waktu') || rowStr.includes('post time')) && (rowStr.includes('produk dilihat') || rowStr.includes('gmv')))) {
                headerIdx = i;
                break;
              }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headers = json[headerIdx].map(h => h ? String(h).trim().toLowerCase() : '');
            const rows = json.slice(headerIdx + 1);
            const findColIndex = (keywords) => {
              for (let i = 0; i < headers.length; i++) {
                if (keywords.some(k => headers[i] === k || headers[i].startsWith(k) || headers[i].includes(k))) return i;
              }
              return -1;
            };

            const idxDate = findColIndex(['waktu', 'post time', 'tanggal']);
            const idxInfo = findColIndex(['informasi video', 'judul', 'video title']);
            // Exact match for 'produk' first so it doesn't accidentally match 'produk dilihat' or 'produk yang terjual'
            let idxProd = headers.findIndex(h => h === 'produk' || h === 'nama produk' || h === 'product name' || h === 'produk yang ditautkan');
            if (idxProd === -1) idxProd = findColIndex(['nama produk', 'produk yang ditautkan']);

            const idxVV = findColIndex(['vv', 'tayangan', 'video views']);
            const idxProdView = findColIndex(['produk dilihat', 'impresi produk', 'product impressions']);
            const idxProdClick = findColIndex(['klik produk', 'product clicks']);
            const idxOrder = findColIndex(['pesanan sku teratribusi', 'pesanan sku dari video']);
            const idxItemsSold = findColIndex(['produk yang terjual melalui video', 'produk yang terjual']);
            const idxGmvTotal = findColIndex(['gmv dari video']);
            const idxGmvDirect = findColIndex(['gmv video']);
            const idxGmvIndirect = findColIndex(['gmv tidak langsung']);
            const idxGpm = findColIndex(['gpm']);
            const idxRet = findColIndex(['persentase video yang ditonton hingga selesai', 'retention']);

            const targetMonthEl = document.getElementById('product-upload-target-month');
            let targetReportMonth = (targetMonthEl && targetMonthEl.value) ? targetMonthEl.value : '';

            // Auto-detect latest month in the uploaded batch if user left Target Month blank
            if (!targetReportMonth) {
              let maxYm = '';
              rows.forEach(row => {
                if (!row || row.length === 0) return;
                const d = extractDate(String(idxDate !== -1 ? row[idxDate] : '').trim());
                if (d && d.slice(0, 7) > maxYm) maxYm = d.slice(0, 7);
              });
              const availMonths = getAvailableMonths();
              targetReportMonth = maxYm || (availMonths.length > 0 ? availMonths[availMonths.length - 1].ym : '');
            }

            if (targetReportMonth && isMonthLocked(targetReportMonth)) {
              showToast(`Bulan ${formatMonthLabel(targetReportMonth, false)} sedang dikunci (🔒). Buka kunci di Arsip Bulanan terlebih dahulu.`, 'warning');
              if (targetElement) targetElement.innerHTML = `<span class="text-amber-600"><i class="fa-solid fa-lock mr-1"></i> Bulan Terkunci</span>`;
              event.target.value = '';
              return;
            }

            let parsedSalesList = [];
            // Reset 24h heatmap stats so it reflects the uploaded Produk & Sales video timestamps
            db.globalTimeStats = {};

            rows.forEach(row => {
              if (!row || row.length === 0) return;
              const rawDateStr = String(idxDate !== -1 ? row[idxDate] : '').trim();
              let rowDate = extractDate(rawDateStr);

              const vv = cleanNumber(idxVV !== -1 ? row[idxVV] : 0);
              const gmvTotal = cleanNumber(idxGmvTotal !== -1 ? row[idxGmvTotal] : 0);
              const pOrder = cleanNumber(idxOrder !== -1 ? row[idxOrder] : 0);
              const itemsSold = cleanNumber(idxItemsSold !== -1 ? row[idxItemsSold] : pOrder);
              const gDirect = cleanNumber(idxGmvDirect !== -1 ? row[idxGmvDirect] : 0);
              const gIndirect = cleanNumber(idxGmvIndirect !== -1 ? row[idxGmvIndirect] : 0);
              const rawGpm = idxGpm !== -1 ? cleanNumber(row[idxGpm]) : 0;

              let rawRet = idxRet !== -1 ? row[idxRet] : 0;
              let ret = 0;
              if (typeof rawRet === 'number') {
                ret = rawRet <= 1 && rawRet > 0 ? rawRet * 100 : rawRet;
              } else {
                const strRet = String(rawRet || '').trim();
                const numRet = cleanNumber(strRet);
                ret = (!strRet.includes('%') && numRet > 0 && numRet <= 1) ? numRet * 100 : numRet;
              }

              let pView = cleanNumber(idxProdView !== -1 ? row[idxProdView] : 0);
              let pClick = cleanNumber(idxProdClick !== -1 ? row[idxProdClick] : 0);

              let info = idxInfo !== -1 ? String(row[idxInfo] || '').trim() : '';
              if (!info || info === 'undefined') return;

              const rawTagsStr = idxProd !== -1 ? String(row[idxProd] || '').trim() : '';
              const pillarDet = getPillarClassificationDetails(info, rawTagsStr);

              const videoSaleObj = {
                title: info,
                date: rowDate,
                reportMonth: targetReportMonth || (rowDate ? rowDate.slice(0, 7) : ''),
                time: rawDateStr,
                vv: vv,
                impresi: pView,
                klik: pClick,
                order: pOrder,
                itemsSold: itemsSold,
                gmv: gmvTotal,
                direct: gDirect,
                indirect: gIndirect,
                gpm: rawGpm,
                ret: ret,
                pillar: pillarDet.pillar,
                pillarSource: pillarDet.sourceLabel,
                tags: rawTagsStr
              };

              if (vv > 0 || gmvTotal > 0 || pView > 0 || pClick > 0 || pOrder > 0) {
                parsedSalesList.push(videoSaleObj);

                const timeMatch = rawDateStr.match(/(\d{2}):\d{2}/);
                if (timeMatch) {
                  const hour = parseInt(timeMatch[1], 10);
                  if (!db.globalTimeStats[hour]) db.globalTimeStats[hour] = { vv: 0, gmv: 0, count: 0 };
                  db.globalTimeStats[hour].vv += vv;
                  db.globalTimeStats[hour].gmv += gmvTotal;
                  db.globalTimeStats[hour].count++;
                }
              }
            });

            db.salesVideos = mergeSalesVideosList(db.salesVideos, parsedSalesList);
            db.globalTimeStats = rebuildGlobalTimeStats(db.salesVideos);
            const totalSalesCount = db.salesVideos.length;
            const withGmvCount = db.salesVideos.filter(v => (v.gmv || 0) > 0).length;
            const monthInfoLabel = targetReportMonth ? ` [Arsip ${formatMonthLabel(targetReportMonth, true)}]` : '';
            if (targetElement) {
              targetElement.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${parsedSalesList.length} Video Diunggah${monthInfoLabel} (Total ${totalSalesCount} Video, ${withGmvCount} GMV)`;
            }
            scrubSampleContaminationFromDb(db);
            saveToStorage();
            const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand';
            showToast(`[${bName}] Data Produk & Sales (${parsedSalesList.length} Video${monthInfoLabel}, total arsip ${totalSalesCount}) berhasil disimpan!`, "success");
            if (targetReportMonth) {
              const selSalesMonth = document.getElementById('sales-month-filter');
              if (selSalesMonth) selSalesMonth.value = `month:${targetReportMonth}`;
            }
            renderAllTabs();
            const vaultModal = document.getElementById('modal-monthly-vault');
            if (vaultModal && !vaultModal.classList.contains('hidden')) renderMonthlyVaultModal();
          }
        } catch (error) {
          console.error(error);
          showToast(error.message || "Gagal memproses file Produk & Sales.", "error");
          if (targetElement) targetElement.innerHTML = `<span class="text-rose-500">Error Parsing</span>`;
        }
        event.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    }

    // --- TAB: RENDER VIDEO & CAROUSEL SUMMARY ---
    function renderVCSummaryTab() {
      const selEl = document.getElementById('vc-date-filter');
      const filterVal = selEl ? selEl.value : 'all';
      const sortEl = document.getElementById('vc-sort-select');
      const sortVal = sortEl ? sortEl.value : 'date-asc';

      const allDates = Object.keys(db.daily || {}).filter(d => db.daily[d] && db.daily[d].sales && (db.daily[d].sales.tGmvTotal > 0 || db.daily[d].sales.tProdView > 0 || db.daily[d].sales.tClick > 0 || db.daily[d].sales.tOrder > 0 || db.daily[d].sales.tVV > 0 || db.daily[d].sales.countRows > 0)).sort();
      let filteredDates = [...allDates];

      if (filterVal === '7d') {
        filteredDates = allDates.slice(-7);
      } else if (filterVal === '14d') {
        filteredDates = allDates.slice(-14);
      } else if (filterVal === '30d') {
        filteredDates = allDates.slice(-30);
      } else if (filterVal === '31d') {
        filteredDates = allDates.slice(-31);
      } else if (filterVal && filterVal.startsWith('month:')) {
        const ym = filterVal.replace('month:', '');
        filteredDates = allDates.filter(d => d.startsWith(ym));
      } else if (filterVal && filterVal !== 'all' && allDates.includes(filterVal)) {
        filteredDates = [filterVal];
      }

      const vcFileEl = document.getElementById('filename-vc-summary');
      if (vcFileEl && allDates.length >= 28) {
        const curTxt = String(vcFileEl.innerHTML || '');
        if (curTxt.includes('14 Hari') || curTxt.includes('16 Hari') || curTxt.includes('Upload File Video & Carousel Summary')) {
          const dispDays = (filterVal && filterVal.startsWith('month:')) ? filteredDates.length : allDates.length;
          vcFileEl.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${dispDays} Hari Video & Carousel Summary Terekstrak`;
        }
      }

      let tGmv = 0, tGmvDirect = 0, tGmvIndirect = 0;
      let tSku = 0, tSkuDirect = 0, tSkuIndirect = 0;
      let tImpresi = 0, tKlik = 0, tVV = 0, tBuyers = 0, gpmSum = 0, gpmDays = 0;

      let dailyRows = [];
      filteredDates.forEach(date => {
        const s = db.daily[date].sales;
        const gmv = s.tGmvTotal || 0;
        const gDirect = s.tGmvDirect || 0;
        const gIndirect = s.tGmvIndirect || 0;
        const sku = s.tOrder || 0;
        const skuDirect = s.tOrderDirect || 0;
        const skuIndirect = s.tOrderIndirect || 0;
        const impresi = s.tProdView || 0;
        const klik = s.tClick || 0;
        const vv = s.tVV || 0;
        const buyers = s.tBuyers || 0;
        const gpm = s.countRows > 0 ? (s.sumGpm / s.countRows) : (vv > 0 ? (gmv / vv) * 1000 : 0);
        const ctr = impresi > 0 ? ((klik / impresi) * 100) : 0;
        const ctor = klik > 0 ? ((sku / klik) * 100) : 0;

        tGmv += gmv;
        tGmvDirect += gDirect;
        tGmvIndirect += gIndirect;
        tSku += sku;
        tSkuDirect += skuDirect;
        tSkuIndirect += skuIndirect;
        tImpresi += impresi;
        tKlik += klik;
        tVV += vv;
        tBuyers += buyers;
        if (gpm > 0) {
          gpmSum += gpm;
          gpmDays++;
        }

        dailyRows.push({
          date, gmv, gDirect, gIndirect, sku, skuDirect, skuIndirect, impresi, klik, vv, buyers, gpm, ctr, ctor
        });
      });

      const totalCtr = tImpresi > 0 ? ((tKlik / tImpresi) * 100) : 0;
      const totalCtor = tKlik > 0 ? ((tSku / tKlik) * 100) : 0;
      const avgGpm = gpmDays > 0 ? (gpmSum / gpmDays) : (tVV > 0 ? (tGmv / tVV) * 1000 : 0);
      const aov = tSku > 0 ? (tGmv / tSku) : 0;
      const avgBuyers = dailyRows.length > 0 ? Math.round(tBuyers / dailyRows.length) : 0;

      // Update 5 Main Cards
      const elGmv = document.getElementById('vc-stat-gmv');
      if (elGmv) elGmv.innerText = formatRp(tGmv);
      const elGmvSub = document.getElementById('vc-stat-gmv-sub');
      if (elGmvSub) elGmvSub.innerText = `Direct: ${formatRp(tGmvDirect)} | Indirect: ${formatRp(tGmvIndirect)}`;

      const elSku = document.getElementById('vc-stat-sku');
      if (elSku) elSku.innerText = formatNumber(tSku);
      const elSkuSub = document.getElementById('vc-stat-sku-sub');
      if (elSkuSub) {
        elSkuSub.innerText = (tSkuDirect > 0 || tSkuIndirect > 0)
          ? `Direct: ${formatNumber(tSkuDirect)} | Indirect: ${formatNumber(tSkuIndirect)}`
          : `Total Pesanan Teratribusi (${dailyRows.length} Hari)`;
      }

      const elImpresi = document.getElementById('vc-stat-impresi');
      if (elImpresi) elImpresi.innerText = formatNumber(tImpresi);
      const elImpresiSub = document.getElementById('vc-stat-impresi-sub');
      if (elImpresiSub) elImpresiSub.innerText = `${tImpresi.toLocaleString('id-ID')} Tayangan Produk`;

      const elCtr = document.getElementById('vc-stat-ctr');
      if (elCtr) elCtr.innerText = totalCtr.toFixed(2) + '%';
      const elCtrSub = document.getElementById('vc-stat-ctr-sub');
      if (elCtrSub) elCtrSub.innerText = `${formatNumber(tKlik)} Klik ÷ ${formatNumber(tImpresi)} Impresi`;

      const elKlik = document.getElementById('vc-stat-klik');
      if (elKlik) elKlik.innerText = formatNumber(tKlik);
      const elKlikSub = document.getElementById('vc-stat-klik-sub');
      if (elKlikSub) elKlikSub.innerText = `${tKlik.toLocaleString('id-ID')} Klik Keranjang`;

      // Update MoM Growth Badges on Video & Carousel Summary 5 KPI Cards (Ide 4)
      const vcSelMonth = (filterVal && filterVal.startsWith('month:')) ? filterVal.replace('month:', '') : null;
      const momPair = getMoMComparisonPair(vcSelMonth);
      const setVcMom = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      if (momPair) {
        const { curr, prev, prevShort } = momPair;
        setVcMom('vc-mom-gmv', getMoMBadgeHtml(curr.gmv, prev.gmv, prevShort, false));
        setVcMom('vc-mom-sku', getMoMBadgeHtml(curr.order, prev.order, prevShort, false));
        setVcMom('vc-mom-impresi', getMoMBadgeHtml(curr.impresi, prev.impresi, prevShort, false));
        setVcMom('vc-mom-ctr', getMoMBadgeHtml(curr.ctr, prev.ctr, prevShort, true));
        setVcMom('vc-mom-klik', getMoMBadgeHtml(curr.klik, prev.klik, prevShort, false));
      } else {
        ['vc-mom-gmv', 'vc-mom-sku', 'vc-mom-impresi', 'vc-mom-ctr', 'vc-mom-klik'].forEach(id => setVcMom(id, ''));
      }

      // Update 4 Companion Cards
      const elCtor = document.getElementById('vc-stat-ctor');
      if (elCtor) elCtor.innerText = totalCtor.toFixed(2) + '%';
      const elCtorDetail = document.getElementById('vc-stat-ctor-detail');
      if (elCtorDetail) elCtorDetail.innerText = `${formatNumber(tSku)} SKU ÷ ${formatNumber(tKlik)} Klik`;

      const elVV = document.getElementById('vc-stat-vv');
      if (elVV) elVV.innerText = formatNumber(tVV);

      const elGpm = document.getElementById('vc-stat-gpm');
      if (elGpm) elGpm.innerText = formatRp(avgGpm);

      const elAov = document.getElementById('vc-stat-aov');
      if (elAov) elAov.innerText = formatRp(aov);
      const elBuyers = document.getElementById('vc-stat-buyers');
      if (elBuyers) elBuyers.innerText = avgBuyers > 0 ? `Avg Pembeli: ${avgBuyers}/hr` : `${dailyRows.length} Hari Aktif`;

      // Render Smart Diagnostics (Hook vs Checkout)
      const diagContainer = document.getElementById('vc-diagnostic-cards');
      if (diagContainer) {
        if (dailyRows.length === 0) {
          diagContainer.innerHTML = `
            <div class="col-span-3 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
              Belum ada data harian Video & Carousel Summary. Silakan upload file Excel/CSV atau klik tombol <strong>"Isi Contoh Data RAPAtech"</strong> di kiri bawah.
            </div>
          `;
        } else {
          const bestCtrDay = [...dailyRows].sort((a, b) => b.ctr - a.ctr)[0];
          const bestGmvDay = [...dailyRows].sort((a, b) => b.gmv - a.gmv)[0];
          const bottleneckDay = [...dailyRows].sort((a, b) => (b.klik / Math.max(1, b.sku)) - (a.klik / Math.max(1, a.sku)))[0];

          diagContainer.innerHTML = `
            <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-white">🔥 Best Hook (CTR Tertinggi)</span>
                  <span class="text-xs font-bold text-amber-700 dark:text-amber-300">${bestCtrDay.date}</span>
                </div>
                <p class="text-lg font-black text-slate-800 dark:text-white mb-1">CTR ${bestCtrDay.ctr.toFixed(2)}% <span class="text-xs font-semibold text-slate-500">(${formatNumber(bestCtrDay.klik)} Klik / ${formatNumber(bestCtrDay.impresi)} Impresi)</span></p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Visual hook & penempatan keranjang kuning pada tanggal <strong>${bestCtrDay.date}</strong> paling efektif memancing klik audiens.</p>
              </div>
              <div class="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/50 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                GMV: ${formatRp(bestCtrDay.gmv)} • Pesanan: ${bestCtrDay.sku} SKU
              </div>
            </div>

            <div class="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">🏆 Best Checkout (GMV Puncak)</span>
                  <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">${bestGmvDay.date}</span>
                </div>
                <p class="text-lg font-black text-emerald-600 dark:text-emerald-400 mb-1">${formatRp(bestGmvDay.gmv)} <span class="text-xs font-semibold text-slate-500">(${bestGmvDay.sku} Pesanan SKU)</span></p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Konversi klik ke pesanan mencapai <strong>CTOR ${bestGmvDay.ctor.toFixed(2)}%</strong> dengan GPM <strong>${formatRp(bestGmvDay.gpm)}</strong>. Replikasi penawaran produk di tanggal ini.</p>
              </div>
              <div class="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                CTR: ${bestGmvDay.ctr.toFixed(2)}% • Klik: ${formatNumber(bestGmvDay.klik)}
              </div>
            </div>

            <div class="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500 text-white">⚠️ Evaluasi Checkout</span>
                  <span class="text-xs font-bold text-rose-700 dark:text-rose-300">${bottleneckDay.date}</span>
                </div>
                <p class="text-lg font-black text-slate-800 dark:text-white mb-1">${formatNumber(bottleneckDay.klik)} Klik <span class="text-xs font-semibold text-rose-500">→ Hanya ${bottleneckDay.sku} SKU (CTOR ${bottleneckDay.ctor.toFixed(2)}%)</span></p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Trafik klik sangat tinggi (CTR <strong>${bottleneckDay.ctr.toFixed(2)}%</strong>), tetapi banyak audiens batal checkout. Evaluasi voucher/harga produk unggulan di hari tersebut.</p>
              </div>
              <div class="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-800/50 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                Impresi: ${formatNumber(bottleneckDay.impresi)} • GMV: ${formatRp(bottleneckDay.gmv)}
              </div>
            </div>
          `;
        }
      }

      // Render Interactive Table
      const tbody = document.getElementById('vc-summary-table-body');
      const tfoot = document.getElementById('vc-summary-table-foot');
      if (!tbody) return;

      if (dailyRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-400">Belum ada data. Silakan upload file Excel/CSV Video & Carousel Summary.</td></tr>';
        if (tfoot) tfoot.innerHTML = '';
        return;
      }

      const maxGmvDate = [...dailyRows].sort((a, b) => b.gmv - a.gmv)[0]?.date;
      const maxCtrDate = [...dailyRows].sort((a, b) => b.ctr - a.ctr)[0]?.date;

      const sortedRows = [...dailyRows].sort((a, b) => {
        if (sortVal === 'date-desc') return b.date.localeCompare(a.date);
        if (sortVal === 'gmv-desc') return b.gmv - a.gmv;
        if (sortVal === 'ctr-desc') return b.ctr - a.ctr;
        if (sortVal === 'klik-desc') return b.klik - a.klik;
        if (sortVal === 'sku-desc') return b.sku - a.sku;
        return a.date.localeCompare(b.date);
      });

      tbody.innerHTML = '';
      sortedRows.forEach(r => {
        const isBestGmv = r.date === maxGmvDate && dailyRows.length > 1;
        const isBestCtr = r.date === maxCtrDate && dailyRows.length > 1;
        const badges = [
          isBestGmv ? `<span class="ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">🏆 Top GMV</span>` : '',
          isBestCtr ? `<span class="ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">🔥 Top CTR</span>` : ''
        ].join('');

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <td class="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
              ${r.date}${badges}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-bold text-emerald-600 dark:text-emerald-400">Rp ${Math.round(r.gmv).toLocaleString('id-ID')}</div>
              <div class="text-[10px] text-slate-400">D: ${formatRp(r.gDirect)} | Ind: ${formatRp(r.gIndirect)}</div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-bold text-slate-800 dark:text-white">${r.sku.toLocaleString('id-ID')}</div>
              <div class="text-[10px] text-slate-400">${r.skuDirect > 0 ? `D: ${r.skuDirect} | Ind: ${r.skuIndirect}` : `Pembeli: ${r.buyers || '-'}`}</div>
            </td>
            <td class="px-4 py-3 text-right font-semibold text-sky-600 dark:text-sky-400">
              ${r.impresi.toLocaleString('id-ID')}
            </td>
            <td class="px-4 py-3 text-right">
              <span class="px-2 py-1 rounded-md font-extrabold ${r.ctr >= totalCtr ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}">
                ${r.ctr.toFixed(2)}%
              </span>
            </td>
            <td class="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
              ${r.klik.toLocaleString('id-ID')}
            </td>
            <td class="px-4 py-3 text-right font-semibold text-purple-600 dark:text-purple-400">
              ${r.ctor.toFixed(2)}%
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-semibold text-slate-700 dark:text-slate-300">${formatNumber(r.vv)} VV</div>
              <div class="text-[10px] text-rose-500 font-bold">GPM: ${formatRp(r.gpm)}</div>
            </td>
          </tr>
        `;
      });

      if (tfoot) {
        tfoot.innerHTML = `
          <tr>
            <td class="px-4 py-3.5">TOTAL / RATA-RATA (${dailyRows.length} HARI)</td>
            <td class="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400">Rp ${Math.round(tGmv).toLocaleString('id-ID')}</td>
            <td class="px-4 py-3.5 text-right">${tSku.toLocaleString('id-ID')} SKU</td>
            <td class="px-4 py-3.5 text-right text-sky-600 dark:text-sky-400">${tImpresi.toLocaleString('id-ID')}</td>
            <td class="px-4 py-3.5 text-right text-amber-500">${totalCtr.toFixed(2)}%</td>
            <td class="px-4 py-3.5 text-right text-blue-600 dark:text-blue-400">${tKlik.toLocaleString('id-ID')}</td>
            <td class="px-4 py-3.5 text-right text-purple-600 dark:text-purple-400">${totalCtor.toFixed(2)}%</td>
            <td class="px-4 py-3.5 text-right text-rose-500">${formatNumber(tVV)} VV | GPM ${formatRp(avgGpm)}</td>
          </tr>
        `;
      }
    }

    // --- TAB 1: RENDER OVERVIEW TAB & PILLAR INTELLIGENCE ---
    function renderOverviewTab() {
      const ovFilterEl = document.getElementById('overview-month-filter');
      const ovFilterVal = ovFilterEl ? ovFilterEl.value : 'all';
      const selectedMonthYm = (ovFilterVal && ovFilterVal.startsWith('month:')) ? ovFilterVal.replace('month:', '') : null;

      let tViews = 0, tReach = 0, tGmv = 0, tGmvDirect = 0, tGmvIndirect = 0, tPesanan = 0, tPesananDirect = 0, tPesananIndirect = 0, tErSum = 0, erCount = 0, tGpmMax = 0, tFollowers = 0, tNetGrowth = 0;
      let tLikes = 0, tComments = 0, tShares = 0;
      let tImpresi = 0, tKlik = 0;

      const allSortedDates = Object.keys(db.daily || {}).sort();
      const targetDates = selectedMonthYm ? allSortedDates.filter(d => d.startsWith(selectedMonthYm)) : allSortedDates;

      // Aggregates across daily data
      targetDates.forEach(date => {
        const day = db.daily[date];
        if (!day) return;
        const ov = day.overview || null;
        const aud = day.audience || null;

        if (ov) {
          tViews += ov.views || 0;
          tReach += (ov.reach && ov.reach > 0) ? ov.reach : ((aud && aud.reach) || 0);
          tFollowers += (aud && aud.newFollowers > 0) ? aud.newFollowers : (ov.followers || 0);
          tNetGrowth += ov.netGrowth || 0;
          tLikes += ov.likes || 0;
          tComments += ov.comments || 0;
          tShares += ov.shares || 0;
          if (ov.er && Number(ov.er) > 0) {
            tErSum += Number(ov.er);
            erCount++;
          }
        } else if (aud) {
          tReach += aud.reach || 0;
          tFollowers += aud.newFollowers || 0;
        }

        if (day.sales) {
          tGmv += day.sales.tGmvTotal || 0;
          tGmvDirect += day.sales.tGmvDirect || 0;
          tGmvIndirect += day.sales.tGmvIndirect || 0;
          tPesanan += day.sales.tOrder || 0;
          tPesananDirect += day.sales.tOrderDirect || 0;
          tPesananIndirect += day.sales.tOrderIndirect || 0;
          tImpresi += day.sales.tProdView || 0;
          tKlik += day.sales.tClick || 0;
          let maxGpm = 0;
          if (day.sales.countRows > 0) maxGpm = day.sales.sumGpm / day.sales.countRows;
          if (maxGpm > tGpmMax) tGpmMax = maxGpm;
        }
      });

      // Fallback if overview views wasn't uploaded yet but sales VV was uploaded
      if (tViews === 0) {
        targetDates.forEach(date => {
          const day = db.daily[date];
          if (day && day.sales) tViews += day.sales.tVV || 0;
        });
      }

      // Weighted Period Engagement Rate: ((Likes + Comments + Shares) / Total Overview Views) * 100
      const periodEr = (tViews > 0 && (tLikes + tComments + tShares) > 0)
        ? (((tLikes + tComments + tShares) / tViews) * 100)
        : (erCount > 0 ? (tErSum / erCount) : 0);

      // Qty Video (#) with hashtag requirement & Total videos count (by upload date)
      const activePeriodFilter = selectedMonthYm ? `month:${selectedMonthYm}` : 'all';
      const qtyVideoHashtag = getHashtagVideosCount(activePeriodFilter);
      const totalVideosCount = getTotalUploadedVideosCount(activePeriodFilter);

      // CTR (%) = (Jumlah klik produk / Jumlah impresi produk) * 100%
      const ctrPct = tImpresi > 0 ? ((tKlik / tImpresi) * 100) : 0;
      // CTOR (%) = (Pesanan SKU / Jumlah klik produk) * 100%
      const ctorPct = tKlik > 0 ? ((tPesanan / tKlik) * 100) : 0;

      document.getElementById('dash-overview-views').innerText = formatNumber(tViews);
      document.getElementById('dash-overview-reach').innerText = formatNumber(tReach);
      document.getElementById('dash-overview-er').innerText = periodEr > 0 ? periodEr.toFixed(2) + '%' : '0%';
      document.getElementById('dash-overview-followers').innerText = formatNumber(tFollowers);
      document.getElementById('dash-overview-netgrowth').innerText = formatNumber(tNetGrowth);
      if (document.getElementById('dash-overview-qtyvideo')) {
        document.getElementById('dash-overview-qtyvideo').innerText = formatNumber(qtyVideoHashtag);
      }
      if (document.getElementById('dash-overview-totalvideos')) {
        document.getElementById('dash-overview-totalvideos').innerText = formatNumber(totalVideosCount);
      }
      document.getElementById('dash-task-count').innerText = (db.todos || []).filter(x => x.stage !== 'Published').length;

      document.getElementById('dash-overview-gmv').innerText = formatRp(tGmv);
      if (document.getElementById('dash-overview-gmv-sub')) {
        document.getElementById('dash-overview-gmv-sub').innerText = tGmv > 0 ? `D: ${formatRp(tGmvDirect)} | Ind: ${formatRp(tGmvIndirect)}` : 'Direct & Indirect Video';
      }
      document.getElementById('dash-overview-pesanan').innerText = formatNumber(tPesanan);
      if (document.getElementById('dash-overview-pesanan-sub')) {
        document.getElementById('dash-overview-pesanan-sub').innerText = (tPesananDirect > 0 || tPesananIndirect > 0) ? `D: ${formatNumber(tPesananDirect)} | Ind: ${formatNumber(tPesananIndirect)}` : 'Total Teratribusi';
      }
      if (document.getElementById('dash-overview-impresi')) {
        document.getElementById('dash-overview-impresi').innerText = formatNumber(tImpresi);
      }
      if (document.getElementById('dash-overview-klik')) {
        document.getElementById('dash-overview-klik').innerText = formatNumber(tKlik);
      }
      if (document.getElementById('dash-overview-ctr')) {
        document.getElementById('dash-overview-ctr').innerText = ctrPct.toFixed(2) + '%';
      }
      if (document.getElementById('dash-overview-ctor')) {
        document.getElementById('dash-overview-ctor').innerText = `CTOR: ${ctorPct.toFixed(2)}%`;
      }
      document.getElementById('dash-overview-gpm').innerText = formatRp(tGpmMax);

      // Update MoM Growth Badges on Overview KPI Cards (2-Decimal Precision + Nominal Sub-Label)
      const momPair = getMoMComparisonPair(selectedMonthYm);
      const setOvMom = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      if (momPair) {
        const { curr, prev, prevShort, currShort } = momPair;
        const fmtPct = v => Number(v || 0).toFixed(2) + '%';
        const fmtNum2 = num => {
          if (!num) return '0';
          const abs = Math.abs(num);
          if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
          if (abs >= 1e3) return (num / 1e3).toFixed(2) + 'K';
          return Math.round(num).toLocaleString('id-ID');
        };
        setOvMom('mom-badge-views', getMoMBadgeHtml(curr.views, prev.views, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-reach', getMoMBadgeHtml(curr.reach, prev.reach, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-er', getMoMBadgeHtml(curr.er, prev.er, prevShort, true, fmtPct, currShort));
        setOvMom('mom-badge-followers', getMoMBadgeHtml(curr.followers, prev.followers, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-netgrowth', getMoMBadgeHtml(curr.netGrowth, prev.netGrowth, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-qtyvideo', getMoMBadgeHtml(curr.qtyVideoHashtag, prev.qtyVideoHashtag, prevShort, false, formatNumber, currShort));
        setOvMom('mom-badge-gmv', getMoMBadgeHtml(curr.gmv, prev.gmv, prevShort, false, formatRp, currShort));
        setOvMom('mom-badge-pesanan', getMoMBadgeHtml(curr.order, prev.order, prevShort, false, formatNumber, currShort));
        setOvMom('mom-badge-impresi', getMoMBadgeHtml(curr.impresi, prev.impresi, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-ctr', getMoMBadgeHtml(curr.ctr, prev.ctr, prevShort, true, fmtPct, currShort));
        setOvMom('mom-badge-klik', getMoMBadgeHtml(curr.klik, prev.klik, prevShort, false, fmtNum2, currShort));
        setOvMom('mom-badge-gpm', getMoMBadgeHtml(curr.gpm, prev.gpm, prevShort, false, formatRp, currShort));
      } else {
        ['mom-badge-views', 'mom-badge-reach', 'mom-badge-er', 'mom-badge-followers', 'mom-badge-netgrowth', 'mom-badge-qtyvideo', 'mom-badge-gmv', 'mom-badge-pesanan', 'mom-badge-impresi', 'mom-badge-ctr', 'mom-badge-klik', 'mom-badge-gpm'].forEach(id => setOvMom(id, ''));
      }

      const periodLabel = document.getElementById('overview-period-label');
      if (periodLabel) {
        if (targetDates.length > 0) {
          const monthPrefix = selectedMonthYm ? `${formatMonthLabel(selectedMonthYm)} • ` : '';
          periodLabel.innerText = `${monthPrefix}${targetDates[0]} s/d ${targetDates[targetDates.length - 1]} (${targetDates.length} Hari Aktif)`;
        } else {
          periodLabel.innerText = "Data Kosong (0) - Siap Upload File Excel";
        }
      }

      // Monthly KPI Progress (GMV, Views, CTR %, Followers)
      const pGmv = kpiTargets.gmv > 0 ? Math.min(100, (tGmv / kpiTargets.gmv) * 100).toFixed(1) : 0;
      const pViews = kpiTargets.views > 0 ? Math.min(100, (tViews / kpiTargets.views) * 100).toFixed(1) : 0;
      const pCtr = kpiTargets.ctr > 0 ? Math.min(100, (ctrPct / kpiTargets.ctr) * 100).toFixed(1) : 0;
      const pFol = kpiTargets.followers > 0 ? Math.min(100, (tFollowers / kpiTargets.followers) * 100).toFixed(1) : 0;

      document.getElementById('kpi-gmv-text').innerText = `${formatRp(tGmv)} / ${formatRp(kpiTargets.gmv)} (${pGmv}%)`;
      document.getElementById('kpi-views-text').innerText = `${formatNumber(tViews)} / ${formatNumber(kpiTargets.views)} (${pViews}%)`;
      if (document.getElementById('kpi-ctr-text')) {
        document.getElementById('kpi-ctr-text').innerText = `${ctrPct.toFixed(2)}% / ${Number(kpiTargets.ctr || 0).toFixed(2)}% (${pCtr}%)`;
      }
      if (document.getElementById('kpi-ctr-detail')) {
        document.getElementById('kpi-ctr-detail').innerText = `(${formatNumber(tKlik)} Klik ÷ ${formatNumber(tImpresi)} Impresi)`;
      }
      document.getElementById('kpi-followers-text').innerText = `${formatNumber(tFollowers)} / ${formatNumber(kpiTargets.followers)} (${pFol}%)`;

      setTimeout(() => {
        document.getElementById('kpi-gmv-bar').style.width = pGmv + '%';
        document.getElementById('kpi-views-bar').style.width = pViews + '%';
        if (document.getElementById('kpi-ctr-bar')) document.getElementById('kpi-ctr-bar').style.width = pCtr + '%';
        document.getElementById('kpi-followers-bar').style.width = pFol + '%';
      }, 200);

      // Render Content Pillar Breakdown Cards
      renderPillarCards();
    }

    function renderPillarCards() {
      const container = document.getElementById('pillar-cards-container');
      if (!container) return;

      const pillars = getActiveBrandPillars();
      const ovFilterEl = document.getElementById('overview-month-filter');
      const ovFilterVal = ovFilterEl ? ovFilterEl.value : 'all';
      const selectedMonthYm = (ovFilterVal && ovFilterVal.startsWith('month:')) ? ovFilterVal.replace('month:', '') : null;

      // Calculate stats per pillar from salesVideos and videoList
      let stats = {};
      pillars.forEach(p => { stats[p.id] = { count: 0, views: 0, gmv: 0, likes: 0 }; });

      const filterByOverviewMonth = (v) => {
        if (!selectedMonthYm) return true;
        if (v.reportMonth) return v.reportMonth === selectedMonthYm;
        return Boolean(v.date && v.date.startsWith(selectedMonthYm));
      };

      // Deduplicate by title+date when viewing "Semua Bulan" so cumulative video counts & GMV are accurate
      const salesSource = (db.salesVideos || []).filter(filterByOverviewMonth);
      const processedSales = !selectedMonthYm ? (() => {
        const map = new Map();
        salesSource.forEach(v => {
          const key = `${String(v.title || '').trim().toLowerCase()}||${v.date || ''}`;
          if (!map.has(key)) {
            map.set(key, { ...v });
          } else {
            const ex = map.get(key);
            ex.vv = (Number(ex.vv) || 0) + (Number(v.vv) || 0);
            ex.gmv = (Number(ex.gmv) || 0) + (Number(v.gmv) || 0);
          }
        });
        return Array.from(map.values());
      })() : salesSource;

      processedSales.forEach(v => {
        const pil = (v.pillar && stats[v.pillar]) ? v.pillar : classifyContentPillar(v.title, v.tags || '');
        const targetKey = stats[pil] ? pil : (pillars[0] && pillars[0].id);
        if (targetKey && stats[targetKey]) {
          stats[targetKey].count++;
          stats[targetKey].views += v.vv || 0;
          stats[targetKey].gmv += v.gmv || 0;
        }
      });

      (db.videoList || []).filter(filterByOverviewMonth).forEach(v => {
        const pil = (v.pillar && stats[v.pillar]) ? v.pillar : classifyContentPillar(v.title, '');
        if (stats[pil] && stats[pil].count === 0) {
          stats[pil].count++;
          stats[pil].views += v.views || 0;
          stats[pil].likes += v.likes || 0;
        }
      });

      const borderMap = {
        blue: 'border-l-blue-500',
        emerald: 'border-l-emerald-500',
        cyan: 'border-l-cyan-500',
        purple: 'border-l-purple-500',
        rose: 'border-l-rose-500',
        amber: 'border-l-amber-500',
        indigo: 'border-l-indigo-500'
      };
      const textMap = {
        blue: 'text-blue-500',
        emerald: 'text-emerald-500',
        cyan: 'text-cyan-500',
        purple: 'text-purple-500',
        rose: 'text-rose-500',
        amber: 'text-amber-500',
        indigo: 'text-indigo-500'
      };

      container.innerHTML = '';
      pillars.forEach(p => {
        const st = stats[p.id] || { count: 0, views: 0, gmv: 0 };
        const borderCls = borderMap[p.color] || 'border-l-blue-500';
        const textCls = textMap[p.color] || 'text-blue-500';

        container.innerHTML += `
          <div class="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm border-l-4 ${borderCls} flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${p.name}</span>
                <i class="fa-solid ${p.icon || 'fa-tag'} ${textCls} text-sm"></i>
              </div>
              <p class="text-lg font-bold text-slate-800 dark:text-white mb-1">${formatRp(st.gmv)}</p>
              <div class="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>${st.count} Video</span>
                <span class="font-medium">${formatNumber(st.views)} Views</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[10px]">
              <span class="text-slate-400">Revenue Contrib.</span>
              <span class="font-bold ${textCls}">${st.gmv > 0 ? formatNumber(st.gmv / 1e6) + ' Jt' : '-'}</span>
            </div>
          </div>
        `;
      });
    }

    function renderGlobalTrendChart() {
      const ovFilterEl = document.getElementById('overview-month-filter');
      const ovFilterVal = ovFilterEl ? ovFilterEl.value : 'all';
      const selectedMonthYm = (ovFilterVal && ovFilterVal.startsWith('month:')) ? ovFilterVal.replace('month:', '') : null;
      const allDates = Object.keys(db.daily || {}).sort();
      const dates = selectedMonthYm ? allDates.filter(d => d.startsWith(selectedMonthYm)) : allDates;
      let labels = [];
      let data = [];

      dates.forEach(d => {
        labels.push(d.slice(5)); // MM-DD
        const day = db.daily[d];
        if (currentTrendMetric === 'views') {
          data.push((day.overview && day.overview.views) || (day.sales && day.sales.tVV) || 0);
        } else if (currentTrendMetric === 'reach') {
          data.push((day.overview && day.overview.reach) || (day.audience && day.audience.reach) || 0);
        } else if (currentTrendMetric === 'gmv') {
          data.push(Math.round(((day.sales && day.sales.tGmvTotal) || 0) / 1e6)); // in Jt
        }
      });

      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';
      const lineColor = currentTrendMetric === 'views' ? '#3b82f6' : currentTrendMetric === 'reach' ? '#06b6d4' : '#10b981';

      const ctxMain = document.getElementById('chartOverviewMain');
      if (ctxMain) {
        if (chartOverviewMain) chartOverviewMain.destroy();
        chartOverviewMain = new Chart(ctxMain.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
              label: currentTrendMetric === 'gmv' ? 'GMV (Juta Rp)' : currentTrendMetric === 'reach' ? 'Reached Audience' : 'Video Views',
              data: data.length ? data : [0],
              borderColor: lineColor,
              backgroundColor: lineColor + '1a',
              fill: true,
              tension: 0.35,
              borderWidth: 3,
              pointBackgroundColor: '#fff',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { display: false } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    if (currentTrendMetric === 'gmv') return `GMV: Rp ${ctx.raw} Juta`;
                    return `${ctx.dataset.label}: ${formatNumber(ctx.raw)}`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // --- TAB 2: MONTH-OVER-MONTH (MoM) & PERIOD GROWTH COMPARISON ENGINE (OPSI C) ---
    function getMoMComparisonPair(selectedMonthYm = null) {
      const months = getAvailableMonths();
      if (months.length >= 2) {
        let currM = months[months.length - 1];
        let prevM = months[months.length - 2];
        if (selectedMonthYm) {
          const idx = months.findIndex(m => m.ym === selectedMonthYm);
          if (idx > 0) {
            currM = months[idx];
            prevM = months[idx - 1];
          } else if (idx === 0) {
            return null; // Bulan paling awal tidak punya bulan pembanding sebelumnya
          }
        }
        return {
          curr: getAggregatedData(currM.startDate, currM.endDate),
          prev: getAggregatedData(prevM.startDate, prevM.endDate),
          currLabel: currM.label,
          prevLabel: prevM.label,
          currShort: currM.shortLabel,
          prevShort: prevM.shortLabel,
          currYm: currM.ym,
          prevYm: prevM.ym,
          mode: 'month'
        };
      }
      // Fallback: jika baru ada 1 bulan namun >= 4 hari aktif, bandingkan Paruh Akhir vs Paruh Awal
      const allDates = Object.keys(db.daily || {}).sort();
      if (allDates.length >= 4) {
        const mid = Math.floor(allDates.length / 2);
        return {
          curr: getAggregatedData(allDates[mid], allDates[allDates.length - 1]),
          prev: getAggregatedData(allDates[0], allDates[mid - 1]),
          currLabel: `${formatShortDate(allDates[mid])} - ${formatShortDate(allDates[allDates.length - 1])}`,
          prevLabel: `${formatShortDate(allDates[0])} - ${formatShortDate(allDates[mid - 1])}`,
          currShort: 'Paruh Akhir',
          prevShort: 'Paruh Awal',
          currYm: null,
          prevYm: null,
          mode: 'half'
        };
      }
      return null;
    }

    function getMoMBadgeHtml(valCurr, valPrev, prevShortLabel, isRate = false, fmtFn = null, currShortLabel = '') {
      if ((valCurr === 0 && valPrev === 0) || valPrev === undefined || valPrev === null) return '';
      let pct = 0;
      let diffPt = 0;
      if (valPrev === 0) {
        pct = valCurr > 0 ? 100 : 0;
        diffPt = valCurr;
      } else {
        pct = ((valCurr - valPrev) / Math.abs(valPrev)) * 100;
        diffPt = valCurr - valPrev;
      }
      const isUp = pct > 0.01;
      const isDown = pct < -0.01;
      const sign = isUp ? '+' : '';
      const cls = isUp
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70'
        : isDown
          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70'
          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      const icon = isUp ? 'fa-arrow-trend-up' : isDown ? 'fa-arrow-trend-down' : 'fa-minus';
      const rateSuffix = isRate ? ` (${diffPt >= 0 ? '+' : ''}${diffPt.toFixed(2)}% pt)` : '';
      const pTag = String(prevShortLabel || '').split(' ')[0] || prevShortLabel;
      const cTag = String(currShortLabel || '').split(' ')[0] || currShortLabel;
      const nominalLine = (typeof fmtFn === 'function')
        ? `<span class="block text-[9px] font-semibold opacity-80 mt-0.5 leading-tight">${pTag}: ${fmtFn(valPrev)} → ${cTag ? cTag + ': ' : ''}${fmtFn(valCurr)}</span>`
        : '';
      const tooltipDetail = (typeof fmtFn === 'function')
        ? `${prevShortLabel}: ${fmtFn(valPrev)} → ${currShortLabel || 'Periode Ini'}: ${fmtFn(valCurr)} (${sign}${pct.toFixed(2)}%${rateSuffix})`
        : `Perbandingan MoM vs ${prevShortLabel} (${sign}${pct.toFixed(2)}%${rateSuffix})`;
      return `<div class="inline-flex flex-col items-start px-2 py-1 rounded-xl border ${cls}" title="${tooltipDetail}"><span class="inline-flex items-center gap-1 text-[10px] font-extrabold leading-tight"><i class="fa-solid ${icon} text-[9px]"></i> ${sign}${pct.toFixed(2)}% vs ${prevShortLabel}</span>${nominalLine}</div>`;
    }

    function switchCompareMode(mode) {
      compareSelectionMode = mode;
      const btnMonth = document.getElementById('btn-mode-month');
      const btnCustom = document.getElementById('btn-mode-custom');
      const boxMonth = document.getElementById('compare-selector-month');
      const boxCustom = document.getElementById('compare-selector-custom');

      if (mode === 'month') {
        if (btnMonth) btnMonth.className = "px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-2xs transition flex items-center gap-1.5";
        if (btnCustom) btnCustom.className = "px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 transition flex items-center gap-1.5";
        if (boxMonth) boxMonth.classList.remove('hidden');
        if (boxCustom) boxCustom.classList.add('hidden');
        onMonthSelectorChange();
      } else {
        if (btnCustom) btnCustom.className = "px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-2xs transition flex items-center gap-1.5";
        if (btnMonth) btnMonth.className = "px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 transition flex items-center gap-1.5";
        if (boxCustom) boxCustom.classList.remove('hidden');
        if (boxMonth) boxMonth.classList.add('hidden');
        renderComparisonTable();
      }
    }

    function setCompareNormalization(norm) {
      compareNormMode = norm;
      const btnTotal = document.getElementById('btn-norm-total');
      const btnDaily = document.getElementById('btn-norm-daily');
      if (norm === 'total') {
        if (btnTotal) btnTotal.className = "px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-xs transition flex items-center gap-1.5";
        if (btnDaily) btnDaily.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition flex items-center gap-1.5";
      } else {
        if (btnDaily) btnDaily.className = "px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-xs transition flex items-center gap-1.5";
        if (btnTotal) btnTotal.className = "px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 transition flex items-center gap-1.5";
      }
      renderComparisonTable();
    }

    function onMonthSelectorChange() {
      const months = getAvailableMonths();
      const selA = document.getElementById('compare-month-a');
      const selB = document.getElementById('compare-month-b');
      if (selA && selB && months.length > 0) {
        const mA = months.find(m => m.ym === selA.value) || months[months.length - 1];
        const mB = months.find(m => m.ym === selB.value) || months[0];
        if (mA) {
          document.getElementById('start-date-a').value = mA.startDate;
          document.getElementById('end-date-a').value = mA.endDate;
        }
        if (mB) {
          document.getElementById('start-date-b').value = mB.startDate;
          document.getElementById('end-date-b').value = mB.endDate;
        }
      }
      renderComparisonTable();
    }

    function swapComparisonPeriods() {
      if (compareSelectionMode === 'month') {
        const selA = document.getElementById('compare-month-a');
        const selB = document.getElementById('compare-month-b');
        if (selA && selB) {
          const tmp = selA.value;
          selA.value = selB.value;
          selB.value = tmp;
          onMonthSelectorChange();
          return;
        }
      }
      const sA = document.getElementById('start-date-a');
      const eA = document.getElementById('end-date-a');
      const sB = document.getElementById('start-date-b');
      const eB = document.getElementById('end-date-b');
      if (sA && eA && sB && eB) {
        const ts = sA.value, te = eA.value;
        sA.value = sB.value; eA.value = eB.value;
        sB.value = ts; eB.value = te;
        renderComparisonTable();
      }
    }

    function applyComparePreset(preset) {
      const allDates = Object.keys(db.daily || {}).sort();
      if (allDates.length === 0) return;
      const months = getAvailableMonths();

      if (preset === 'mom_latest') {
        if (months.length >= 2) {
          const selA = document.getElementById('compare-month-a');
          const selB = document.getElementById('compare-month-b');
          if (selA && selB) {
            selA.value = months[months.length - 1].ym;
            selB.value = months[months.length - 2].ym;
          }
          switchCompareMode('month');
          showToast(`Membandingkan ${months[months.length - 2].label} vs ${months[months.length - 1].label}`, 'info');
          return;
        } else {
          showToast('Baru ada 1 bulan di memori. Menampilkan perbandingan Paruh Akhir vs Paruh Awal bulan.', 'info');
          preset = 'half_month';
        }
      }

      if (preset === '7d_wow') {
        const n = allDates.length;
        const endA = allDates[n - 1];
        const startA = allDates[Math.max(0, n - 7)];
        const endB = allDates[Math.max(0, n - 8)];
        const startB = allDates[Math.max(0, n - 14)];
        document.getElementById('start-date-a').value = startA;
        document.getElementById('end-date-a').value = endA;
        document.getElementById('start-date-b').value = startB;
        document.getElementById('end-date-b').value = endB;
        switchCompareMode('custom');
        showToast('Membandingkan 7 Hari Terakhir vs 7 Hari Sebelumnya', 'info');
        return;
      }

      if (preset === 'half_month') {
        const mid = Math.max(1, Math.floor(allDates.length / 2));
        document.getElementById('start-date-b').value = allDates[0];
        document.getElementById('end-date-b').value = allDates[mid - 1];
        document.getElementById('start-date-a').value = allDates[mid];
        document.getElementById('end-date-a').value = allDates[allDates.length - 1];
        switchCompareMode('custom');
        showToast('Membandingkan Paruh Awal vs Paruh Akhir Periode', 'info');
      }
    }

    function renderComparisonTable() {
      const startA = document.getElementById('start-date-a') ? document.getElementById('start-date-a').value : '';
      const endA = document.getElementById('end-date-a') ? document.getElementById('end-date-a').value : '';
      const startB = document.getElementById('start-date-b') ? document.getElementById('start-date-b').value : '';
      const endB = document.getElementById('end-date-b') ? document.getElementById('end-date-b').value : '';

      const tbody = document.getElementById('comparison-table-body');
      const thA = document.getElementById('th-date-a');
      const thB = document.getElementById('th-date-b');
      const highlightContainer = document.getElementById('mom-highlight-cards');
      const pacingBanner = document.getElementById('mom-pacing-banner');

      if (!startA || !endA || !startB || !endB || Object.keys(db.daily || {}).length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-500">Belum ada data analitik. Silakan upload file Excel atau klik "Simulasi Data Sep vs Okt".</td></tr>`;
        if (highlightContainer) highlightContainer.innerHTML = '';
        if (pacingBanner) pacingBanner.classList.add('hidden');
        if (chartCompare) chartCompare.destroy();
        return;
      }

      const months = getAvailableMonths();
      const rawA = getAggregatedData(startA, endA);
      const rawB = getAggregatedData(startB, endB);

      const selA = document.getElementById('compare-month-a');
      const selB = document.getElementById('compare-month-b');
      let labelA = (startA === endA) ? formatShortDate(startA) : `${formatShortDate(startA)} - ${formatShortDate(endA)}`;
      let labelB = (startB === endB) ? formatShortDate(startB) : `${formatShortDate(startB)} - ${formatShortDate(endB)}`;
      let shortA = labelA;
      let shortB = labelB;

      if (compareSelectionMode === 'month' && selA && selB && selA.value && selB.value) {
        const mA = months.find(m => m.ym === selA.value);
        const mB = months.find(m => m.ym === selB.value);
        if (mA) { labelA = `${mA.label} (${rawA.activeDays} Hr)`; shortA = mA.shortLabel; }
        if (mB) { labelB = `${mB.label} (${rawB.activeDays} Hr)`; shortB = mB.shortLabel; }
      } else {
        labelA = `${labelA} (${rawA.activeDays} Hr)`;
        labelB = `${labelB} (${rawB.activeDays} Hr)`;
      }

      const isDaily = (compareNormMode === 'daily');
      const divA = isDaily ? Math.max(1, rawA.activeDays) : 1;
      const divB = isDaily ? Math.max(1, rawB.activeDays) : 1;
      const normSuffix = isDaily ? ' / Hari' : '';

      if (thA) thA.innerText = `${labelA}${normSuffix}`;
      if (thB) thB.innerText = `${labelB}${normSuffix}`;

      const normVal = (v, div) => v / div;

      const gmvA = normVal(rawA.gmv, divA); const gmvB = normVal(rawB.gmv, divB);
      const orderA = normVal(rawA.order, divA); const orderB = normVal(rawB.order, divB);
      const impA = normVal(rawA.impresi, divA); const impB = normVal(rawB.impresi, divB);
      const klikA = normVal(rawA.klik, divA); const klikB = normVal(rawB.klik, divB);
      const ctrA = rawA.ctr; const ctrB = rawB.ctr;
      const ctorA = rawA.ctor; const ctorB = rawB.ctor;
      const gpmA = rawA.gpm; const gpmB = rawB.gpm;
      const viewsA = normVal(rawA.views, divA); const viewsB = normVal(rawB.views, divB);
      const reachA = normVal(rawA.reach, divA); const reachB = normVal(rawB.reach, divB);
      const erA = rawA.er; const erB = rawB.er;
      const folA = normVal(rawA.followers, divA); const folB = normVal(rawB.followers, divB);
      const qtyA = normVal(rawA.qtyVideoHashtag, divA); const qtyB = normVal(rawB.qtyVideoHashtag, divB);

      const calcPct = (a, b) => {
        if (b === 0 && a === 0) return 0;
        if (b === 0) return 100;
        return ((a - b) / Math.abs(b)) * 100;
      };

      // 1. Render 6 Executive MoM Highlight Cards (Ide 1)
      if (highlightContainer) {
        const cards = [
          {
            title: isDaily ? 'GMV / Hari' : 'Total GMV',
            icon: 'fa-sack-dollar',
            color: 'emerald',
            valA: formatRp(gmvA),
            valB: formatRp(gmvB),
            diffStr: (gmvA - gmvB >= 0 ? '+ ' : '- ') + formatRp(Math.abs(gmvA - gmvB)),
            pct: calcPct(gmvA, gmvB)
          },
          {
            title: isDaily ? 'Pesanan SKU / Hr' : 'Pesanan SKU',
            icon: 'fa-cart-shopping',
            color: 'teal',
            valA: isDaily ? orderA.toFixed(1) : formatNumber(orderA),
            valB: isDaily ? orderB.toFixed(1) : formatNumber(orderB),
            diffStr: (orderA - orderB >= 0 ? '+' : '') + (isDaily ? (orderA - orderB).toFixed(1) : formatNumber(orderA - orderB)) + ' SKU',
            pct: calcPct(orderA, orderB)
          },
          {
            title: isDaily ? 'Impresi Produk / Hr' : 'Impresi Produk',
            icon: 'fa-eye',
            color: 'sky',
            valA: formatNumber(Math.round(impA)),
            valB: formatNumber(Math.round(impB)),
            diffStr: (impA - impB >= 0 ? '+' : '') + formatNumber(Math.round(impA - impB)),
            pct: calcPct(impA, impB)
          },
          {
            title: 'CTR Produk (%)',
            icon: 'fa-percent',
            color: 'amber',
            valA: ctrA.toFixed(2) + '%',
            valB: ctrB.toFixed(2) + '%',
            diffStr: (ctrA - ctrB >= 0 ? '+' : '') + (ctrA - ctrB).toFixed(2) + '% pt',
            pct: calcPct(ctrA, ctrB)
          },
          {
            title: isDaily ? 'Klik Produk / Hr' : 'Klik Produk',
            icon: 'fa-hand-pointer',
            color: 'blue',
            valA: formatNumber(Math.round(klikA)),
            valB: formatNumber(Math.round(klikB)),
            diffStr: (klikA - klikB >= 0 ? '+' : '') + formatNumber(Math.round(klikA - klikB)),
            pct: calcPct(klikA, klikB)
          },
          {
            title: isDaily ? 'Video Views / Hr' : 'Total Video Views',
            icon: 'fa-play',
            color: 'indigo',
            valA: formatNumber(Math.round(viewsA)),
            valB: formatNumber(Math.round(viewsB)),
            diffStr: `Qty (#): ${isDaily ? qtyB.toFixed(1) : rawB.qtyVideoHashtag} → ${isDaily ? qtyA.toFixed(1) : rawA.qtyVideoHashtag}`,
            pct: calcPct(viewsA, viewsB)
          }
        ];

        highlightContainer.innerHTML = cards.map(c => {
          const isUp = c.pct > 0.05;
          const isDown = c.pct < -0.05;
          const badgeCls = isUp
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : isDown
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
          const arrow = isUp ? 'fa-arrow-trend-up' : isDown ? 'fa-arrow-trend-down' : 'fa-minus';
          const sign = isUp ? '+' : '';
          return `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start gap-1 mb-2">
                  <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">${c.title}</span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeCls}">
                    <i class="fa-solid ${arrow} text-[9px]"></i> ${sign}${c.pct.toFixed(1)}%
                  </span>
                </div>
                <h4 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">${c.valA}</h4>
                <p class="text-[10px] text-slate-400 mt-1">Bulan Awal (${shortB}): <strong class="text-slate-600 dark:text-slate-300">${c.valB}</strong></p>
              </div>
              <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-[10px]">
                <span class="text-slate-400">Selisih:</span>
                <span class="font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-rose-500' : 'text-slate-500'}">${c.diffStr}</span>
              </div>
            </div>
          `;
        }).join('');
      }

      // 2. Render End-of-Month Pacing & Fair Apple-to-Apple Banner (Ide 3)
      if (pacingBanner) {
        const targetYm = (compareSelectionMode === 'month' && selA && selA.value) ? selA.value : (endA ? endA.slice(0, 7) : null);
        const calDaysA = targetYm ? getCalendarDaysInMonth(targetYm) : 30;
        if (rawA.activeDays > 0 && rawB.activeDays > 0) {
          pacingBanner.classList.remove('hidden');
          const dailyGmvA = rawA.gmv / rawA.activeDays;
          const dailyGmvB = rawB.gmv / rawB.activeDays;
          const projectedGmvA = dailyGmvA * calDaysA;
          const projectedOrderA = Math.round((rawA.order / rawA.activeDays) * calDaysA);
          const projectedVsPrevPct = rawB.gmv > 0 ? (((projectedGmvA - rawB.gmv) / rawB.gmv) * 100) : 0;
          const dailyRunRatePct = dailyGmvB > 0 ? (((dailyGmvA - dailyGmvB) / dailyGmvB) * 100) : 0;

          pacingBanner.innerHTML = `
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <i class="fa-solid fa-gauge-high text-base"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h4 class="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">End-of-Month Pacing & Daily Run-Rate Normalization</h4>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    ${shortB}: ${rawB.activeDays} Hari Aktif vs ${shortA}: ${rawA.activeDays} Hari Aktif
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Rata-rata GMV harian tumbuh <strong>${dailyRunRatePct >= 0 ? '+' : ''}${dailyRunRatePct.toFixed(1)}%</strong> (dari <strong>${formatRp(dailyGmvB)}/hari</strong> menjadi <strong>${formatRp(dailyGmvA)}/hari</strong>).
                  Jika ritme harian <strong>${shortA}</strong> bertahan penuh selama <strong>${calDaysA} hari kalender</strong>, estimasi penutupan akhir bulan mencapai <strong class="text-emerald-600 dark:text-emerald-400">${formatRp(projectedGmvA)}</strong> (<strong>${projectedOrderA.toLocaleString('id-ID')} SKU</strong>).
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="setCompareNormalization('${isDaily ? 'total' : 'daily'}')" class="px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition shadow-2xs cursor-pointer">
                <i class="fa-solid fa-scale-balanced mr-1"></i> ${isDaily ? 'Lihat Total Periode' : 'Aktifkan Mode Rata-Rata / Hari'}
              </button>
            </div>
          `;
        } else {
          pacingBanner.classList.add('hidden');
        }
      }

      // 3. Render Complete 12-Metric MoM Variance Table
      const metricsRows = [
        {
          section: '1. Video & Carousel Summary (Commerce & Konversi)',
          name: `GMV dari Video${normSuffix}`,
          sub: 'Total Omzet Teratribusi (Direct + Indirect)',
          valB: formatRp(gmvB),
          valA: formatRp(gmvA),
          diffStr: `${gmvA - gmvB >= 0 ? '+' : '-'}${formatRp(Math.abs(gmvA - gmvB))}`,
          rawB: gmvB, rawA: gmvA, isRate: false
        },
        {
          name: `Pesanan SKU Teratribusi${normSuffix}`,
          sub: 'Jumlah Checkout Produk dari Video & Carousel',
          valB: isDaily ? orderB.toFixed(1) : formatNumber(orderB),
          valA: isDaily ? orderA.toFixed(1) : formatNumber(orderA),
          diffStr: `${orderA - orderB >= 0 ? '+' : ''}${isDaily ? (orderA - orderB).toFixed(1) : formatNumber(orderA - orderB)} SKU`,
          rawB: orderB, rawA: orderA, isRate: false
        },
        {
          name: `Impresi Produk${normSuffix}`,
          sub: 'Jumlah Tayangan Keranjang Kuning Produk',
          valB: formatNumber(Math.round(impB)),
          valA: formatNumber(Math.round(impA)),
          diffStr: `${impA - impB >= 0 ? '+' : ''}${formatNumber(Math.round(impA - impB))}`,
          rawB: impB, rawA: impA, isRate: false
        },
        {
          name: 'CTR Produk (%)',
          sub: 'Rumus: (Klik Produk ÷ Impresi Produk) × 100%',
          valB: ctrB.toFixed(2) + '%',
          valA: ctrA.toFixed(2) + '%',
          diffStr: `${ctrA - ctrB >= 0 ? '+' : ''}${(ctrA - ctrB).toFixed(2)}% pt`,
          rawB: ctrB, rawA: ctrA, isRate: true
        },
        {
          name: `Klik Produk${normSuffix}`,
          sub: 'Jumlah Klik Keranjang Kuning oleh Audiens',
          valB: formatNumber(Math.round(klikB)),
          valA: formatNumber(Math.round(klikA)),
          diffStr: `${klikA - klikB >= 0 ? '+' : ''}${formatNumber(Math.round(klikA - klikB))}`,
          rawB: klikB, rawA: klikA, isRate: false
        },
        {
          name: 'CTOR Checkout (%)',
          sub: 'Rumus: (Pesanan SKU ÷ Klik Produk) × 100%',
          valB: ctorB.toFixed(2) + '%',
          valA: ctorA.toFixed(2) + '%',
          diffStr: `${ctorA - ctorB >= 0 ? '+' : ''}${(ctorA - ctorB).toFixed(2)}% pt`,
          rawB: ctorB, rawA: ctorA, isRate: true
        },
        {
          name: 'GPM (Gross Merchandise per Mille)',
          sub: 'Pendapatan Rata-Rata per 1.000 Video Views',
          valB: formatRp(gpmB),
          valA: formatRp(gpmA),
          diffStr: `${gpmA - gpmB >= 0 ? '+' : '-'}${formatRp(Math.abs(gpmA - gpmB))}`,
          rawB: gpmB, rawA: gpmA, isRate: false
        },
        {
          section: '2. Data Analytics (Konten, Reach & Pertumbuhan Akun)',
          name: `Quantity Video (#)${normSuffix}`,
          sub: 'Jumlah Video Ber-Hashtag (#) yang Diposting',
          valB: isDaily ? qtyB.toFixed(2) : formatNumber(qtyB),
          valA: isDaily ? qtyA.toFixed(2) : formatNumber(qtyA),
          diffStr: `${qtyA - qtyB >= 0 ? '+' : ''}${isDaily ? (qtyA - qtyB).toFixed(2) : formatNumber(qtyA - qtyB)} Video`,
          rawB: qtyB, rawA: qtyA, isRate: false
        },
        {
          name: `Total Video Views (VV)${normSuffix}`,
          sub: 'Total Tayangan Konten Video Organik & Iklan',
          valB: formatNumber(Math.round(viewsB)),
          valA: formatNumber(Math.round(viewsA)),
          diffStr: `${viewsA - viewsB >= 0 ? '+' : ''}${formatNumber(Math.round(viewsA - viewsB))}`,
          rawB: viewsB, rawA: viewsA, isRate: false
        },
        {
          name: `Reached Audience${normSuffix}`,
          sub: 'Jangkauan Akun Unik (Unique Viewers)',
          valB: formatNumber(Math.round(reachB)),
          valA: formatNumber(Math.round(reachA)),
          diffStr: `${reachA - reachB >= 0 ? '+' : ''}${formatNumber(Math.round(reachA - reachB))}`,
          rawB: reachB, rawA: reachA, isRate: false
        },
        {
          name: 'Average Engagement Rate (%)',
          sub: 'Tingkat Interaksi Audiens (Likes, Comments, Shares)',
          valB: erB.toFixed(2) + '%',
          valA: erA.toFixed(2) + '%',
          diffStr: `${erA - erB >= 0 ? '+' : ''}${(erA - erB).toFixed(2)}% pt`,
          rawB: erB, rawA: erA, isRate: true
        },
        {
          name: `New Followers${normSuffix}`,
          sub: 'Pertumbuhan Pengikut Baru pada Periode Ini',
          valB: formatNumber(Math.round(folB)),
          valA: formatNumber(Math.round(folA)),
          diffStr: `${folA - folB >= 0 ? '+' : ''}${formatNumber(Math.round(folA - folB))}`,
          rawB: folB, rawA: folA, isRate: false
        }
      ];

      if (tbody) {
        let html = '';
        metricsRows.forEach(r => {
          if (r.section) {
            html += `
              <tr class="bg-slate-100/90 dark:bg-slate-900/90">
                <td colspan="6" class="px-5 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">${r.section}</td>
              </tr>
            `;
          }
          const pct = calcPct(r.rawA, r.rawB);
          const isUp = pct > 0.05;
          const isDown = pct < -0.05;
          const statusBadge = pct >= 20
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">🚀 Akselerasi Kuat</span>'
            : isUp
              ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">📈 Tumbuh Positif</span>'
              : isDown
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">⚠️ Perlu Optimasi</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">➖ Stabil</span>';

          html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <td class="px-5 py-3">
                <div class="font-bold text-slate-800 dark:text-slate-200">${r.name}</div>
                <div class="text-[10px] text-slate-400">${r.sub}</div>
              </td>
              <td class="px-5 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">${r.valB}</td>
              <td class="px-5 py-3 text-right font-black text-blue-600 dark:text-blue-400">${r.valA}</td>
              <td class="px-5 py-3 text-right font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-rose-500' : 'text-slate-400'}">${r.diffStr}</td>
              <td class="px-5 py-3 text-right">${getDeltaHtml(r.rawA, r.rawB, r.isRate)}</td>
              <td class="px-5 py-3 text-center">${statusBadge}</td>
            </tr>
          `;
        });
        tbody.innerHTML = html;
      }

      // 4. Render Dual-Mode Comparison Chart (% MoM Growth vs Head-to-Head Nominal)
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';
      const ctxC = document.getElementById('chartCompare');
      const chartModeEl = document.getElementById('compare-chart-mode');
      const chartMode = chartModeEl ? chartModeEl.value : 'pct';

      if (ctxC) {
        if (chartCompare) chartCompare.destroy();
        if (chartMode === 'pct') {
          const labels = ['GMV', 'Pesanan SKU', 'Impresi Produk', 'CTR (%)', 'Klik Produk', 'Video Views', 'Reached', 'Qty Video (#)'];
          const pctData = [
            Number(calcPct(gmvA, gmvB).toFixed(2)),
            Number(calcPct(orderA, orderB).toFixed(2)),
            Number(calcPct(impA, impB).toFixed(2)),
            Number(calcPct(ctrA, ctrB).toFixed(2)),
            Number(calcPct(klikA, klikB).toFixed(2)),
            Number(calcPct(viewsA, viewsB).toFixed(2)),
            Number(calcPct(reachA, reachB).toFixed(2)),
            Number(calcPct(qtyA, qtyB).toFixed(2))
          ];
          chartCompare = new Chart(ctxC.getContext('2d'), {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: `% Pertumbuhan (${shortB} → ${shortA})`,
                data: pctData,
                backgroundColor: pctData.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)'),
                borderRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor, font: { size: 10, weight: 'bold' } }, grid: { display: false } },
                y: {
                  ticks: { color: textColor, callback: (val) => (val > 0 ? '+' : '') + val + '%' },
                  grid: { color: gridColor }
                }
              },
              plugins: {
                legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `Pertumbuhan: ${ctx.raw >= 0 ? '+' : ''}${ctx.raw}%`
                  }
                }
              }
            }
          });
        } else {
          chartCompare = new Chart(ctxC.getContext('2d'), {
            type: 'bar',
            data: {
              labels: ['GMV (Juta)', 'Pesanan SKU', 'Impresi (x1K)', 'Klik Produk', 'Views (x10K)', 'CTR (%)'],
              datasets: [
                {
                  label: `${shortB} (Awal)`,
                  data: [(gmvB / 1e6).toFixed(2), Math.round(orderB), (impB / 1e3).toFixed(1), Math.round(klikB), (viewsB / 1e4).toFixed(1), ctrB.toFixed(2)],
                  backgroundColor: isDark ? '#475569' : '#94a3b8',
                  borderRadius: 5
                },
                {
                  label: `${shortA} (Target)`,
                  data: [(gmvA / 1e6).toFixed(2), Math.round(orderA), (impA / 1e3).toFixed(1), Math.round(klikA), (viewsA / 1e4).toFixed(1), ctrA.toFixed(2)],
                  backgroundColor: '#3b82f6',
                  borderRadius: 5
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              },
              plugins: {
                legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } }
              }
            }
          });
        }
      }
    }

    function getDeltaHtml(valA, valB, isRate = false) {
      if (valB === 0 && valA === 0) return '<span class="text-slate-400 font-medium">0.0%</span>';
      if (valB === 0) return '<span class="text-emerald-500 font-black"><i class="fa-solid fa-arrow-trend-up"></i> +100%</span>';
      const pct = ((valA - valB) / Math.abs(valB)) * 100;
      const formattedPct = (pct > 0 ? '+' : '') + pct.toFixed(2) + '%';
      const icon = pct > 0.05 ? '<i class="fa-solid fa-arrow-trend-up"></i>' : pct < -0.05 ? '<i class="fa-solid fa-arrow-trend-down"></i>' : '<i class="fa-solid fa-minus"></i>';
      const color = pct > 0.05 ? 'text-emerald-600 dark:text-emerald-400' : pct < -0.05 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400';
      if (isRate) {
        const diffPt = valA - valB;
        const ptStr = (diffPt >= 0 ? '+' : '') + diffPt.toFixed(2) + '% pt';
        return `<div class="${color} font-black">${icon} ${formattedPct}</div><div class="text-[10px] text-slate-400 font-semibold">(${ptStr})</div>`;
      }
      return `<span class="${color} font-black">${icon} ${formattedPct}</span>`;
    }

    function formatShortDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }

    function getAggregatedData(startDate, endDate) {
      let agg = {
        gmv: 0, gmvDirect: 0, gmvIndirect: 0, order: 0,
        views: 0, overviewViews: 0, salesVV: 0, reach: 0,
        erSum: 0, erCount: 0, er: 0, impresi: 0, klik: 0, ctr: 0, ctor: 0,
        qtyVideoHashtag: 0, followers: 0, netGrowth: 0, likes: 0, shares: 0,
        gpmSum: 0, gpmCount: 0, gpm: 0, activeDays: 0
      };
      if (!startDate || !endDate) return agg;

      const sDateStr = String(startDate).slice(0, 10);
      const eDateStr = String(endDate).slice(0, 10);
      const sYm = sDateStr.slice(0, 7);
      const eYm = eDateStr.slice(0, 7);

      Object.keys(db.daily || {}).forEach(dateStr => {
        if (dateStr >= sDateStr && dateStr <= eDateStr) {
          const day = db.daily[dateStr];
          if (!day) return;
          agg.activeDays++;
          if (day.sales) {
            agg.gmv += day.sales.tGmvTotal || 0;
            agg.gmvDirect += day.sales.tGmvDirect || 0;
            agg.gmvIndirect += day.sales.tGmvIndirect || 0;
            agg.order += day.sales.tOrder || 0;
            agg.impresi += day.sales.tProdView || 0;
            agg.klik += day.sales.tClick || 0;
            agg.salesVV += day.sales.tVV || 0;
            if (day.sales.countRows > 0) {
              agg.gpmSum += (day.sales.sumGpm / day.sales.countRows);
              agg.gpmCount++;
            }
          }
          const ov = day.overview || null;
          const aud = day.audience || null;
          if (ov) {
            agg.overviewViews += ov.views || 0;
            agg.reach += (ov.reach && ov.reach > 0) ? ov.reach : ((aud && aud.reach) || 0);
            agg.followers += (aud && aud.newFollowers > 0) ? aud.newFollowers : (ov.followers || 0);
            agg.netGrowth += ov.netGrowth || 0;
            agg.likes += ov.likes || 0;
            agg.shares += (ov.shares || 0) + (ov.comments || 0);
            if (ov.er && Number(ov.er) > 0) {
              agg.erSum += Number(ov.er);
              agg.erCount++;
            }
          } else if (aud) {
            agg.reach += aud.reach || 0;
            agg.followers += aud.newFollowers || 0;
          }
        }
      });

      // Keep Total Views consistent with Overview Tab (prioritize TikTok Overview Video Views over Seller Center VV)
      agg.views = agg.overviewViews > 0 ? agg.overviewViews : agg.salesVV;

      const sourceVideos = (db.videoList && db.videoList.length > 0) ? db.videoList : (db.salesVideos || []);
      sourceVideos.forEach(v => {
        if (!String(v.title || '').includes('#')) return;
        if (v.date) {
          const vdStr = String(v.date).slice(0, 10);
          if (vdStr >= sDateStr && vdStr <= eDateStr) {
            agg.qtyVideoHashtag++;
          }
        } else if (v.reportMonth && v.reportMonth >= sYm && v.reportMonth <= eYm) {
          agg.qtyVideoHashtag++;
        }
      });

      agg.ctr = agg.impresi > 0 ? ((agg.klik / agg.impresi) * 100) : 0;
      agg.ctor = agg.klik > 0 ? ((agg.order / agg.klik) * 100) : 0;
      // Weighted Engagement Rate across period: ((Likes + Comments + Shares) / Total Overview Views) * 100
      agg.er = (agg.overviewViews > 0 && (agg.likes + agg.shares) > 0)
        ? (((agg.likes + agg.shares) / agg.overviewViews) * 100)
        : (agg.erCount > 0 ? (agg.erSum / agg.erCount) : 0);
      agg.gpm = agg.gpmCount > 0 ? (agg.gpmSum / agg.gpmCount) : (agg.views > 0 ? (agg.gmv / agg.views) * 1000 : 0);

      return agg;
    }

    // --- TAB 3: RENDER DATA ANALYTICS (OVERVIEW, AUDIENCE, VIDEO PERF) ---
    function renderAnalytics() {
      const sel = document.getElementById('analytics-date-filter');
      const selDate = sel ? sel.value : 'all';
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      let views = 0, reach = 0, er = '0.00', netGrowth = 0, followers = 0, profile = 0, likes = 0, shares = 0, engaged = 0;
      let erSum = 0, erCount = 0;

      if (selDate === 'all' || (selDate && selDate.startsWith('month:'))) {
        const ymFilter = (selDate && selDate.startsWith('month:')) ? selDate.replace('month:', '') : null;
        Object.keys(db.daily || {}).forEach(d => {
          if (ymFilter && !d.startsWith(ymFilter)) return;
          const day = db.daily[d];
          if (!day) return;
          const ov = day.overview || null;
          const aud = day.audience || null;
          if (ov) {
            views += ov.views || 0;
            reach += (ov.reach && ov.reach > 0) ? ov.reach : ((aud && aud.reach) || 0);
            profile += ov.profile || 0;
            netGrowth += ov.netGrowth || 0;
            followers += (aud && aud.newFollowers > 0) ? aud.newFollowers : (ov.followers || 0);
            likes += ov.likes || 0;
            shares += (ov.shares || 0) + (ov.comments || 0);
            if (ov.er && Number(ov.er) > 0) { erSum += Number(ov.er); erCount++; }
          } else if (aud) {
            reach += aud.reach || 0;
            followers += aud.newFollowers || 0;
          }
          if (aud) {
            engaged += aud.engaged || 0;
          }
        });
        const weightedEr = (views > 0 && (likes + shares) > 0)
          ? (((likes + shares) / views) * 100)
          : (erCount > 0 ? (erSum / erCount) : 0);
        er = weightedEr > 0 ? weightedEr.toFixed(2) : '0';
      } else {
        const day = db.daily[selDate];
        const ov = (day && day.overview) ? day.overview : null;
        const aud = (day && day.audience) ? day.audience : null;
        if (ov) {
          views = ov.views || 0;
          reach = (ov.reach && ov.reach > 0) ? ov.reach : ((aud && aud.reach) || 0);
          profile = ov.profile || 0;
          netGrowth = ov.netGrowth || 0;
          followers = (aud && aud.newFollowers > 0) ? aud.newFollowers : (ov.followers || 0);
          likes = ov.likes || 0;
          shares = (ov.shares || 0) + (ov.comments || 0);
          er = ov.er || '0';
        } else if (aud) {
          reach = aud.reach || 0;
          followers = aud.newFollowers || 0;
        }
        if (aud) {
          engaged = aud.engaged || 0;
        }
      }

      // Populate Overview sub-tab
      if (document.getElementById('stat-a-views')) document.getElementById('stat-a-views').innerText = formatNumber(views);
      if (document.getElementById('stat-a-reach')) document.getElementById('stat-a-reach').innerText = formatNumber(reach);
      if (document.getElementById('stat-a-er')) document.getElementById('stat-a-er').innerText = er + '%';
      if (document.getElementById('stat-a-netgrowth')) document.getElementById('stat-a-netgrowth').innerText = formatNumber(netGrowth);
      if (document.getElementById('stat-a-followers')) document.getElementById('stat-a-followers').innerText = formatNumber(followers);
      if (document.getElementById('stat-a-profile')) document.getElementById('stat-a-profile').innerText = formatNumber(profile);
      if (document.getElementById('stat-a-likes')) document.getElementById('stat-a-likes').innerText = formatNumber(likes);
      if (document.getElementById('stat-a-shares')) document.getElementById('stat-a-shares').innerText = formatNumber(shares);

      // Populate Audience sub-tab
      if (document.getElementById('aud-stat-reached')) document.getElementById('aud-stat-reached').innerText = formatNumber(reach);
      if (document.getElementById('aud-stat-engaged')) document.getElementById('aud-stat-engaged').innerText = formatNumber(engaged);
      const audEr = reach > 0 ? ((engaged / reach) * 100).toFixed(2) : '0';
      if (document.getElementById('aud-stat-er')) document.getElementById('aud-stat-er').innerText = audEr + '%';
      const folPer1k = reach > 0 ? ((followers / reach) * 1000).toFixed(2) : '0';
      if (document.getElementById('aud-stat-rate')) document.getElementById('aud-stat-rate').innerText = folPer1k + ' / 1K Reach';

      // Audience Trend Charts
      renderAudienceCharts(textColor, gridColor);

      // Video Performance Tab
      filterAndRenderVideoAnalytics();
    }

    function renderAudienceCharts(textColor, gridColor) {
      const sel = document.getElementById('analytics-date-filter');
      const selDate = sel ? sel.value : 'all';
      const ymFilter = (selDate && selDate.startsWith('month:')) ? selDate.replace('month:', '') : null;
      const allDates = Object.keys(db.daily || {}).sort();
      const dates = ymFilter ? allDates.filter(d => d.startsWith(ymFilter)) : allDates;
      const labels = dates.length ? dates.map(d => d.slice(5)) : ['Belum Ada Data'];
      const reachedData = dates.length ? dates.map(d => (db.daily[d].audience && db.daily[d].audience.reach) || (db.daily[d].overview && db.daily[d].overview.reach) || 0) : [0];
      const engagedData = dates.length ? dates.map(d => (db.daily[d].audience && db.daily[d].audience.engaged) || 0) : [0];
      const newFolData = dates.length ? dates.map(d => (db.daily[d].audience && db.daily[d].audience.newFollowers) || (db.daily[d].overview && db.daily[d].overview.followers) || 0) : [0];
      const lostFolData = dates.length ? dates.map(d => (db.daily[d].overview && db.daily[d].overview.lostFollowers) || 0) : [0];

      const ctxReach = document.getElementById('chartGender'); // reusing canvas ID for Reached vs Engaged
      if (ctxReach) {
        if (chartAudienceReach) chartAudienceReach.destroy();
        chartAudienceReach = new Chart(ctxReach.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              { label: 'Reached Audience', data: reachedData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3, fill: true, borderWidth: 2 },
              { label: 'Engaged Audience', data: engagedData, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', tension: 0.3, fill: true, borderWidth: 2 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { display: false } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: { legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } } }
          }
        });
      }

      const ctxChurn = document.getElementById('chartAge'); // reusing canvas ID for Growth vs Churn
      if (ctxChurn) {
        if (chartAudienceChurn) chartAudienceChurn.destroy();
        chartAudienceChurn = new Chart(ctxChurn.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              { label: 'New Followers', data: newFolData, backgroundColor: '#10b981', borderRadius: 4 },
              { label: 'Lost Followers', data: lostFolData, backgroundColor: '#f43f5e', borderRadius: 4 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { display: false } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: { legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } } }
          }
        });
      }
    }

    function filterAndRenderVideoAnalytics() {
      const filterType = document.getElementById('video-filter-type') ? document.getElementById('video-filter-type').value : 'hashtag';
      const sel = document.getElementById('analytics-date-filter');
      const selDate = sel ? sel.value : 'all';
      const allVideos = db.videoList || [];

      // Filter by selected month or specific date if chosen; otherwise show all
      let baseVideos = allVideos;
      if (selDate && selDate.startsWith('month:')) {
        const ym = selDate.replace('month:', '');
        baseVideos = allVideos.filter(v => (v.date && v.date.startsWith(ym)) || (v.reportMonth && v.reportMonth === ym));
      } else if (selDate && selDate !== 'all') {
        baseVideos = allVideos.filter(v => v.date === selDate);
      }

      let filtered = [...baseVideos];
      if (filterType === 'hashtag') {
        filtered = baseVideos.filter(v => String(v.title || '').includes('#'));
      } else if (filterType === 'organic') {
        filtered = baseVideos.filter(v => (v.views || 0) >= 1000);
      } else if (filterType === 'live') {
        filtered = baseVideos.filter(v => (v.views || 0) < 1000);
      }

      // Sort by views descending
      filtered.sort((a, b) => b.views - a.views);

      const hashtagCount = baseVideos.filter(v => String(v.title || '').includes('#')).length;
      const totalV = baseVideos.length;
      const organicCount = baseVideos.filter(v => (v.views || 0) >= 1000).length;
      const topV = baseVideos.length > 0 ? Math.max(...baseVideos.map(v => v.views || 0)) : 0;
      const totalFav = baseVideos.reduce((acc, v) => acc + (v.favorites || 0), 0);

      if (document.getElementById('stat-a-hashtag-videos')) document.getElementById('stat-a-hashtag-videos').innerText = formatNumber(hashtagCount);
      if (document.getElementById('stat-a-total-videos')) document.getElementById('stat-a-total-videos').innerText = formatNumber(totalV);
      if (document.getElementById('stat-a-organic-videos')) document.getElementById('stat-a-organic-videos').innerText = formatNumber(organicCount);
      if (document.getElementById('stat-a-top-views')) document.getElementById('stat-a-top-views').innerText = formatNumber(topV);
      if (document.getElementById('stat-a-favorites')) document.getElementById('stat-a-favorites').innerText = formatNumber(totalFav);

      // Render Top 10 Chart
      const top10 = filtered.slice(0, 10);
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      const ctxV = document.getElementById('chartVideo');
      if (ctxV) {
        if (chartVideo) chartVideo.destroy();
        chartVideo = new Chart(ctxV.getContext('2d'), {
          type: 'bar',
          data: {
            labels: top10.length ? top10.map(v => truncateWords(v.title, 6)) : ['Belum Ada Video'],
            datasets: [{
              label: 'Views',
              data: top10.length ? top10.map(v => v.views) : [0],
              backgroundColor: '#6366f1',
              borderRadius: 5
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: function(ctx) { return top10.length ? top10[ctx[0].dataIndex].title : ''; }
                }
              }
            }
          }
        });
      }

      // Render Interactive Table with Clickable Link Button
      const tbody = document.getElementById('video-perf-table-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-500">Belum ada data video pada filter/periode ini. Pilih "Semua Tanggal" atau upload file video performance.</td></tr>';
        return;
      }

      filtered.slice(0, 25).forEach((v, idx) => {
        const linkBtn = v.link
          ? `<a href="${v.link}" target="_blank" class="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 rounded-md text-[11px] transition shadow-xs"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open</a>`
          : `<span class="text-slate-400">-</span>`;

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-l-4 ${idx < 3 ? 'border-amber-400' : 'border-transparent'}">
            <td class="px-3 py-3 font-bold text-slate-500">#${idx + 1}</td>
            <td class="px-3 py-3 max-w-xs">
              <p class="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2" title="${v.title}">${v.title}</p>
              <div class="mt-1 flex items-center gap-2">
                ${getPillarBadgeHtml(v.pillar)}
              </div>
            </td>
            <td class="px-3 py-3 text-slate-500 whitespace-nowrap">${v.time ? v.time.slice(0, 16) : '-'}</td>
            <td class="px-3 py-3 text-right font-bold text-blue-600 dark:text-blue-400">${formatNumber(v.views)}</td>
            <td class="px-3 py-3 text-right text-rose-500 font-medium">${formatNumber(v.likes)}</td>
            <td class="px-3 py-3 text-right text-slate-600 dark:text-slate-400">${formatNumber(v.shares)}</td>
            <td class="px-3 py-3 text-right text-amber-500 font-medium">${formatNumber(v.favorites)}</td>
            <td class="px-3 py-3 text-center">${linkBtn}</td>
          </tr>
        `;
      });
    }

    // --- TAB 4: RENDER PRODUK & SALES (PER-VIDEO PERFORMANCE LIST) ---
    function renderSales() {
      const selMonthEl = document.getElementById('sales-month-filter');
      const monthFilterVal = selMonthEl ? selMonthEl.value : 'all';
      const sel = document.getElementById('sales-date-filter');
      const filterMode = sel ? sel.value : 'all';
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#cbd5e1' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      const allSalesVideos = Array.isArray(db.salesVideos) ? db.salesVideos : [];
      const monthFilteredVideos = allSalesVideos.filter(v => {
        if (!monthFilterVal || monthFilterVal === 'all') return true;
        if (monthFilterVal.startsWith('month:')) {
          const ym = monthFilterVal.replace('month:', '');
          if (v.reportMonth) return v.reportMonth === ym;
          return v.date && v.date.startsWith(ym);
        }
        return true;
      });

      const filteredVideos = monthFilteredVideos.filter(v => {
        const titleStr = String(v.title || '');
        const p = v.pillar || classifyContentPillar(titleStr);
        if (filterMode === 'with-gmv') return (v.gmv || 0) > 0;
        if (filterMode === 'hashtag') return titleStr.includes('#');
        if (filterMode === 'organic') return !titleStr.includes('#');
        if (filterMode.startsWith('pillar:')) {
          const targetPillar = filterMode.replace('pillar:', '');
          return p === targetPillar;
        }
        return true;
      });

      let s = {
        tVV: 0, tProdView: 0, tClick: 0, tOrder: 0, tItemsSold: 0,
        tGmvTotal: 0, tGmvDirect: 0, tGmvIndirect: 0,
        countRows: 0, sumGpm: 0, sumRet: 0, videos: [], tags: {}
      };

      filteredVideos.forEach(v => {
        const vv = Number(v.vv || 0);
        const pView = Number(v.impresi || 0);
        const pClick = Number(v.klik || 0);
        const pOrder = Number(v.order || 0);
        const itemsSold = Number(v.itemsSold !== undefined ? v.itemsSold : pOrder);
        const gmvTotal = Number(v.gmv || 0);
        const gDirect = Number(v.direct || 0);
        const gIndirect = Number(v.indirect || 0);
        const gpm = Number(v.gpm || 0);
        const ret = Number(v.ret || 0);

        s.tVV += vv;
        s.tProdView += pView;
        s.tClick += pClick;
        s.tOrder += pOrder;
        s.tItemsSold += itemsSold;
        s.tGmvTotal += gmvTotal;
        s.tGmvDirect += gDirect;
        s.tGmvIndirect += gIndirect;
        s.sumGpm += gpm;
        s.sumRet += ret;
        s.countRows++;
        s.videos.push(v);

        if (v.tags) {
          parseProductTags(v.tags).forEach(cleanT => {
            s.tags[cleanT] = (s.tags[cleanT] || 0) + 1;
          });
        }
      });

      // Sort videos by GMV descending (then by VV descending)
      s.videos.sort((a, b) => (b.gmv - a.gmv) || (b.vv - a.vv));

      const ctrPct = s.tProdView > 0 ? ((s.tClick / s.tProdView) * 100) : 0;
      const ctorPct = s.tClick > 0 ? ((s.tOrder / s.tClick) * 100) : 0;
      const hashtagCount = s.videos.filter(v => String(v.title || '').includes('#')).length;
      const avgGpm = s.tVV > 0 ? Math.round((s.tGmvTotal / s.tVV) * 1000) : (s.countRows > 0 ? (s.sumGpm / s.countRows) : 0);
      const avgRet = s.countRows > 0 ? (s.sumRet / s.countRows) : 0;

      document.getElementById('s-gmv').innerText = formatRp(s.tGmvTotal);
      if (document.getElementById('s-gmv-sub')) {
        document.getElementById('s-gmv-sub').innerText = `Direct: ${formatRp(s.tGmvDirect)} | Indirect: ${formatRp(s.tGmvIndirect)}`;
      }
      document.getElementById('s-sku').innerText = formatNumber(s.tOrder);
      if (document.getElementById('s-sku-sub')) {
        document.getElementById('s-sku-sub').innerText = `Produk Terjual: ${formatNumber(s.tItemsSold)} pcs`;
      }
      document.getElementById('s-vv').innerText = formatNumber(s.tVV);
      if (document.getElementById('s-vv-sub')) {
        document.getElementById('s-vv-sub').innerText = `Total Video: ${formatNumber(s.countRows)} (${hashtagCount} ber-#)`;
      }
      if (document.getElementById('s-impresi')) document.getElementById('s-impresi').innerText = formatNumber(s.tProdView);
      if (document.getElementById('s-klik-sub')) document.getElementById('s-klik-sub').innerText = `Klik: ${formatNumber(s.tClick)}`;
      if (document.getElementById('s-ctr')) document.getElementById('s-ctr').innerText = `${ctrPct.toFixed(2)}%`;
      if (document.getElementById('s-ctor-sub')) document.getElementById('s-ctor-sub').innerText = `CTOR: ${ctorPct.toFixed(2)}%`;
      document.getElementById('s-gpm').innerText = formatRp(avgGpm);
      if (document.getElementById('s-ret-sub')) {
        document.getElementById('s-ret-sub').innerText = `Avg Retensi Selesai: ${avgRet.toFixed(2)}%`;
      }

      // Funnel Chart
      const ctxFunnel = document.getElementById('chartFunnel');
      if (ctxFunnel) {
        if (chartFunnel) chartFunnel.destroy();
        let fData = [s.tVV, s.tProdView, s.tClick, s.tOrder];
        chartFunnel = new Chart(ctxFunnel.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Video Views (VV)', 'Produk Dilihat', 'Klik Produk', 'Pesanan SKU'],
            datasets: [{ data: fData, backgroundColor: ['#3b82f6', '#0ea5e9', '#f59e0b', '#10b981'], borderRadius: 6 }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { display: false } }
            }
          }
        });
      }

      // GMV Source (Direct vs Indirect)
      const ctxGMV = document.getElementById('chartGMVType');
      if (ctxGMV) {
        if (chartGMVType) chartGMVType.destroy();
        const hasGmv = (s.tGmvDirect + s.tGmvIndirect) > 0;
        let gData = hasGmv ? [s.tGmvDirect, s.tGmvIndirect] : [1];
        let gLabels = hasGmv ? ['Direct (GMV Video)', 'Indirect (GMV Tidak Langsung)'] : ['Belum Ada GMV'];
        let gColors = hasGmv ? ['#10b981', '#6366f1'] : ['#cbd5e1'];
        chartGMVType = new Chart(ctxGMV.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: gLabels,
            datasets: [{ data: gData, backgroundColor: gColors, borderWidth: 0 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 } } } }
          }
        });
      }

      // Scatter Plot GPM vs Retention (Creative Quadrant)
      const ctxScatter = document.getElementById('chartScatter');
      if (ctxScatter) {
        if (chartScatter) chartScatter.destroy();
        let scatterData = s.videos.map(v => ({ x: Number(v.ret || 0), y: Number(v.gpm || 0), rawObj: v }));
        chartScatter = new Chart(ctxScatter.getContext('2d'), {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Videos',
              data: scatterData,
              backgroundColor: 'rgba(245, 158, 11, 0.75)',
              borderColor: '#f59e0b',
              pointRadius: 6,
              pointHoverRadius: 9
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    return `Retensi: ${ctx.raw.x.toFixed(1)}% | GPM: ${formatRp(ctx.raw.y)} | ${truncateWords(ctx.raw.rawObj.title, 5)}`;
                  }
                }
              }
            },
            scales: {
              x: { title: { display: true, text: 'Retention Rate (%)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
              y: { title: { display: true, text: 'GPM (Rp / 1k views)', color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } }
            }
          }
        });
      }

      // 24H Best Time to Post Heatmap Chart (filtered by active month if selected)
      const ctxTime = document.getElementById('chartBestTime');
      if (ctxTime) {
        if (chartBestTime) chartBestTime.destroy();
        const activeTimeStats = (monthFilterVal && monthFilterVal !== 'all')
          ? rebuildGlobalTimeStats(filteredVideos)
          : (Object.keys(db.globalTimeStats || {}).length > 0 ? db.globalTimeStats : rebuildGlobalTimeStats(filteredVideos));
        let timeLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        let timeGmvData = new Array(24).fill(0);
        let bestHour = -1, maxGmvHour = 0;

        for (let i = 0; i < 24; i++) {
          if (activeTimeStats[i]) {
            timeGmvData[i] = activeTimeStats[i].gmv || 0;
            if (timeGmvData[i] > maxGmvHour) {
              maxGmvHour = timeGmvData[i];
              bestHour = i;
            }
          }
        }

        const insightBox = document.getElementById('best-time-insight');
        if (insightBox) {
          if (bestHour !== -1 && maxGmvHour > 0) {
            insightBox.innerHTML = `<i class="fa-solid fa-fire text-rose-500 mr-1"></i> Jam Terbaik: ${bestHour.toString().padStart(2, '0')}:00 - ${(bestHour + 1).toString().padStart(2, '0')}:00 (Peak GMV)`;
          } else {
            insightBox.innerHTML = `<i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> Insight: Belum ada data jam upload`;
          }
        }

        chartBestTime = new Chart(ctxTime.getContext('2d'), {
          type: 'bar',
          data: {
            labels: timeLabels,
            datasets: [{
              label: 'Total GMV Dihasilkan',
              data: timeGmvData,
              backgroundColor: timeGmvData.map((val, i) => i === bestHour && maxGmvHour > 0 ? '#ec4899' : '#6366f1'),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
              y: { ticks: { color: textColor, callback: function(val) { return formatRp(val); } }, grid: { color: gridColor } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // Most Tagged Products
      const tagsBody = document.getElementById('top-tags-body');
      if (tagsBody) {
        tagsBody.innerHTML = '';
        if (!s.tags || Object.keys(s.tags).length === 0) {
          tagsBody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-500">Belum ada data tags produk. Silakan upload file Produk & Sales (Per-Video).</td></tr>';
        } else {
          let sortedTags = Object.entries(s.tags).sort((a, b) => b[1] - a[1]).slice(0, 10);
          sortedTags.forEach((t, i) => {
            tagsBody.innerHTML += `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <td class="px-3 py-2"><span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold px-2 py-0.5 rounded">#${i + 1}</span></td>
                <td class="px-3 py-2"><p class="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-help" title="${t[0]}">${truncateWords(t[0], 10)}</p></td>
                <td class="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">${t[1]}x</td>
              </tr>`;
          });
        }
      }

      // Top Videos Sales Leaderboard Table (6 Columns) with Upload Month Filter, Multi-Sort, Search & Mini Summary Bar
      currentLeaderboardBaseVideos = s.videos || [];
      populateLeaderboardUploadMonthDropdown(currentLeaderboardBaseVideos);
      renderLeaderboardTable();

      // Render Smart Creative Diagnosis & Hook Extractor (Opsi 1)
      renderSmartDiagnosis(s.videos);
    }

    let currentLeaderboardBaseVideos = [];

    function populateLeaderboardUploadMonthDropdown(baseVideos) {
      const selEl = document.getElementById('leaderboard-upload-month-filter');
      const pillarSelEl = document.getElementById('leaderboard-pillar-filter');
      const pillsEl = document.getElementById('leaderboard-upload-month-pills');
      if (!selEl) return;

      const prevVal = selEl.value || 'all';
      const list = Array.isArray(baseVideos) ? baseVideos : [];
      const monthCounts = {};
      const pillarCounts = {};
      list.forEach(v => {
        if (v && v.date && /^\d{4}-\d{2}/.test(v.date)) {
          const ym = v.date.slice(0, 7);
          monthCounts[ym] = (monthCounts[ym] || 0) + 1;
        }
        const pName = (v && v.pillar) || 'General';
        pillarCounts[pName] = (pillarCounts[pName] || 0) + 1;
      });

      const sortedYms = Object.keys(monthCounts).sort().reverse();
      let optsHtml = `<option value="all">Semua Bulan Upload (${list.length} Video)</option>`;
      sortedYms.forEach(ym => {
        optsHtml += `<option value="${ym}">📤 Upload: ${formatMonthLabel(ym, false)} (${monthCounts[ym]} Video)</option>`;
      });
      selEl.innerHTML = optsHtml;
      selEl.value = (prevVal === 'all' || sortedYms.includes(prevVal)) ? prevVal : 'all';

      // Ide C: Populate Pillar Filter Dropdown dynamically from active brand pillars & detected pillars
      if (pillarSelEl) {
        const prevPillar = pillarSelEl.value || 'all';
        const activePillars = getActiveBrandPillars();
        const pillarMetaMap = {};
        activePillars.forEach(p => { pillarMetaMap[p.id] = p; });
        const allPillarIds = [];
        activePillars.forEach(p => { if (!allPillarIds.includes(p.id)) allPillarIds.push(p.id); });
        Object.keys(pillarCounts).forEach(pId => { if (!allPillarIds.includes(pId)) allPillarIds.push(pId); });

        let pOpts = `<option value="all">Semua Pilar Produk (${list.length} Video)</option>`;
        allPillarIds.forEach(pId => {
          const cnt = pillarCounts[pId] || 0;
          if (cnt === 0 && pId === 'General') return;
          const meta = pillarMetaMap[pId];
          const badgeLabel = meta ? (meta.badge || meta.id) : (pId === 'General' ? '✨ General' : `🏷️ ${pId}`);
          pOpts += `<option value="${pId}">${badgeLabel} (${cnt} Video)</option>`;
        });
        pillarSelEl.innerHTML = pOpts;
        pillarSelEl.value = (prevPillar === 'all' || allPillarIds.includes(prevPillar)) ? prevPillar : 'all';
      }

      if (pillsEl) {
        if (sortedYms.length === 0) {
          pillsEl.innerHTML = `<span class="text-[11px] text-slate-400">Belum ada tanggal upload terdeteksi pada daftar video.</span>`;
        } else {
          const activeVal = selEl.value;
          let pHtml = `<span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1"><i class="fa-solid fa-calendar-check text-amber-500 mr-1"></i>Pilih Cepat Bulan Upload:</span>`;
          const allActive = activeVal === 'all';
          pHtml += `<button type="button" onclick="setLeaderboardUploadMonth('all')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${allActive ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'}">Semua (${list.length})</button>`;
          sortedYms.slice(0, 8).forEach(ym => {
            const isAct = activeVal === ym;
            pHtml += `<button type="button" onclick="setLeaderboardUploadMonth('${ym}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${isAct ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'}">📤 ${formatMonthLabel(ym, true)} (${monthCounts[ym]})</button>`;
          });
          pillsEl.innerHTML = pHtml;
        }
      }
    }

    function setLeaderboardUploadMonth(ym) {
      const selEl = document.getElementById('leaderboard-upload-month-filter');
      if (selEl) {
        selEl.value = ym || 'all';
      }
      populateLeaderboardUploadMonthDropdown(currentLeaderboardBaseVideos);
      renderLeaderboardTable();
    }

    function resetLeaderboardFilters() {
      const uploadEl = document.getElementById('leaderboard-upload-month-filter');
      const pillarEl = document.getElementById('leaderboard-pillar-filter');
      const sortEl = document.getElementById('leaderboard-sort-select');
      const searchEl = document.getElementById('leaderboard-search-input');
      const limitEl = document.getElementById('leaderboard-limit-select');
      const dedupEl = document.getElementById('leaderboard-dedup-checkbox');
      if (uploadEl) uploadEl.value = 'all';
      if (pillarEl) pillarEl.value = 'all';
      if (sortEl) sortEl.value = 'gmv-desc';
      if (searchEl) searchEl.value = '';
      if (limitEl) limitEl.value = '20';
      if (dedupEl) dedupEl.checked = false;
      populateLeaderboardUploadMonthDropdown(currentLeaderboardBaseVideos);
      renderLeaderboardTable();
    }

    function toggleVideoTagsList(rowId) {
      const el = document.getElementById(`video-tags-expand-${rowId}`);
      if (el) {
        el.classList.toggle('hidden');
      }
    }

    // Ide B: 1-Click Manual Pillar Override + Lock directly from Leaderboard row
    function overrideVideoPillar(encodedTitle, videoDate, newVal) {
      const targetTitle = decodeURIComponent(encodedTitle || '').trim();
      const targetDate = String(videoDate || '').trim();
      if (!targetTitle) return;

      const applyOverrideToList = (list, bk) => {
        if (!Array.isArray(list)) return false;
        let touched = false;
        list.forEach(v => {
          if (!v) return;
          const sameTitle = String(v.title || '').trim() === targetTitle;
          const sameDate = !targetDate || !v.date || String(v.date).trim() === targetDate;
          if (sameTitle && sameDate) {
            if (newVal === '__AUTO__') {
              v.pillarLocked = false;
              const det = getPillarClassificationDetails(v.title, v.tags || '', bk);
              v.pillar = det.pillar;
              v.pillarSource = det.sourceLabel;
            } else {
              v.pillar = newVal;
              v.pillarLocked = true;
              v.pillarSource = 'Terkunci Manual';
            }
            touched = true;
          }
        });
        return touched;
      };

      const targetBrands = (activeBrandId === 'all') ? ['brand_1', 'brand_2'] : [activeBrandId];
      targetBrands.forEach(bk => {
        const b = brandsStore && brandsStore[bk];
        if (!b || !b.db) return;
        applyOverrideToList(b.db.salesVideos, bk);
        applyOverrideToList(b.db.videoList, bk);
      });

      const activeBk = (activeBrandId === 'all') ? 'brand_1' : activeBrandId;
      applyOverrideToList(db.salesVideos, activeBk);
      applyOverrideToList(db.videoList, activeBk);
      applyOverrideToList(currentLeaderboardBaseVideos, activeBk);

      if (activeBrandId === 'all') {
        syncActiveBrandPointers();
      }
      saveToStorage();
      renderSales();
      if (typeof showToast === 'function') {
        const msg = newVal === '__AUTO__'
          ? 'Pilar produk dikembalikan ke Auto-Detect!'
          : `Pilar produk dikunci manual ke "${newVal}"!`;
        showToast(msg, 'success');
      }
    }

    function renderLeaderboardTable() {
      const vBody = document.getElementById('top-videos-sales-body');
      const summaryBar = document.getElementById('leaderboard-summary-bar');
      const badgeEl = document.getElementById('leaderboard-active-filter-badge');
      const pillsEl = document.getElementById('leaderboard-upload-month-pills');
      if (!vBody) return;

      const uploadYm = (document.getElementById('leaderboard-upload-month-filter') && document.getElementById('leaderboard-upload-month-filter').value) || 'all';
      const pillarFilter = (document.getElementById('leaderboard-pillar-filter') && document.getElementById('leaderboard-pillar-filter').value) || 'all';
      const sortBy = (document.getElementById('leaderboard-sort-select') && document.getElementById('leaderboard-sort-select').value) || 'gmv-desc';
      const searchQ = ((document.getElementById('leaderboard-search-input') && document.getElementById('leaderboard-search-input').value) || '').trim().toLowerCase();
      const limitVal = (document.getElementById('leaderboard-limit-select') && document.getElementById('leaderboard-limit-select').value) || '20';
      const dedupChecked = Boolean(document.getElementById('leaderboard-dedup-checkbox') && document.getElementById('leaderboard-dedup-checkbox').checked);

      // Refresh quick pill active styling
      if (pillsEl && currentLeaderboardBaseVideos.length > 0) {
        Array.from(pillsEl.querySelectorAll('button')).forEach(btn => {
          const onClickAttr = btn.getAttribute('onclick') || '';
          const isMatch = onClickAttr.includes(`'${uploadYm}'`);
          btn.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${isMatch ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'}`;
        });
      }

      let workingList = [...(currentLeaderboardBaseVideos || [])];

      // Optional Cross-Archive Deduplication (Ide 1: combine identical video uploaded on same date across Sep & Oct archives)
      if (dedupChecked && workingList.length > 0) {
        const dedupMap = new Map();
        workingList.forEach(v => {
          const key = `${String(v.title || '').trim().toLowerCase()}||${v.date || ''}`;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, {
              ...v,
              _archives: v.reportMonth ? [v.reportMonth] : [],
              _retSum: Number(v.ret || 0),
              _retCount: 1
            });
          } else {
            const ex = dedupMap.get(key);
            ex.vv = (Number(ex.vv) || 0) + (Number(v.vv) || 0);
            ex.impresi = (Number(ex.impresi) || 0) + (Number(v.impresi) || 0);
            ex.klik = (Number(ex.klik) || 0) + (Number(v.klik) || 0);
            ex.order = (Number(ex.order) || 0) + (Number(v.order) || 0);
            ex.itemsSold = (Number(ex.itemsSold || ex.order) || 0) + (Number(v.itemsSold || v.order) || 0);
            ex.gmv = (Number(ex.gmv) || 0) + (Number(v.gmv) || 0);
            ex.direct = (Number(ex.direct) || 0) + (Number(v.direct) || 0);
            ex.indirect = (Number(ex.indirect) || 0) + (Number(v.indirect) || 0);
            ex._retSum += Number(v.ret || 0);
            ex._retCount += 1;
            ex.ret = ex._retSum / ex._retCount;
            ex.gpm = ex.vv > 0 ? Math.round((ex.gmv / ex.vv) * 1000) : ex.gpm;
            if (v.reportMonth && !ex._archives.includes(v.reportMonth)) {
              ex._archives.push(v.reportMonth);
            }
          }
        });
        workingList = Array.from(dedupMap.values());
      }

      // 1. Filter by specific Upload Month (v.date)
      if (uploadYm !== 'all') {
        workingList = workingList.filter(v => v.date && v.date.startsWith(uploadYm));
      }

      // 1b. Filter by specific Product Pillar (Ide C)
      if (pillarFilter !== 'all') {
        workingList = workingList.filter(v => (v.pillar || 'General') === pillarFilter);
      }

      // 2. Filter by instant Search query (title, #hashtag, pillar, or product tags)
      if (searchQ) {
        workingList = workingList.filter(v => {
          const t = String(v.title || '').toLowerCase();
          const p = String(v.pillar || '').toLowerCase();
          const tg = String(v.tags || '').toLowerCase();
          return t.includes(searchQ) || p.includes(searchQ) || tg.includes(searchQ);
        });
      }

      // 3. Multi-Metric Sorting
      const getCtrVal = (item) => (Number(item.impresi || 0) > 0 ? ((Number(item.klik || 0) / Number(item.impresi)) * 100) : 0);
      workingList.sort((a, b) => {
        switch (sortBy) {
          case 'vv-desc':
            return ((Number(b.vv) || 0) - (Number(a.vv) || 0)) || ((Number(b.gmv) || 0) - (Number(a.gmv) || 0));
          case 'order-desc':
            return ((Number(b.order) || 0) - (Number(a.order) || 0)) || ((Number(b.gmv) || 0) - (Number(a.gmv) || 0));
          case 'ctr-desc':
            return (getCtrVal(b) - getCtrVal(a)) || ((Number(b.klik) || 0) - (Number(a.klik) || 0));
          case 'klik-desc':
            return ((Number(b.klik) || 0) - (Number(a.klik) || 0)) || ((Number(b.impresi) || 0) - (Number(a.impresi) || 0));
          case 'impresi-desc':
            return ((Number(b.impresi) || 0) - (Number(a.impresi) || 0)) || ((Number(b.klik) || 0) - (Number(a.klik) || 0));
          case 'gpm-desc':
            return ((Number(b.gpm) || 0) - (Number(a.gpm) || 0)) || ((Number(b.gmv) || 0) - (Number(a.gmv) || 0));
          case 'ret-desc':
            return ((Number(b.ret) || 0) - (Number(a.ret) || 0)) || ((Number(b.vv) || 0) - (Number(a.vv) || 0));
          case 'date-desc':
            return String(b.date || '').localeCompare(String(a.date || '')) || ((Number(b.gmv) || 0) - (Number(a.gmv) || 0));
          case 'date-asc':
            return String(a.date || '9999-99-99').localeCompare(String(b.date || '9999-99-99')) || ((Number(b.gmv) || 0) - (Number(a.gmv) || 0));
          case 'gmv-desc':
          default:
            return ((Number(b.gmv) || 0) - (Number(a.gmv) || 0)) || ((Number(b.vv) || 0) - (Number(a.vv) || 0));
        }
      });

      // 4. Compute Aggregated Metrics for Filtered Videos (Ide 1: Mini Summary Bar)
      let fVV = 0, fImpresi = 0, fKlik = 0, fOrder = 0, fGmv = 0, fHashtag = 0;
      workingList.forEach(v => {
        fVV += Number(v.vv || 0);
        fImpresi += Number(v.impresi || 0);
        fKlik += Number(v.klik || 0);
        fOrder += Number(v.order || 0);
        fGmv += Number(v.gmv || 0);
        if (String(v.title || '').includes('#')) fHashtag++;
      });
      const fCtr = fImpresi > 0 ? ((fKlik / fImpresi) * 100) : 0;
      const fCtor = fKlik > 0 ? ((fOrder / fKlik) * 100) : 0;

      if (badgeEl) {
        const monthTag = uploadYm === 'all' ? 'Semua Bulan Upload' : `Upload ${formatMonthLabel(uploadYm, false)}`;
        const pillarTag = pillarFilter === 'all' ? '' : ` • Pilar: ${pillarFilter}`;
        badgeEl.innerText = `${monthTag}${pillarTag} • ${workingList.length} Video`;
      }

      if (summaryBar) {
        const scopeLabel = uploadYm === 'all' ? 'Seluruh Bulan Upload' : `Khusus Upload ${formatMonthLabel(uploadYm, false)}`;
        const pillarScope = pillarFilter === 'all' ? '' : ` • ${pillarFilter}`;
        summaryBar.innerHTML = `
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/70">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Video Terfilter (${scopeLabel}${pillarScope})</span>
            <div class="text-sm font-black text-slate-800 dark:text-white mt-0.5">${formatNumber(workingList.length)} Video <span class="text-[10px] font-bold text-pink-500">(${fHashtag} ber-#)</span></div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/70">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Akumulasi Views (VV)</span>
            <div class="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">${formatNumber(fVV)}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/70">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Impresi / Klik Produk (Avg CTR)</span>
            <div class="text-sm font-black text-cyan-600 dark:text-cyan-400 mt-0.5">${formatNumber(fImpresi)} / ${formatNumber(fKlik)} <span class="text-[10px] font-extrabold text-amber-500">(${fCtr.toFixed(2)}%)</span></div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/70">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Pesanan SKU</span>
            <div class="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">${formatNumber(fOrder)} SKU <span class="text-[10px] font-semibold text-slate-400">(CTOR ${fCtor.toFixed(2)}%)</span></div>
          </div>
          <div class="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Total GMV Video Terfilter</span>
            <div class="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">${formatRp(fGmv)}</div>
          </div>
        `;
      }

      // 5. Render Table Rows
      vBody.innerHTML = '';
      if (workingList.length === 0) {
        const emptyReason = (currentLeaderboardBaseVideos || []).length === 0
          ? 'Belum ada data performa video sales. Silakan upload file Produk & Sales di atas.'
          : `Tidak ada video yang cocok dengan filter saat ini. Klik tombol <strong>Reset</strong> untuk melihat semua video.`;
        vBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500">${emptyReason}</td></tr>`;
        return;
      }

      const maxRows = limitVal === 'all' ? workingList.length : (parseInt(limitVal, 10) || 20);
      const displayList = workingList.slice(0, maxRows);
      const activePillarsList = getActiveBrandPillars();

      displayList.forEach((v, i) => {
        const vCtr = (v.impresi || 0) > 0 ? (((v.klik || 0) / v.impresi) * 100).toFixed(2) : '0.00';
        const uploadDateBadge = v.date
          ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 font-mono" title="Tanggal Video Di-upload / Diposting ke TikTok">📤 Upload: ${v.date}</span>`
          : '';
        const archiveLabel = (v._archives && v._archives.length > 1)
          ? v._archives.map(ym => formatMonthLabel(ym, true)).join(' + ')
          : (v.reportMonth ? formatMonthLabel(v.reportMonth, true) : '');
        const archiveBadge = archiveLabel
          ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" title="Bulan laporan saat omzet/views ini tercatat">🗄️ Arsip ${archiveLabel}</span>`
          : '';

        // Ide A: Primary Tagged Product (#1) + Expandable Yellow Basket List
        const parsedTags = parseProductTags(v.tags || '');
        const firstTag = parsedTags.length > 0 ? parsedTags[0] : '';
        const extraTagsCount = parsedTags.length > 1 ? (parsedTags.length - 1) : 0;
        const detSource = v.pillarLocked
          ? '🔒 Terkunci Manual'
          : (v.pillarSource || getPillarClassificationDetails(v.title, v.tags || '').sourceLabel || 'Auto-Detect');
        let taggedProductHtml = '';
        if (firstTag) {
          const safeFirstTag = firstTag.replace(/"/g, '&quot;');
          const expandBtn = extraTagsCount > 0
            ? `<button type="button" onclick="toggleVideoTagsList(${i})" class="ml-1 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-300 transition cursor-pointer" title="Klik untuk melihat semua ${parsedTags.length} produk di keranjang kuning">+${extraTagsCount} produk lainnya</button>`
            : '';
          const expandListHtml = extraTagsCount > 0
            ? `<div id="video-tags-expand-${i}" class="hidden mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                <div class="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 mb-1">Daftar Produk di Keranjang Kuning (${parsedTags.length} SKU):</div>
                ${parsedTags.map((pt, idx) => `<div class="truncate ${idx === 0 ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}">#${idx + 1}. ${pt}</div>`).join('')}
               </div>`
            : '';
          taggedProductHtml = `
            <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1">
              <span class="inline-flex items-center gap-1 max-w-full truncate" title="Produk Utama (#1) di Keranjang Kuning: ${safeFirstTag}">
                <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">🛍️ Produk #1:</span>
                <span class="truncate font-medium text-slate-600 dark:text-slate-300">${truncateWords(firstTag, 8)}</span>
              </span>
              ${expandBtn}
            </div>
            ${expandListHtml}`;
        }

        // Ide B: 1-Click Manual Pillar Override + Lock control
        const encodedTitle = encodeURIComponent(String(v.title || '').trim());
        const safeDate = String(v.date || '').trim();
        let overrideOptions = activePillarsList.map(p => {
          const isSel = (v.pillar === p.id) ? 'selected' : '';
          return `<option value="${p.id}" ${isSel}>${p.badge || p.id}</option>`;
        }).join('');
        if (v.pillarLocked) {
          overrideOptions += `<option value="__AUTO__">🔄 Reset ke Auto-Detect</option>`;
        }
        const lockIcon = v.pillarLocked
          ? `<span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold" title="Pilar dikunci manual. Pilih 'Reset ke Auto-Detect' untuk membuka kunci.">🔒</span>`
          : '';
        const interactivePillarBadge = `
          <span class="relative inline-flex items-center gap-0.5 group" title="Sumber Deteksi: ${detSource}. Klik untuk ubah/kunci pilar produk secara manual.">
            ${getPillarBadgeHtml(v.pillar)}
            ${lockIcon}
            <select onchange="overrideVideoPillar('${encodedTitle}', '${safeDate}', this.value)" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Klik untuk ganti pilar produk (${detSource})">
              ${overrideOptions}
            </select>
          </span>`;

        vBody.innerHTML += `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition border-l-4 ${i < 3 ? 'border-amber-400' : 'border-transparent'}">
            <td class="px-5 py-3"><span class="${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} text-xs font-bold px-2.5 py-1 rounded-full">#${i + 1}</span></td>
            <td class="px-5 py-3 max-w-sm">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-200" title="${String(v.title || '').replace(/"/g, '&quot;')}">${truncateWords(v.title, 14)}</p>
              ${taggedProductHtml}
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                ${interactivePillarBadge}
                ${uploadDateBadge}
                ${archiveBadge}
                <span class="text-[11px] text-slate-400">GPM: ${formatRp(v.gpm)}</span>
                <span class="text-[11px] text-slate-400">• Retensi: ${Number(v.ret || 0).toFixed(1)}%</span>
              </div>
            </td>
            <td class="px-5 py-3 text-right font-medium text-slate-600 dark:text-slate-300">${formatNumber(v.vv)}</td>
            <td class="px-5 py-3 text-right">
              <div class="text-xs font-semibold text-slate-700 dark:text-slate-200">${formatNumber(v.impresi || 0)} / ${formatNumber(v.klik || 0)}</div>
              <span class="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">CTR: ${vCtr}%</span>
            </td>
            <td class="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">${formatNumber(v.order)}</td>
            <td class="px-5 py-3 text-right font-bold text-emerald-600">${formatRp(v.gmv)}</td>
          </tr>`;
      });
    }

    // --- SMART CREATIVE DIAGNOSIS & HOOK PATTERN ANALYZER (OPSI 1) ---
    function renderSmartDiagnosis(videosList) {
      const container = document.getElementById('diagnosis-quadrant-cards');
      const keywordsContainer = document.getElementById('winning-keywords-container');
      const recText = document.getElementById('pillar-recommendation-text');
      const balanceBadge = document.getElementById('pillar-balance-badge');
      if (!container) return;

      const videos = videosList || [];

      if (videos.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <i class="fa-solid fa-wand-magic-sparkles text-2xl text-amber-400 mb-2"></i>
            <p class="text-xs">Belum ada data video untuk diagnosa kreatif. Silakan upload file video sales di atas.</p>
          </div>
        `;
        if (keywordsContainer) keywordsContainer.innerHTML = '<span class="text-xs text-slate-400">Belum ada kata kunci. Upload data video sales untuk melihat analisis.</span>';
        if (recText) recText.innerHTML = 'Upload file video untuk mendapatkan rekomendasi alokasi pilar konten minggu depan.';
        if (balanceBadge) balanceBadge.innerHTML = '<i class="fa-solid fa-chart-pie"></i> Menunggu Upload Data';
        return;
      }

      // Group into 4 quadrants
      const q1 = videos.filter(v => (v.ret || 0) >= 2.5 && (v.gpm || 0) >= 150000);
      const q2 = videos.filter(v => (v.ret || 0) >= 2.5 && (v.gpm || 0) < 150000);
      const q3 = videos.filter(v => (v.ret || 0) < 2.5 && (v.gpm || 0) >= 150000);
      const q4 = videos.filter(v => (v.ret || 0) < 2.5 && (v.gpm || 0) < 150000);

      container.innerHTML = `
        <div class="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-star text-amber-500"></i> Star Performers
              </span>
              <span class="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full">${q1.length} Video</span>
            </div>
            <p class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">Retensi Tinggi (≥2.5%) & GPM Tinggi (≥Rp 150K)</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              ${q1.length > 0 ? `Formula winning! Top: "<em>${truncateWords(q1[0].title, 6)}</em>". Scale-up dengan TikTok Promote & remake konsep serupa.` : 'Belum ada video di kuadran ini.'}
            </p>
          </div>
          <div class="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[10px] font-bold text-emerald-600">
            Aksi: Replicate Hook & Boost Ads
          </div>
        </div>

        <div class="bg-blue-50/70 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-eye text-blue-500"></i> Viral Hook, Low Convert
              </span>
              <span class="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-0.5 rounded-full">${q2.length} Video</span>
            </div>
            <p class="text-[11px] font-semibold text-blue-600 dark:text-blue-300">Retensi Tinggi (≥2.5%) tapi GPM Rendah</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              ${q2.length > 0 ? `Audiens betah nonton ("<em>${truncateWords(q2[0].title, 6)}</em>"), tapi konversi kecil. Tambahkan CTA keranjang kuning di 5 detik akhir & voucher diskon.` : 'Belum ada video di kuadran ini.'}
            </p>
          </div>
          <div class="mt-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-[10px] font-bold text-blue-600">
            Aksi: Perkuat CTA & Promo Urgensi
          </div>
        </div>

        <div class="bg-amber-50/70 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-bolt text-amber-500"></i> Impulse Cash Cow
              </span>
              <span class="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">${q3.length} Video</span>
            </div>
            <p class="text-[11px] font-semibold text-amber-600 dark:text-amber-300">GPM Tinggi (≥Rp 150K) tapi Retensi Rendah</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              ${q3.length > 0 ? `Produk sangat diminati pembeli ("<em>${truncateWords(q3[0].title, 6)}</em>"). Perbaiki hook 3 detik awal agar retensi naik dan traffic melonjak.` : 'Belum ada video di kuadran ini.'}
            </p>
          </div>
          <div class="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[10px] font-bold text-amber-600">
            Aksi: Optimasi Hook Visual Detik Awal
          </div>
        </div>

        <div class="bg-rose-50/70 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800/60 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-rotate-left text-rose-500"></i> Underperforming
              </span>
              <span class="bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold px-2 py-0.5 rounded-full">${q4.length} Video</span>
            </div>
            <p class="text-[11px] font-semibold text-rose-600 dark:text-rose-300">Retensi Rendah (<2.5%) & GPM Rendah</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Audiens cepat skip dan tidak checkout. Hindari format intro yang lambat atau hard-selling tanpa edukasi problem-solving.
            </p>
          </div>
          <div class="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-[10px] font-bold text-rose-600">
            Aksi: Pivot Konsep & Ganti Angle Naskah
          </div>
        </div>
      `;

      // Extract winning keywords & hooks from titles (dynamic across RAPAtech, MONTRA, and custom brand pillars)
      const keywordDict = {};
      const activePillars = getActiveBrandPillars();
      const dynamicPillarKws = [];
      activePillars.forEach(p => {
        if (Array.isArray(p.keywords)) {
          p.keywords.forEach(k => { if (k) dynamicPillarKws.push(String(k).toLowerCase()); });
        }
      });
      const targetKeywords = Array.from(new Set([
        '#iphone18pro', '#iphone17', '#iphone15', '#iphone16', 'iphone', 'charger', 'mfi', 'gan', 'avs',
        'powerbank', 'origin loop', 'origin on', 'origin link', 'magsafe', 'wireless',
        'case', 'clear case', 'aero case', 'ice clear', 'yellowing', 'nguning', 'anti kuning',
        'casing orbit', 'casing clear', 'casing leather', 'leather case', 'orbit stand', '#montra', '#casingorbit', '#casingclear', '#casingleather',
        'tempered glass', 'anti reflection', 'anti spy', 'privacy glass', 'ar', 'tips', 'promo', '10.10', 'battery health',
        ...dynamicPillarKws
      ]));

      videos.forEach(v => {
        const titleLower = String(v.title || '').toLowerCase();
        targetKeywords.forEach(kw => {
          if (titleLower.includes(kw)) {
            if (!keywordDict[kw]) keywordDict[kw] = { count: 0, gmv: 0, views: 0 };
            keywordDict[kw].count++;
            keywordDict[kw].gmv += (v.gmv || 0);
            keywordDict[kw].views += (v.vv || 0);
          }
        });
      });

      const sortedKws = Object.entries(keywordDict).sort((a, b) => b[1].gmv - a[1].gmv).slice(0, 8);

      if (sortedKws.length > 0) {
        keywordsContainer.innerHTML = sortedKws.map(([kw, data]) => `
          <div class="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-2xs">
            <span class="text-xs font-bold text-slate-800 dark:text-white capitalize">${kw}</span>
            <span class="text-[10px] font-extrabold text-emerald-600">${formatRp(data.gmv)}</span>
            <span class="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded font-bold">${data.count}x</span>
          </div>
        `).join('');
      } else {
        keywordsContainer.innerHTML = '<span class="text-xs text-slate-400">Tidak ada kata kunci terdeteksi.</span>';
      }

      // Calculate Pillar Strategic Opportunity dynamically based on active brand pillars
      const pillarStats = {};
      activePillars.forEach(p => { pillarStats[p.id] = { gmv: 0, count: 0 }; });
      let totalGmv = 0;
      videos.forEach(v => {
        const p = (v.pillar && pillarStats[v.pillar]) ? v.pillar : classifyContentPillar(v.title, v.tags || '');
        const key = pillarStats[p] ? p : (activePillars[0] && activePillars[0].id);
        if (key && pillarStats[key]) {
          pillarStats[key].gmv += (v.gmv || 0);
          pillarStats[key].count++;
          totalGmv += (v.gmv || 0);
        }
      });

      let topGmvPillar = (activePillars[0] && activePillars[0].id) || 'Utama', maxPillarGmv = 0;
      let underPillar = null, maxDisparity = -999;

      Object.entries(pillarStats).forEach(([pName, pData]) => {
        if (pData.gmv > maxPillarGmv) {
          maxPillarGmv = pData.gmv;
          topGmvPillar = pName;
        }
        const gmvShare = totalGmv > 0 ? (pData.gmv / totalGmv) * 100 : 0;
        const videoShare = videos.length > 0 ? (pData.count / videos.length) * 100 : 0;
        const disparity = gmvShare - videoShare;
        if (disparity > maxDisparity && pData.gmv > 0) {
          maxDisparity = disparity;
          underPillar = { name: pName, gmvShare: gmvShare.toFixed(0), videoShare: videoShare.toFixed(0) };
        }
      });

      if (underPillar && maxDisparity > 5) {
        recText.innerHTML = `
          <p class="font-bold text-slate-800 dark:text-white mb-1"><i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> Peluang: Tingkatkan Kuota Pilar <strong>${underPillar.name}</strong></p>
          <p>Pilar ini menyumbang <strong>${underPillar.gmvShare}% dari total GMV</strong>, namun hanya mendapatkan <strong>${underPillar.videoShare}% dari total video</strong>. Menambah 2-3 slot video untuk pilar ini berpotensi meningkatkan omzet mingguan secara signifikan.</p>
        `;
        balanceBadge.innerHTML = `<i class="fa-solid fa-chart-pie text-emerald-500 mr-1"></i> Top GMV: ${topGmvPillar} (${((maxPillarGmv/totalGmv)*100).toFixed(0)}%)`;
      } else {
        recText.innerHTML = `
          <p class="font-bold text-slate-800 dark:text-white mb-1"><i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i> Alokasi Pilar Konten Seimbang</p>
          <p>Pilar <strong>${topGmvPillar}</strong> mendominasi kontribusi pendapatan. Pastikan tim tetap menjaga konsistensi jadwal posting harian.</p>
        `;
        balanceBadge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i> Distribusi Konten Baik`;
      }
    }

    // --- WORKSPACE VIEW SWITCHER (KANBAN, CALENDAR, SCORECARD - OPSI 3 & 4) ---
    let currentWorkspaceView = 'kanban';
    let calYear = 2026;
    let calMonth = 9; // October (0-indexed: 9 = October)
    const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    function switchWorkspaceView(view) {
      currentWorkspaceView = view;
      ['kanban', 'calendar', 'scorecard'].forEach(v => {
        const btn = document.getElementById(`btn-ws-${v}`);
        const viewEl = document.getElementById(`workspace-view-${v}`);
        if (v === view) {
          if (btn) btn.className = "px-3.5 py-1.5 font-bold rounded-lg bg-blue-600 text-white shadow-xs transition flex items-center gap-1.5";
          if (viewEl) viewEl.classList.remove('hidden');
        } else {
          if (btn) btn.className = "px-3.5 py-1.5 font-bold rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 transition flex items-center gap-1.5";
          if (viewEl) viewEl.classList.add('hidden');
        }
      });

      renderWorkspace();
    }

    let kanbanMemberFilter = 'all';

    function populateAssigneeDropdowns() {
      const roster = ensureTeamRoster(db);
      const labels = roster.map(m => getMemberDisplayLabel(m));

      // Also include any historical assignees in db.todos so no task assignee disappears from dropdowns
      (db.todos || []).forEach(t => {
        if (t.assignee && !labels.includes(t.assignee)) {
          labels.push(t.assignee);
        }
      });

      const todoSelect = document.getElementById('todo-assignee');
      if (todoSelect) {
        const prevVal = todoSelect.value;
        todoSelect.innerHTML = labels.map(lbl => `<option value="${lbl.replace(/"/g, '&quot;')}">${lbl}</option>`).join('');
        if (labels.includes(prevVal)) todoSelect.value = prevVal;
      }

      const modalSelect = document.getElementById('modal-task-assignee');
      if (modalSelect) {
        const prevModalVal = modalSelect.value;
        modalSelect.innerHTML = labels.map(lbl => `<option value="${lbl.replace(/"/g, '&quot;')}">${lbl}</option>`).join('');
        if (labels.includes(prevModalVal)) modalSelect.value = prevModalVal;
      }

      const badgeEl = document.getElementById('team-count-badge');
      if (badgeEl) badgeEl.innerText = roster.length;
    }

    function renderWorkspace() {
      populateAssigneeDropdowns();
      if (currentWorkspaceView === 'kanban') renderTodos();
      else if (currentWorkspaceView === 'calendar') renderCalendarView();
      else if (currentWorkspaceView === 'scorecard') renderTeamScorecard();
    }

    // --- CONTENT CALENDAR VIEW (OPSI 3) ---
    function prevCalMonth() {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendarView();
    }

    function nextCalMonth() {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendarView();
    }

    function todayCalMonth() {
      const now = new Date();
      calYear = now.getFullYear();
      calMonth = now.getMonth();
      renderCalendarView();
    }

    function renderCalendarView() {
      const titleEl = document.getElementById('cal-month-title');
      const gridEl = document.getElementById('calendar-grid-cells');
      const totalSchedEl = document.getElementById('cal-total-scheduled');
      const gapBadgeEl = document.getElementById('cal-gap-badge');
      if (!gridEl) return;

      if (titleEl) titleEl.innerText = `${MONTH_NAMES_ID[calMonth]} ${calYear}`;

      const firstDayOfMonth = new Date(calYear, calMonth, 1);
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      let startDayOfWeek = firstDayOfMonth.getDay() - 1;
      if (startDayOfWeek === -1) startDayOfWeek = 6;

      const todosByDate = {};
      let scheduledCount = 0;
      (db.todos || []).forEach(t => {
        if (t.due) {
          if (!todosByDate[t.due]) todosByDate[t.due] = [];
          todosByDate[t.due].push(t);
          const dueParts = t.due.split('-');
          if (Number(dueParts[0]) === calYear && Number(dueParts[1]) === (calMonth + 1)) {
            scheduledCount++;
          }
        }
      });

      if (totalSchedEl) totalSchedEl.innerHTML = `<i class="fa-solid fa-video text-[11px]"></i> ${scheduledCount} Terjadwal`;

      gridEl.innerHTML = '';

      for (let i = 0; i < startDayOfWeek; i++) {
        const blank = document.createElement('div');
        blank.className = 'min-h-[105px] p-2 bg-slate-50/40 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/50 opacity-40';
        gridEl.appendChild(blank);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      let daysWithTasks = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = todosByDate[dayStr] || [];
        const isToday = (dayStr === todayStr);
        if (dayTasks.length > 0) daysWithTasks++;

        const cell = document.createElement('div');
        cell.className = `min-h-[105px] p-2 rounded-xl border flex flex-col justify-between transition hover:shadow-md ${
          isToday 
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80'
        }`;

        let tasksHtml = '';
        if (dayTasks.length > 0) {
          tasksHtml = dayTasks.slice(0, 3).map(t => {
            const pBadge = t.priority === 'High' ? '🔴' : '';
            return `
              <div onclick="openNoteModal(${t.id})" class="text-[10px] p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 truncate cursor-pointer transition flex items-center justify-between gap-1 border border-slate-200 dark:border-slate-700 shadow-2xs" title="${t.title} (${t.assignee || 'Unassigned'})">
                <span class="truncate font-semibold">${pBadge} ${truncateWords(t.title, 4)}</span>
                <span class="text-[9px] font-bold text-blue-500 shrink-0">${t.assignee ? t.assignee.split(' ')[0] : ''}</span>
              </div>
            `;
          }).join('');
          if (dayTasks.length > 3) {
            tasksHtml += `<div class="text-[9px] text-slate-400 text-center font-bold">+${dayTasks.length - 3} lainnya</div>`;
          }
        } else {
          tasksHtml = `
            <div onclick="quickAddCalendarTask('${dayStr}')" class="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-blue-500 hover:border-blue-400 cursor-pointer transition py-2 opacity-0 hover:opacity-100">
              <i class="fa-solid fa-plus mr-1"></i> Slot Post
            </div>
          `;
        }

        cell.innerHTML = `
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-black ${isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-full' : 'text-slate-700 dark:text-slate-300'}">${day}</span>
              ${dayTasks.length > 0 ? `<span class="text-[9px] font-bold text-slate-400">${dayTasks.length} Post</span>` : ''}
            </div>
            <div class="space-y-1">${tasksHtml}</div>
          </div>
        `;

        gridEl.appendChild(cell);
      }

      const gapDays = daysInMonth - daysWithTasks;
      if (gapBadgeEl) {
        if (gapDays > 0) {
          gapBadgeEl.className = "px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1";
          gapBadgeEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-[11px]"></i> ${gapDays} Hari Belum Terjadwal`;
        } else {
          gapBadgeEl.className = "px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1";
          gapBadgeEl.innerHTML = `<i class="fa-solid fa-circle-check text-[11px]"></i> Jadwal Harian Terpenuhi`;
        }
      }
    }

    function quickAddCalendarTask(dateStr) {
      switchWorkspaceView('kanban');
      const dueInput = document.getElementById('todo-due');
      const titleInput = document.getElementById('todo-title');
      if (dueInput) dueInput.value = dateStr;
      if (titleInput) {
        titleInput.focus();
        showToast(`Pilih ide konten untuk jadwal posting ${dateStr}`, 'info');
      }
    }

    // --- TEAM & TALENT PRODUCTIVITY SCORECARD (OPSI 4 + CUSTOM PERSONNEL & QUOTA) ---
    function renderTeamScorecard() {
      const grid = document.getElementById('team-scorecard-grid');
      const totalTasksEl = document.getElementById('sc-total-tasks');
      const completedTasksEl = document.getElementById('sc-completed-tasks');
      const onTimeRateEl = document.getElementById('sc-ontime-rate');
      const starMemberEl = document.getElementById('sc-star-member');
      if (!grid) return;

      const roster = ensureTeamRoster(db);
      const allTodos = db.todos || [];
      const activeBrandLabel = activeBrandId === 'all'
        ? 'Multi-Brand Crew'
        : `${(brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand'} Crew`;

      const stats = {};
      roster.forEach(m => {
        const label = getMemberDisplayLabel(m);
        stats[label] = {
          id: m.id,
          label,
          displayName: m.name,
          role: m.role || 'Team Member',
          color: m.color || 'blue',
          icon: m.icon || getRoleIconByColorOrRole(m.role, m.color),
          monthlyQuota: Number(m.monthlyQuota) > 0 ? Number(m.monthlyQuota) : 15,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          tasks: []
        };
      });

      const today = new Date().toISOString().slice(0, 10);
      let totalCompleted = 0;
      let totalOnTimeCount = 0;

      allTodos.forEach(t => {
        const a = t.assignee || (roster[0] ? getMemberDisplayLabel(roster[0]) : 'Team (All Crew)');
        if (!stats[a]) {
          const match = String(a).match(/^(.+?)\s*\((.+)\)$/);
          const parsedName = match ? match[1].trim() : a;
          const parsedRole = match ? match[2].trim() : 'Team Member';
          stats[a] = {
            id: null,
            label: a,
            displayName: parsedName,
            role: parsedRole,
            color: 'blue',
            icon: getRoleIconByColorOrRole(parsedRole, 'blue'),
            monthlyQuota: 15,
            total: 0,
            completed: 0,
            inProgress: 0,
            overdue: 0,
            tasks: []
          };
        }
        stats[a].total++;
        stats[a].tasks.push(t);

        if (t.stage === 'Published') {
          stats[a].completed++;
          totalCompleted++;
          totalOnTimeCount++;
        } else {
          stats[a].inProgress++;
          if (t.due && t.due < today) {
            stats[a].overdue++;
          } else {
            totalOnTimeCount++;
          }
        }
      });

      if (totalTasksEl) totalTasksEl.innerText = allTodos.length;
      if (completedTasksEl) completedTasksEl.innerText = totalCompleted;
      const overallOnTime = allTodos.length > 0 ? Math.round((totalOnTimeCount / allTodos.length) * 100) : 100;
      if (onTimeRateEl) onTimeRateEl.innerText = `${overallOnTime}%`;

      let starMember = null, maxCompleted = -1;
      Object.values(stats).forEach(s => {
        if (s.completed > maxCompleted && s.completed > 0) {
          maxCompleted = s.completed;
          starMember = s.label;
        }
      });
      const fallbackStar = roster[0] ? roster[0].name : '-';
      if (starMemberEl) starMemberEl.innerText = starMember ? `⭐ ${stats[starMember].displayName}` : (allTodos.length > 0 ? fallbackStar : '-');

      grid.innerHTML = '';
      Object.values(stats).forEach(s => {
        const isStar = (starMember && s.label === starMember);
        const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        const quotaPct = s.monthlyQuota > 0 ? Math.min(100, Math.round((s.completed / s.monthlyQuota) * 100)) : 0;
        const editAction = s.id
          ? `openTeamManagerModal('${s.id}')`
          : `openTeamManagerModal()`;

        grid.innerHTML += `
          <div class="bg-white dark:bg-slate-800 rounded-xl border ${isStar ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 dark:border-slate-700'} p-5 shadow-sm flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-${s.color}-100 dark:bg-${s.color}-900/40 text-${s.color}-600 dark:text-${s.color}-400 flex items-center justify-center font-bold text-lg shrink-0">
                    <i class="fa-solid ${s.icon}"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-800 dark:text-white text-sm leading-tight">${s.displayName}</h4>
                    <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-${s.color}-50 dark:bg-${s.color}-950/60 text-${s.color}-600 dark:text-${s.color}-300 border border-${s.color}-200 dark:border-${s.color}-800/60">${s.role}</span>
                      <span class="text-[10px] text-slate-400">${activeBrandLabel}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  ${isStar ? `<span class="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-trophy text-amber-500"></i> Star</span>` : ''}
                  <button onclick="${editAction}" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs" title="Edit Nama & Jabatan Personil">
                    <i class="fa-solid fa-user-pen"></i>
                  </button>
                </div>
              </div>

              <!-- Task Progress Bar -->
              <div class="mb-3">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500 font-medium">Tingkat Penyelesaian Tugas</span>
                  <span class="font-bold text-slate-700 dark:text-slate-300">${s.completed}/${s.total} (${completionRate}%)</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: ${completionRate}%"></div>
                </div>
              </div>

              <!-- Monthly Target Quota Progress Bar (Ide 3) -->
              <div class="mb-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-500 font-semibold"><i class="fa-solid fa-bullseye text-indigo-500 mr-1"></i> Target Kuota Bulanan</span>
                  <span class="font-bold ${quotaPct >= 100 ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}">${s.completed} / ${s.monthlyQuota} Video (${quotaPct}%)</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div class="${quotaPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'} h-1.5 rounded-full transition-all duration-500" style="width: ${quotaPct}%"></div>
                </div>
              </div>

              <!-- 3 Mini Stats -->
              <div class="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 dark:border-slate-700/60 text-center mb-3 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Aktif</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">${s.inProgress}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Published</span>
                  <span class="font-bold text-emerald-600">${s.completed}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] font-semibold">Overdue</span>
                  <span class="font-bold ${s.overdue > 0 ? 'text-rose-500' : 'text-slate-400'}">${s.overdue}</span>
                </div>
              </div>

              <!-- Active Task Snippets -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tugas Berjalan:</span>
                  <button onclick="filterKanbanByMemberFromScorecard('${s.label.replace(/'/g, "\\'")}')" class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Lihat di Kanban →</button>
                </div>
                <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  ${s.tasks.filter(t => t.stage !== 'Published').length > 0 
                    ? s.tasks.filter(t => t.stage !== 'Published').slice(0, 3).map(t => `
                      <div onclick="openNoteModal(${t.id})" class="text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 cursor-pointer hover:border-blue-400 transition">
                        <span class="truncate font-medium text-slate-700 dark:text-slate-300" title="${t.title}">${truncateWords(t.title, 5)}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0">${t.stage}</span>
                      </div>
                    `).join('') 
                    : '<p class="text-[11px] text-slate-400 italic">Tidak ada tugas aktif.</p>'
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    function filterKanbanByMemberFromScorecard(memberLabel) {
      kanbanMemberFilter = memberLabel || 'all';
      switchWorkspaceView('kanban');
    }

    // --- EXECUTIVE REPORT GENERATOR (OPSI 2 + MULTI-BRAND HOLDING + PER-MONTH / OVERALL SELECTOR) ---
    function openExecutiveReportModal(preservePeriod = false) {
      const modal = document.getElementById('modal-executive-report');
      if (!modal) return;

      const repSelect = document.getElementById('rep-brand-select');
      if (repSelect) repSelect.value = activeBrandId;

      const repPeriodSelect = document.getElementById('rep-period-select');
      if (repPeriodSelect) {
        const prevVal = repPeriodSelect.value;
        const months = getAvailableMonths();
        const monthsDesc = [...months].reverse();
        const totalDays = Object.keys(db.daily || {}).length;

        repPeriodSelect.innerHTML = `<option value="all">🌐 Overall (Semua Bulan — ${totalDays} Hari)</option>`;
        monthsDesc.forEach(m => {
          repPeriodSelect.innerHTML += `<option value="month:${m.ym}">📅 Bulan: ${m.label} (${m.activeDays} Hari)</option>`;
        });

        const validVals = ['all', ...months.map(m => `month:${m.ym}`)];
        if (preservePeriod && validVals.includes(prevVal)) {
          repPeriodSelect.value = prevVal;
        } else {
          const ovFilter = document.getElementById('overview-month-filter');
          const ovVal = ovFilter ? ovFilter.value : 'all';
          repPeriodSelect.value = validVals.includes(ovVal) ? ovVal : 'all';
        }
      }

      renderExecutiveReportContent();
      modal.classList.remove('hidden');
    }

    function renderExecutiveReportContent() {
      const repPeriodSelect = document.getElementById('rep-period-select');
      const repPeriodVal = repPeriodSelect ? repPeriodSelect.value : 'all';
      const selectedMonthYm = (repPeriodVal && repPeriodVal.startsWith('month:')) ? repPeriodVal.replace('month:', '') : null;

      const b1Meta = brandsStore.brand_1.meta;
      const b2Meta = brandsStore.brand_2.meta;
      const repSubtitle = document.getElementById('rep-brand-subtitle');
      const repModeBadge = document.getElementById('rep-mode-badge');
      if (activeBrandId === 'brand_1') {
        if (repSubtitle) repSubtitle.innerText = `${b1Meta.name} (${b1Meta.handle})`;
        if (repModeBadge) { repModeBadge.innerText = 'Brand 1 Report'; repModeBadge.className = 'bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider'; }
      } else if (activeBrandId === 'brand_2') {
        if (repSubtitle) repSubtitle.innerText = `${b2Meta.name} (${b2Meta.handle})`;
        if (repModeBadge) { repModeBadge.innerText = 'Brand 2 Report'; repModeBadge.className = 'bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider'; }
      } else {
        if (repSubtitle) repSubtitle.innerText = `Holding Gabungan: ${b1Meta.name} + ${b2Meta.name}`;
        if (repModeBadge) { repModeBadge.innerText = 'Holding Executive Summary'; repModeBadge.className = 'bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider'; }
      }

      const allSortedDates = Object.keys(db.daily || {}).sort();
      const targetDates = selectedMonthYm ? allSortedDates.filter(d => d.startsWith(selectedMonthYm)) : allSortedDates;
      const months = getAvailableMonths();

      // Update Period Header Badge & Info Banner
      const repPeriodBadge = document.getElementById('rep-period-badge');
      const repPeriodInfoText = document.getElementById('rep-period-info-text');
      const repPeriodDaysPill = document.getElementById('rep-period-days-pill');
      const repHoldingPeriodSub = document.getElementById('rep-holding-period-sub');

      if (selectedMonthYm) {
        const mLabel = formatMonthLabel(selectedMonthYm, false);
        const dateSpan = targetDates.length > 0 ? `${targetDates[0]} s/d ${targetDates[targetDates.length - 1]}` : selectedMonthYm;
        if (repPeriodBadge) repPeriodBadge.innerText = `Bulan: ${mLabel} (${targetDates.length} Hari)`;
        if (repPeriodInfoText) repPeriodInfoText.innerHTML = `Cakupan Laporan Spesifik Bulan: <strong>${mLabel}</strong> <span class="text-slate-400 font-normal">(${dateSpan})</span>`;
        if (repPeriodDaysPill) repPeriodDaysPill.innerText = `${targetDates.length} Hari Kalender`;
        if (repHoldingPeriodSub) repHoldingPeriodSub.innerText = `Periode: ${mLabel} (${targetDates.length} Hari)`;
      } else {
        const dateSpan = targetDates.length > 0 ? `${targetDates[0]} s/d ${targetDates[targetDates.length - 1]}` : 'Semua Tanggal';
        if (repPeriodBadge) repPeriodBadge.innerText = `Overall (${months.length} Bulan • ${targetDates.length} Hari)`;
        if (repPeriodInfoText) repPeriodInfoText.innerHTML = `Cakupan Laporan: <strong>Overall / Akumulasi Semua Bulan (${months.length} Bulan)</strong> <span class="text-slate-400 font-normal">(${dateSpan})</span>`;
        if (repPeriodDaysPill) repPeriodDaysPill.innerText = `${targetDates.length} Hari Aktif`;
        if (repHoldingPeriodSub) repHoldingPeriodSub.innerText = `Periode: Overall Semua Bulan (${targetDates.length} Hari)`;
      }

      // Populate Multi-Brand Head-to-Head Comparison Table in PDF Report (filtered by selectedMonthYm or Overall)
      const holdingTbody = document.getElementById('rep-holding-table-body');
      if (holdingTbody) {
        const m1 = computeBrandMetricsSummary('brand_1', selectedMonthYm);
        const m2 = computeBrandMetricsSummary('brand_2', selectedMonthYm);
        const totGmv = m1.gmv + m2.gmv;
        const totSku = m1.sku + m2.sku;
        const totImp = m1.impresi + m2.impresi;
        const totKlik = m1.klik + m2.klik;
        const totCtr = totImp > 0 ? ((totKlik / totImp) * 100) : 0;
        const totQty = m1.qtyVideoHashtag + m2.qtyVideoHashtag;
        const s1 = totGmv > 0 ? ((m1.gmv / totGmv) * 100).toFixed(1) : '0.0';
        const s2 = totGmv > 0 ? ((m2.gmv / totGmv) * 100).toFixed(1) : '0.0';

        holdingTbody.innerHTML = `
          <tr class="${activeBrandId === 'brand_1' ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}">
            <td class="px-3.5 py-2 font-bold text-blue-600 dark:text-blue-400">1. ${m1.meta.name} <span class="text-[10px] font-normal text-slate-400">(${m1.meta.handle} • ${m1.activeDays} Hr)</span></td>
            <td class="px-3.5 py-2 text-right font-bold text-emerald-600">${formatRp(m1.gmv)}</td>
            <td class="px-3.5 py-2 text-right font-semibold">${s1}%</td>
            <td class="px-3.5 py-2 text-right font-semibold">${m1.sku.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-sky-600">${m1.impresi.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-blue-600 font-semibold">${m1.klik.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right font-bold text-amber-500">${m1.ctr.toFixed(2)}%</td>
            <td class="px-3.5 py-2 text-right font-bold text-pink-600">${m1.qtyVideoHashtag}</td>
          </tr>
          <tr class="${activeBrandId === 'brand_2' ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''}">
            <td class="px-3.5 py-2 font-bold text-emerald-600 dark:text-emerald-400">2. ${m2.meta.name} <span class="text-[10px] font-normal text-slate-400">(${m2.meta.handle} • ${m2.activeDays} Hr)</span></td>
            <td class="px-3.5 py-2 text-right font-bold text-emerald-600">${formatRp(m2.gmv)}</td>
            <td class="px-3.5 py-2 text-right font-semibold">${s2}%</td>
            <td class="px-3.5 py-2 text-right font-semibold">${m2.sku.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-sky-600">${m2.impresi.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-blue-600 font-semibold">${m2.klik.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right font-bold text-amber-500">${m2.ctr.toFixed(2)}%</td>
            <td class="px-3.5 py-2 text-right font-bold text-pink-600">${m2.qtyVideoHashtag}</td>
          </tr>
          <tr class="bg-slate-100 dark:bg-slate-800/90 font-black">
            <td class="px-3.5 py-2">TOTAL HOLDING (2 BRAND)</td>
            <td class="px-3.5 py-2 text-right text-emerald-600">${formatRp(totGmv)}</td>
            <td class="px-3.5 py-2 text-right">100%</td>
            <td class="px-3.5 py-2 text-right">${totSku.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-sky-600">${totImp.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-blue-600">${totKlik.toLocaleString('id-ID')}</td>
            <td class="px-3.5 py-2 text-right text-amber-500">${totCtr.toFixed(2)}%</td>
            <td class="px-3.5 py-2 text-right text-pink-600">${totQty}</td>
          </tr>
        `;
      }

      // Ide C: Rekap Performa Bulan-per-Bulan (Tampil Otomatis Saat Mode Overall)
      const monthlyBreakdownBlock = document.getElementById('rep-monthly-breakdown-block');
      const monthlyBreakdownTbody = document.getElementById('rep-monthly-breakdown-tbody');
      if (monthlyBreakdownBlock && monthlyBreakdownTbody) {
        if (!selectedMonthYm && months.length > 0) {
          monthlyBreakdownBlock.classList.remove('hidden');
          let sumGmv = 0, sumSku = 0, sumImp = 0, sumKlik = 0, sumViews = 0, sumDays = 0;
          const rowsHtml = months.map(m => {
            const agg = getAggregatedData(m.startDate, m.endDate);
            const avgDailyGmv = agg.activeDays > 0 ? Math.round(agg.gmv / agg.activeDays) : 0;
            sumGmv += agg.gmv;
            sumSku += agg.order;
            sumImp += agg.impresi;
            sumKlik += agg.klik;
            sumViews += agg.views;
            sumDays += agg.activeDays;
            return `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-3.5 py-2 font-bold text-slate-800 dark:text-white">${m.label}</td>
                <td class="px-3.5 py-2 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">${agg.activeDays} Hari</span></td>
                <td class="px-3.5 py-2 text-right font-bold text-emerald-600">${formatRp(agg.gmv)}</td>
                <td class="px-3.5 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">${formatRp(avgDailyGmv)}/hr</td>
                <td class="px-3.5 py-2 text-right font-semibold">${agg.order.toLocaleString('id-ID')}</td>
                <td class="px-3.5 py-2 text-right text-sky-600">${formatNumber(agg.impresi)} / ${formatNumber(agg.klik)} <span class="font-bold text-amber-500">(${agg.ctr.toFixed(2)}%)</span></td>
                <td class="px-3.5 py-2 text-right font-bold text-blue-600">${formatNumber(agg.views)}</td>
              </tr>
            `;
          }).join('');
          const overallAvgDaily = sumDays > 0 ? Math.round(sumGmv / sumDays) : 0;
          const overallCtr = sumImp > 0 ? ((sumKlik / sumImp) * 100) : 0;
          monthlyBreakdownTbody.innerHTML = rowsHtml + `
            <tr class="bg-indigo-50/70 dark:bg-indigo-950/40 font-black">
              <td class="px-3.5 py-2 text-indigo-900 dark:text-indigo-200">TOTAL OVERALL (${months.length} BULAN)</td>
              <td class="px-3.5 py-2 text-center text-indigo-700 dark:text-indigo-300">${sumDays} Hari</td>
              <td class="px-3.5 py-2 text-right text-emerald-600">${formatRp(sumGmv)}</td>
              <td class="px-3.5 py-2 text-right text-slate-700 dark:text-slate-200">${formatRp(overallAvgDaily)}/hr</td>
              <td class="px-3.5 py-2 text-right">${sumSku.toLocaleString('id-ID')}</td>
              <td class="px-3.5 py-2 text-right text-sky-600">${formatNumber(sumImp)} / ${formatNumber(sumKlik)} <span class="text-amber-500">(${overallCtr.toFixed(2)}%)</span></td>
              <td class="px-3.5 py-2 text-right text-blue-600">${formatNumber(sumViews)}</td>
            </tr>
          `;
        } else {
          monthlyBreakdownBlock.classList.add('hidden');
        }
      }

      let tGmv = 0, tGmvDirect = 0, tGmvIndirect = 0, tOrders = 0, tOrdersDirect = 0, tOrdersIndirect = 0;
      let tViews = 0, tReach = 0, tLikes = 0, tComments = 0, tShares = 0, tErSum = 0, erCount = 0, tGpmSum = 0, gpmCount = 0, tImpresi = 0, tKlik = 0;
      let vcDays = [];

      targetDates.forEach(date => {
        const day = db.daily[date];
        if (!day) return;
        const ov = day.overview || null;
        const aud = day.audience || null;
        if (ov) {
          tViews += (ov.views || 0);
          tReach += (ov.reach && ov.reach > 0) ? ov.reach : ((aud && aud.reach) || 0);
          tLikes += (ov.likes || 0);
          tComments += (ov.comments || 0);
          tShares += (ov.shares || 0);
          if (ov.er && Number(ov.er) > 0) {
            tErSum += Number(ov.er);
            erCount++;
          }
        } else if (aud) {
          tReach += (aud.reach || 0);
        }
        if (day.sales) {
          const gmv = day.sales.tGmvTotal || 0;
          const ord = day.sales.tOrder || 0;
          const imp = day.sales.tProdView || 0;
          const klk = day.sales.tClick || 0;
          tGmv += gmv;
          tGmvDirect += (day.sales.tGmvDirect || 0);
          tGmvIndirect += (day.sales.tGmvIndirect || 0);
          tOrders += ord;
          tOrdersDirect += (day.sales.tOrderDirect || 0);
          tOrdersIndirect += (day.sales.tOrderIndirect || 0);
          tImpresi += imp;
          tKlik += klk;
          if (day.sales.countRows > 0) {
            tGpmSum += day.sales.sumGpm;
            gpmCount += day.sales.countRows;
          }
          if (gmv > 0 || imp > 0 || klk > 0 || ord > 0) {
            vcDays.push({
              date,
              gmv,
              sku: ord,
              impresi: imp,
              klik: klk,
              ctr: imp > 0 ? ((klk / imp) * 100) : 0
            });
          }
        }
      });

      if (tViews === 0) {
        targetDates.forEach(date => {
          const day = db.daily[date];
          if (day && day.sales) tViews += (day.sales.tVV || 0);
        });
      }

      const periodEr = (tViews > 0 && (tLikes + tComments + tShares) > 0)
        ? (((tLikes + tComments + tShares) / tViews) * 100)
        : (erCount > 0 ? (tErSum / erCount) : 0);
      const avgEr = periodEr > 0 ? periodEr.toFixed(2) + '%' : '0%';
      const avgGpm = gpmCount > 0 ? formatRp(tGpmSum / gpmCount) : 'Rp 0';
      const ctrPctNum = tImpresi > 0 ? ((tKlik / tImpresi) * 100) : 0;
      const ctrPct = ctrPctNum.toFixed(2) + '%';
      const ctorPct = tKlik > 0 ? ((tOrders / tKlik) * 100).toFixed(2) + '%' : '0.00%';
      const qtyVideoHashtag = getHashtagVideosCount(selectedMonthYm ? `month:${selectedMonthYm}` : 'all');

      document.getElementById('rep-gmv').innerText = formatRp(tGmv);
      document.getElementById('rep-orders').innerText = formatNumber(tOrders);
      document.getElementById('rep-views').innerText = formatNumber(tViews);
      document.getElementById('rep-reach').innerText = formatNumber(tReach);
      document.getElementById('rep-er').innerText = avgEr;
      document.getElementById('rep-gpm').innerText = avgGpm;
      const repCtrEl = document.getElementById('rep-ctr');
      if (repCtrEl) repCtrEl.innerText = ctrPct;
      const repQtyEl = document.getElementById('rep-qtyvideo');
      if (repQtyEl) repQtyEl.innerText = formatNumber(qtyVideoHashtag);

      // Populate Section 2: Video & Carousel Summary in Executive Report PDF
      if (document.getElementById('rep-vc-gmv')) document.getElementById('rep-vc-gmv').innerText = formatRp(tGmv);
      if (document.getElementById('rep-vc-gmv-sub')) document.getElementById('rep-vc-gmv-sub').innerText = `D: ${formatRp(tGmvDirect)} | Ind: ${formatRp(tGmvIndirect)}`;
      if (document.getElementById('rep-vc-sku')) document.getElementById('rep-vc-sku').innerText = formatNumber(tOrders);
      if (document.getElementById('rep-vc-sku-sub')) {
        document.getElementById('rep-vc-sku-sub').innerText = (tOrdersDirect > 0 || tOrdersIndirect > 0)
          ? `D: ${formatNumber(tOrdersDirect)} | Ind: ${formatNumber(tOrdersIndirect)}`
          : `Total Teratribusi (${vcDays.length} Hari)`;
      }
      if (document.getElementById('rep-vc-impresi')) document.getElementById('rep-vc-impresi').innerText = formatNumber(tImpresi);
      if (document.getElementById('rep-vc-ctr')) document.getElementById('rep-vc-ctr').innerText = ctrPct;
      if (document.getElementById('rep-vc-ctor-sub')) document.getElementById('rep-vc-ctor-sub').innerText = `CTOR: ${ctorPct}`;
      if (document.getElementById('rep-vc-klik')) document.getElementById('rep-vc-klik').innerText = formatNumber(tKlik);

      // Populate MoM Badges & Dedicated MoM Comparison Table in Executive Report PDF (Ide 4)
      const momPair = getMoMComparisonPair(selectedMonthYm);
      const setRepMom = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const repMomBlock = document.getElementById('rep-mom-comparison-block');
      const repMomTbody = document.getElementById('rep-mom-table-body');
      const repMomPeriodBadge = document.getElementById('rep-mom-period-badge');
      const repMomThPrev = document.getElementById('rep-mom-th-prev');
      const repMomThCurr = document.getElementById('rep-mom-th-curr');

      if (momPair) {
        const { curr, prev, prevShort, currLabel, prevLabel } = momPair;
        setRepMom('rep-mom-gmv', getMoMBadgeHtml(curr.gmv, prev.gmv, prevShort, false));
        setRepMom('rep-mom-orders', getMoMBadgeHtml(curr.order, prev.order, prevShort, false));
        setRepMom('rep-mom-views', getMoMBadgeHtml(curr.views, prev.views, prevShort, false));
        setRepMom('rep-mom-reach', getMoMBadgeHtml(curr.reach, prev.reach, prevShort, false));
        setRepMom('rep-mom-er', getMoMBadgeHtml(curr.er, prev.er, prevShort, true));
        setRepMom('rep-mom-ctr', getMoMBadgeHtml(curr.ctr, prev.ctr, prevShort, true));
        setRepMom('rep-mom-qtyvideo', getMoMBadgeHtml(curr.qtyVideoHashtag, prev.qtyVideoHashtag, prevShort, false));
        setRepMom('rep-mom-gpm', getMoMBadgeHtml(curr.gpm, prev.gpm, prevShort, false));

        setRepMom('rep-vc-mom-gmv', getMoMBadgeHtml(curr.gmv, prev.gmv, prevShort, false));
        setRepMom('rep-vc-mom-sku', getMoMBadgeHtml(curr.order, prev.order, prevShort, false));
        setRepMom('rep-vc-mom-impresi', getMoMBadgeHtml(curr.impresi, prev.impresi, prevShort, false));
        setRepMom('rep-vc-mom-ctr', getMoMBadgeHtml(curr.ctr, prev.ctr, prevShort, true));
        setRepMom('rep-vc-mom-klik', getMoMBadgeHtml(curr.klik, prev.klik, prevShort, false));

        if (repMomBlock) repMomBlock.classList.remove('hidden');
        if (repMomPeriodBadge) repMomPeriodBadge.innerText = `${prevLabel} → ${currLabel}`;
        if (repMomThPrev) repMomThPrev.innerText = `${prevLabel} (${prev.activeDays} Hr)`;
        if (repMomThCurr) repMomThCurr.innerText = `${currLabel} (${curr.activeDays} Hr)`;

        if (repMomTbody) {
          const repMomRows = [
            { name: 'GMV dari Video', valB: formatRp(prev.gmv), valA: formatRp(curr.gmv), diff: (curr.gmv - prev.gmv >= 0 ? '+' : '-') + formatRp(Math.abs(curr.gmv - prev.gmv)), rawA: curr.gmv, rawB: prev.gmv, isRate: false },
            { name: 'Pesanan SKU Teratribusi', valB: formatNumber(prev.order), valA: formatNumber(curr.order), diff: (curr.order - prev.order >= 0 ? '+' : '') + formatNumber(curr.order - prev.order) + ' SKU', rawA: curr.order, rawB: prev.order, isRate: false },
            { name: 'Impresi Produk', valB: formatNumber(prev.impresi), valA: formatNumber(curr.impresi), diff: (curr.impresi - prev.impresi >= 0 ? '+' : '') + formatNumber(curr.impresi - prev.impresi), rawA: curr.impresi, rawB: prev.impresi, isRate: false },
            { name: 'CTR Produk (%)', valB: prev.ctr.toFixed(2) + '%', valA: curr.ctr.toFixed(2) + '%', diff: (curr.ctr - prev.ctr >= 0 ? '+' : '') + (curr.ctr - prev.ctr).toFixed(2) + '% pt', rawA: curr.ctr, rawB: prev.ctr, isRate: true },
            { name: 'Klik Produk', valB: formatNumber(prev.klik), valA: formatNumber(curr.klik), diff: (curr.klik - prev.klik >= 0 ? '+' : '') + formatNumber(curr.klik - prev.klik), rawA: curr.klik, rawB: prev.klik, isRate: false },
            { name: 'Total Video Views (VV)', valB: formatNumber(prev.views), valA: formatNumber(curr.views), diff: (curr.views - prev.views >= 0 ? '+' : '') + formatNumber(curr.views - prev.views), rawA: curr.views, rawB: prev.views, isRate: false },
            { name: 'Quantity Video (#)', valB: formatNumber(prev.qtyVideoHashtag), valA: formatNumber(curr.qtyVideoHashtag), diff: (curr.qtyVideoHashtag - prev.qtyVideoHashtag >= 0 ? '+' : '') + formatNumber(curr.qtyVideoHashtag - prev.qtyVideoHashtag) + ' Video', rawA: curr.qtyVideoHashtag, rawB: prev.qtyVideoHashtag, isRate: false }
          ];
          repMomTbody.innerHTML = repMomRows.map(r => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-3.5 py-2 font-bold">${r.name}</td>
              <td class="px-3.5 py-2 text-right text-slate-600 dark:text-slate-400">${r.valB}</td>
              <td class="px-3.5 py-2 text-right font-bold text-blue-600 dark:text-blue-400">${r.valA}</td>
              <td class="px-3.5 py-2 text-right font-semibold">${r.diff}</td>
              <td class="px-3.5 py-2 text-right">${getDeltaHtml(r.rawA, r.rawB, r.isRate)}</td>
            </tr>
          `).join('');
        }
      } else {
        ['rep-mom-gmv', 'rep-mom-orders', 'rep-mom-views', 'rep-mom-reach', 'rep-mom-er', 'rep-mom-ctr', 'rep-mom-qtyvideo', 'rep-mom-gpm', 'rep-vc-mom-gmv', 'rep-vc-mom-sku', 'rep-vc-mom-impresi', 'rep-vc-mom-ctr', 'rep-vc-mom-klik'].forEach(id => setRepMom(id, ''));
        if (repMomBlock) repMomBlock.classList.add('hidden');
      }

      const vcTopDaysBody = document.getElementById('rep-vc-topdays-body');
      if (vcTopDaysBody) {
        if (vcDays.length === 0) {
          vcTopDaysBody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-slate-400">Belum ada data harian Video & Carousel pada periode ini</td></tr>';
        } else {
          const topGmv = [...vcDays].sort((a, b) => b.gmv - a.gmv)[0];
          const topCtr = [...vcDays].sort((a, b) => b.ctr - a.ctr)[0];
          const topKlik = [...vcDays].sort((a, b) => b.klik - a.klik)[0];
          const highlightRows = [
            { label: `🏆 Hari GMV Tertinggi (${topGmv.date})`, ...topGmv },
            { label: `🔥 Hari CTR Tertinggi (${topCtr.date})`, ...topCtr },
            { label: `👆 Hari Klik Produk Tertinggi (${topKlik.date})`, ...topKlik }
          ];
          vcTopDaysBody.innerHTML = highlightRows.map(r => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-3.5 py-2 font-semibold">${r.label}</td>
              <td class="px-3.5 py-2 text-right font-bold text-emerald-600">${formatRp(r.gmv)}</td>
              <td class="px-3.5 py-2 text-right font-semibold">${r.sku.toLocaleString('id-ID')}</td>
              <td class="px-3.5 py-2 text-right text-sky-600">${r.impresi.toLocaleString('id-ID')}</td>
              <td class="px-3.5 py-2 text-right font-bold text-amber-500">${r.ctr.toFixed(2)}%</td>
              <td class="px-3.5 py-2 text-right font-bold text-blue-600">${r.klik.toLocaleString('id-ID')}</td>
            </tr>
          `).join('');
        }
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const periodNote = selectedMonthYm ? `Periode Laporan: ${formatMonthLabel(selectedMonthYm, false)} (${targetDates.length} Hari)` : `Periode Laporan: Overall Semua Bulan (${targetDates.length} Hari)`;
      document.getElementById('rep-generated-date').innerText = `Dicetak pada: ${dateStr} • ${periodNote}`;

      // Filter salesVideos by selectedMonthYm (or deduplicate across months when in Overall mode)
      const rawSalesForPeriod = (db.salesVideos || []).filter(v => {
        if (!selectedMonthYm) return true;
        if (v.reportMonth) return v.reportMonth === selectedMonthYm;
        return Boolean(v.date && v.date.startsWith(selectedMonthYm));
      });

      const periodSalesVideos = !selectedMonthYm ? (() => {
        const dedup = new Map();
        rawSalesForPeriod.forEach(v => {
          const k = `${String(v.title || '').trim().toLowerCase()}||${v.date || ''}`;
          if (!dedup.has(k)) {
            dedup.set(k, { ...v });
          } else {
            const ex = dedup.get(k);
            ex.vv = (Number(ex.vv) || 0) + (Number(v.vv) || 0);
            ex.impresi = (Number(ex.impresi) || 0) + (Number(v.impresi) || 0);
            ex.klik = (Number(ex.klik) || 0) + (Number(v.klik) || 0);
            ex.order = (Number(ex.order) || 0) + (Number(v.order) || 0);
            ex.gmv = (Number(ex.gmv) || 0) + (Number(v.gmv) || 0);
          }
        });
        return Array.from(dedup.values());
      })() : rawSalesForPeriod;

      // Dynamic Pillar Breakdown (Section 3)
      const activePillars = getActiveBrandPillars();
      const pillarStats = {};
      activePillars.forEach(p => {
        pillarStats[p.id] = { name: p.name, count: 0, views: 0, gmv: 0 };
      });

      periodSalesVideos.forEach(v => {
        const pil = (v.pillar && pillarStats[v.pillar]) ? v.pillar : classifyContentPillar(v.title, v.tags || '');
        const targetKey = pillarStats[pil] ? pil : (activePillars[0] && activePillars[0].id);
        if (targetKey && pillarStats[targetKey]) {
          pillarStats[targetKey].count++;
          pillarStats[targetKey].views += (v.vv || 0);
          pillarStats[targetKey].gmv += (v.gmv || 0);
        }
      });

      const pillarTbody = document.getElementById('rep-pillar-table-body');
      if (pillarTbody) {
        pillarTbody.innerHTML = '';
        const totPillarGmv = Object.values(pillarStats).reduce((acc, x) => acc + x.gmv, 0);
        Object.entries(pillarStats).forEach(([pKey, pVal]) => {
          const share = totPillarGmv > 0 ? ((pVal.gmv / totPillarGmv) * 100).toFixed(1) : 0;
          pillarTbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-4 py-2 font-semibold">${pVal.name}</td>
              <td class="px-4 py-2 text-right">${pVal.count}</td>
              <td class="px-4 py-2 text-right">${formatNumber(pVal.views)}</td>
              <td class="px-4 py-2 text-right font-bold text-emerald-600">${formatRp(pVal.gmv)}</td>
              <td class="px-4 py-2 text-right font-semibold text-blue-600">${share}%</td>
            </tr>
          `;
        });
      }

      // Top 5 Winning Videos for the Selected Report Period (Section 4)
      const top5Tbody = document.getElementById('rep-top5-table-body');
      if (top5Tbody) {
        top5Tbody.innerHTML = '';
        const sortedSales = [...periodSalesVideos].sort((a, b) => (b.gmv || 0) - (a.gmv || 0)).slice(0, 5);
        if (sortedSales.length === 0) {
          top5Tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400">Belum ada video sales terdaftar pada periode laporan ini.</td></tr>';
        } else {
          sortedSales.forEach((v, idx) => {
            top5Tbody.innerHTML += `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-2 font-bold text-slate-400">#${idx + 1}</td>
                <td class="px-4 py-2 font-medium max-w-xs truncate" title="${v.title}">${truncateWords(v.title, 8)}</td>
                <td class="px-4 py-2">${getPillarBadgeHtml(v.pillar)}</td>
                <td class="px-4 py-2 text-right text-slate-500">${formatNumber(v.vv)}</td>
                <td class="px-4 py-2 text-right font-semibold">${formatNumber(v.order)}</td>
                <td class="px-4 py-2 text-right font-bold text-emerald-600">${formatRp(v.gmv)}</td>
              </tr>
            `;
          });
        }
      }

      const periodTimeStats = rebuildGlobalTimeStats(periodSalesVideos);
      let bestHour = -1, maxGmv = 0;
      for (let i = 0; i < 24; i++) {
        if (periodTimeStats[i] && periodTimeStats[i].gmv > maxGmv) {
          maxGmv = periodTimeStats[i].gmv;
          bestHour = i;
        }
      }
      const timingEl = document.getElementById('rep-timing-text');
      if (timingEl) {
        if (bestHour !== -1 && maxGmv > 0) {
          timingEl.innerHTML = `Pukul <strong>${bestHour.toString().padStart(2, '0')}:00 - ${(bestHour + 1).toString().padStart(2, '0')}:00 WIB</strong> tercatat sebagai jam upload dengan konversi GMV tertinggi (Total: <strong>${formatRp(maxGmv)}</strong>). Fokuskan slot konten harian pada rentang waktu ini.`;
        } else {
          timingEl.innerText = `Belum ada data jam upload yang cukup pada periode ini. Disarankan menguji slot sore hari (17:00 - 20:00 WIB).`;
        }
      }
    }

    function closeExecutiveReportModal() {
      const modal = document.getElementById('modal-executive-report');
      if (modal) modal.classList.add('hidden');
    }

    function printExecutiveReport() {
      window.print();
    }

    // --- TAB 5: WORKSPACE & KANBAN (TEAM COLLABORATION) ---
    const formTodo = document.getElementById('form-todo');
    if (formTodo) {
      formTodo.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-title');
        const pillar = document.getElementById('todo-pillar').value;
        const assignee = document.getElementById('todo-assignee').value;
        const priority = document.getElementById('todo-priority').value;
        const due = document.getElementById('todo-due').value;

        if (!input.value.trim()) return;
        ensureSingleBrandForWrite('menambahkan Task Kanban');

        db.todos.push({
          id: Date.now(),
          title: input.value.trim(),
          stage: 'Ideas',
          pillar: pillar,
          assignee: assignee,
          priority: priority,
          due: due,
          note: ''
        });

        input.value = '';
        saveToStorage();
        renderWorkspace();
        showToast("Task tim baru ditambahkan ke Kanban!", "success");
      });
    }

    function setKanbanMemberFilter(memberLabel) {
      kanbanMemberFilter = memberLabel || 'all';
      renderTodos();
    }

    function renderKanbanMemberFilterBar() {
      const bar = document.getElementById('kanban-member-filter-bar');
      if (!bar) return;

      const roster = ensureTeamRoster(db);
      const allTodos = db.todos || [];
      const counts = {};
      allTodos.forEach(t => {
        const a = t.assignee || 'Unassigned';
        counts[a] = (counts[a] || 0) + 1;
      });

      const isAllActive = kanbanMemberFilter === 'all';
      let html = `
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <i class="fa-solid fa-filter text-indigo-500"></i> Filter PIC:
        </span>
        <button onclick="setKanbanMemberFilter('all')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
          isAllActive
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
        }">
          Semua Personil
          <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isAllActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}">${allTodos.length}</span>
        </button>
      `;

      roster.forEach(m => {
        const lbl = getMemberDisplayLabel(m);
        const cnt = counts[lbl] || 0;
        const isActive = kanbanMemberFilter === lbl;
        const safeLbl = lbl.replace(/'/g, "\\'");
        const c = m.color || 'blue';
        html += `
          <button onclick="setKanbanMemberFilter('${safeLbl}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            isActive
              ? `bg-${c}-600 text-white shadow-xs font-bold`
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }" title="${lbl}">
            <i class="fa-solid ${m.icon || 'fa-user-tie'} ${isActive ? 'text-white' : `text-${c}-500`} text-[10px]"></i>
            <span>${m.name}</span>
            <span class="text-[10px] opacity-75">(${m.role})</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}">${cnt}</span>
          </button>
        `;
      });

      html += `
        <button onclick="openTeamManagerModal()" class="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800/60 transition flex items-center gap-1">
          <i class="fa-solid fa-user-plus"></i> + Personil Baru / Edit Jabatan
        </button>
      `;

      bar.innerHTML = html;
    }

    function renderTodos() {
      const board = document.getElementById('kanban-board');
      if (!board) return;
      populateAssigneeDropdowns();
      renderKanbanMemberFilterBar();

      board.innerHTML = '';
      sortableInstances.forEach(inst => inst.destroy());
      sortableInstances = [];

      const roster = ensureTeamRoster(db);
      const memberMetaMap = {};
      roster.forEach(m => {
        memberMetaMap[getMemberDisplayLabel(m)] = m;
      });

      STAGES.forEach(stage => {
        const col = document.createElement('div');
        col.className = 'bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col min-w-[270px] max-w-[300px] min-h-[420px] flex-1';
        const tasks = (db.todos || []).filter(t => {
          if (t.stage !== stage) return false;
          if (kanbanMemberFilter !== 'all' && t.assignee !== kanbanMemberFilter) return false;
          return true;
        });

        col.innerHTML = `
          <div class="flex justify-between items-center mb-3 px-1">
            <h3 class="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">${stage}</h3>
            <span class="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">${tasks.length}</span>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2.5 pr-1" id="kanban-${stage.replace(/\s+/g, '-')}"></div>
        `;

        board.appendChild(col);
        const list = col.querySelector('div[id^="kanban-"]');

        tasks.forEach(t => {
          const card = document.createElement('div');
          const prioColor = t.priority === 'High' ? 'border-l-rose-500' : t.priority === 'Medium' ? 'border-l-amber-500' : 'border-l-slate-400';
          card.className = `bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-grab active:cursor-grabbing border-l-4 ${prioColor} group transition hover:shadow-md`;
          card.dataset.id = t.id;

          const mMeta = memberMetaMap[t.assignee] || null;
          const badgeColor = mMeta ? (mMeta.color || 'blue') : 'blue';
          const badgeIcon = mMeta ? (mMeta.icon || 'fa-user-circle') : 'fa-user-circle';
          const assigneeDisplay = t.assignee || 'Unassigned';

          card.innerHTML = `
            <div class="flex justify-between items-start gap-2 mb-2">
              <span class="text-[10px]">${getPillarBadgeHtml(t.pillar)}</span>
              <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <i class="fa-solid fa-clock text-[9px]"></i> ${t.due ? t.due.slice(5) : 'No due'}
              </span>
            </div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-3 line-clamp-3 leading-relaxed">${t.title}</p>
            <div class="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] gap-1">
              <button onclick="openNoteModal(${t.id})" class="inline-flex items-center gap-1 font-semibold text-${badgeColor}-700 dark:text-${badgeColor}-300 bg-${badgeColor}-50 dark:bg-${badgeColor}-950/50 border border-${badgeColor}-200/70 dark:border-${badgeColor}-800/60 px-2 py-0.5 rounded-md truncate max-w-[165px] hover:opacity-80 transition" title="Klik untuk Handover / Ubah Penanggung Jawab (${assigneeDisplay})">
                <i class="fa-solid ${badgeIcon} text-${badgeColor}-500 text-[10px] shrink-0"></i>
                <span class="truncate">${assigneeDisplay}</span>
              </button>
              <div class="flex items-center gap-1 text-slate-400 shrink-0">
                <button onclick="openNoteModal(${t.id})" class="hover:text-blue-500 p-1 transition" title="Edit Detail Task, Handover PIC & Script"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
                <button onclick="publishFromTodo(${t.id})" class="hover:text-emerald-500 p-1 transition" title="Log ke Published Archive"><i class="fa-solid fa-circle-check text-xs"></i></button>
                <button onclick="deleteTodo(${t.id})" class="hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition" title="Hapus Task"><i class="fa-solid fa-trash-can text-xs"></i></button>
              </div>
            </div>
          `;
          list.appendChild(card);
        });

        sortableInstances.push(new Sortable(list, {
          group: 'kanban',
          animation: 150,
          ghostClass: 'sortable-ghost',
          onEnd: function(evt) {
            if (activeBrandId === 'all') return;
            const taskId = Number(evt.item.dataset.id);
            const rawStage = evt.to.id.replace('kanban-', '').replace(/-/g, ' ');
            const matchedStage = STAGES.find(s => s.replace(/\s+/g, '-').toLowerCase() === rawStage.toLowerCase()) || rawStage;
            const tIndex = db.todos.findIndex(t => t.id === taskId);
            if (tIndex > -1) {
              db.todos[tIndex].stage = matchedStage;
              saveToStorage();
              document.getElementById('dash-task-count').innerText = db.todos.filter(x => x.stage !== 'Published').length;
            }
          }
        }));
      });

      document.getElementById('dash-task-count').innerText = (db.todos || []).filter(x => x.stage !== 'Published').length;
    }

    function publishFromTodo(id) {
      ensureSingleBrandForWrite('mempublikasikan Task');
      const t = db.todos.find(x => x.id === id);
      if (!t) return;
      t.stage = 'Published';
      db.contents.push({
        id: Date.now(),
        title: t.title,
        date: new Date().toISOString().slice(0, 10),
        pillar: t.pillar || 'General',
        link: '',
        views: 0,
        likes: 0
      });
      saveToStorage();
      renderWorkspace();
      renderContents();
      showToast("Konten dipindahkan ke Published & dicatat di Content Log!", "success");
    }

    function deleteTodo(id) {
      ensureSingleBrandForWrite('menghapus Task');
      db.todos = db.todos.filter(t => t.id !== id);
      saveToStorage();
      renderWorkspace();
      showToast("Task dihapus");
    }

    function openNoteModal(id) {
      activeTodoId = id;
      populateAssigneeDropdowns();
      const t = db.todos.find(x => x.id === id);
      if (t) {
        const titleEl = document.getElementById('modal-task-title');
        const assigneeEl = document.getElementById('modal-task-assignee');
        const stageEl = document.getElementById('modal-task-stage');
        const pillarEl = document.getElementById('modal-task-pillar');
        const prioEl = document.getElementById('modal-task-priority');
        const dueEl = document.getElementById('modal-task-due');

        if (titleEl) titleEl.value = t.title || '';
        if (assigneeEl) {
          if (t.assignee && !Array.from(assigneeEl.options).some(o => o.value === t.assignee)) {
            const opt = document.createElement('option');
            opt.value = t.assignee;
            opt.textContent = t.assignee;
            assigneeEl.appendChild(opt);
          }
          assigneeEl.value = t.assignee || (assigneeEl.options[0] ? assigneeEl.options[0].value : '');
        }
        if (stageEl) stageEl.value = t.stage || 'Ideas';
        if (pillarEl) pillarEl.value = t.pillar || 'Charger';
        if (prioEl) prioEl.value = t.priority || 'Medium';
        if (dueEl) dueEl.value = t.due || '';
      }
      document.getElementById('modal-textarea').value = t ? (t.note || '') : '';
      document.getElementById('modal-note').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('modal-note').classList.add('hidden');
      activeTodoId = null;
    }

    function saveNote() {
      if (activeTodoId) {
        ensureSingleBrandForWrite('menyimpan perubahan Task & Script');
        const t = db.todos.find(x => x.id === activeTodoId);
        if (t) {
          const titleEl = document.getElementById('modal-task-title');
          const assigneeEl = document.getElementById('modal-task-assignee');
          const stageEl = document.getElementById('modal-task-stage');
          const pillarEl = document.getElementById('modal-task-pillar');
          const prioEl = document.getElementById('modal-task-priority');
          const dueEl = document.getElementById('modal-task-due');

          if (titleEl && titleEl.value.trim()) t.title = titleEl.value.trim();
          if (assigneeEl && assigneeEl.value) t.assignee = assigneeEl.value;
          if (stageEl && stageEl.value) t.stage = stageEl.value;
          if (pillarEl && pillarEl.value) t.pillar = pillarEl.value;
          if (prioEl && prioEl.value) t.priority = prioEl.value;
          if (dueEl) t.due = dueEl.value;
          t.note = document.getElementById('modal-textarea').value;
        }
        saveToStorage();
        renderWorkspace();
      }
      closeModal();
      showToast("Detail Tugas, Penanggung Jawab & Script berhasil disimpan!", "success");
    }

    // --- TEAM & PERSONNEL MANAGER MODAL (OPSI C: CUSTOM NAMA, JABATAN, NEW JOINER & SMART RENAME) ---
    function openTeamManagerModal(editMemberId = null) {
      ensureSingleBrandForWrite('mengelola Tim & Personil');
      const modal = document.getElementById('modal-team-manager');
      if (!modal) return;

      resetTeamMemberForm();
      renderTeamManagerModal();
      modal.classList.remove('hidden');

      if (editMemberId) {
        editTeamMember(editMemberId);
      }
    }

    function closeTeamManagerModal() {
      const modal = document.getElementById('modal-team-manager');
      if (modal) modal.classList.add('hidden');
    }

    function applyRolePreset(roleText, colorName) {
      const roleInp = document.getElementById('tm-inp-role');
      const colorInp = document.getElementById('tm-inp-color');
      if (roleInp) roleInp.value = roleText;
      if (colorInp && colorName) colorInp.value = colorName;
    }

    function resetTeamMemberForm() {
      const idEl = document.getElementById('tm-edit-id');
      const nameEl = document.getElementById('tm-inp-name');
      const roleEl = document.getElementById('tm-inp-role');
      const colorEl = document.getElementById('tm-inp-color');
      const quotaEl = document.getElementById('tm-inp-quota');
      const titleEl = document.getElementById('tm-form-title');
      const btnTextEl = document.getElementById('tm-btn-save-text');
      const cancelBtn = document.getElementById('tm-btn-cancel-edit');

      if (idEl) idEl.value = '';
      if (nameEl) nameEl.value = '';
      if (roleEl) roleEl.value = '';
      if (colorEl) colorEl.value = 'blue';
      if (quotaEl) quotaEl.value = '15';
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-plus text-indigo-500"></i> Tambah Personil Baru (New Joiner)`;
      if (btnTextEl) btnTextEl.innerText = 'Simpan Personil ke Tim';
      if (cancelBtn) cancelBtn.classList.add('hidden');
    }

    function editTeamMember(memberId) {
      const roster = ensureTeamRoster(db);
      const m = roster.find(x => x.id === memberId);
      if (!m) return;

      const idEl = document.getElementById('tm-edit-id');
      const nameEl = document.getElementById('tm-inp-name');
      const roleEl = document.getElementById('tm-inp-role');
      const colorEl = document.getElementById('tm-inp-color');
      const quotaEl = document.getElementById('tm-inp-quota');
      const titleEl = document.getElementById('tm-form-title');
      const btnTextEl = document.getElementById('tm-btn-save-text');
      const cancelBtn = document.getElementById('tm-btn-cancel-edit');

      if (idEl) idEl.value = m.id;
      if (nameEl) { nameEl.value = m.name; nameEl.focus(); }
      if (roleEl) roleEl.value = m.role;
      if (colorEl) colorEl.value = m.color || 'blue';
      if (quotaEl) quotaEl.value = m.monthlyQuota || 15;
      if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-user-pen text-amber-500"></i> Edit Personil: ${m.name}`;
      if (btnTextEl) btnTextEl.innerText = 'Update Nama & Jabatan (Auto-Sync)';
      if (cancelBtn) cancelBtn.classList.remove('hidden');
    }

    function saveTeamMemberFromModal(e) {
      if (e) e.preventDefault();
      ensureSingleBrandForWrite('menyimpan data Personil');

      const idEl = document.getElementById('tm-edit-id');
      const nameEl = document.getElementById('tm-inp-name');
      const roleEl = document.getElementById('tm-inp-role');
      const colorEl = document.getElementById('tm-inp-color');
      const quotaEl = document.getElementById('tm-inp-quota');

      const name = (nameEl ? nameEl.value : '').trim();
      const role = (roleEl ? roleEl.value : '').trim() || 'Team Member';
      const color = (colorEl ? colorEl.value : 'blue') || 'blue';
      const monthlyQuota = Math.max(1, Number(quotaEl ? quotaEl.value : 15) || 15);
      const editId = idEl ? idEl.value : '';

      if (!name) {
        showToast("Nama personil tidak boleh kosong!", "error");
        return;
      }

      const roster = ensureTeamRoster(db);
      const newLabel = `${name} (${role})`;
      const icon = getRoleIconByColorOrRole(role, color);

      if (editId) {
        const idx = roster.findIndex(x => x.id === editId);
        if (idx > -1) {
          const oldLabel = getMemberDisplayLabel(roster[idx]);
          roster[idx].name = name;
          roster[idx].role = role;
          roster[idx].color = color;
          roster[idx].icon = icon;
          roster[idx].monthlyQuota = monthlyQuota;

          // Smart Sync Rename across all existing Kanban / Calendar tasks
          let updatedTaskCount = 0;
          if (oldLabel !== newLabel) {
            (db.todos || []).forEach(t => {
              if (t.assignee === oldLabel) {
                t.assignee = newLabel;
                updatedTaskCount++;
              }
            });
            if (kanbanMemberFilter === oldLabel) {
              kanbanMemberFilter = newLabel;
            }
          }

          db.teamMembers = roster.map(m => getMemberDisplayLabel(m));
          saveToStorage();
          resetTeamMemberForm();
          renderTeamManagerModal();
          renderWorkspace();
          showToast(
            updatedTaskCount > 0
              ? `Personil diperbarui ke "${newLabel}" (${updatedTaskCount} tugas otomatis disinkronkan)!`
              : `Data personil "${newLabel}" berhasil diperbarui!`,
            "success"
          );
          return;
        }
      }

      // Check duplicate label when adding new joiner
      if (roster.some(m => getMemberDisplayLabel(m).toLowerCase() === newLabel.toLowerCase())) {
        showToast(`Personil "${newLabel}" sudah terdaftar di tim!`, "error");
        return;
      }

      roster.push({
        id: 'tm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name,
        role,
        color,
        icon,
        monthlyQuota
      });

      db.teamMembers = roster.map(m => getMemberDisplayLabel(m));
      saveToStorage();
      resetTeamMemberForm();
      renderTeamManagerModal();
      renderWorkspace();
      showToast(`🎉 New Joiner "${newLabel}" berhasil ditambahkan ke tim!`, "success");
    }

    function deleteTeamMember(memberId) {
      ensureSingleBrandForWrite('menghapus Personil');
      const roster = ensureTeamRoster(db);
      if (roster.length <= 1) {
        showToast("Minimal harus ada 1 personil di dalam tim!", "error");
        return;
      }

      const target = roster.find(x => x.id === memberId);
      if (!target) return;
      const oldLabel = getMemberDisplayLabel(target);
      const assignedTasks = (db.todos || []).filter(t => t.assignee === oldLabel);

      const fallbackMember = roster.find(x => x.id !== memberId && (x.name.toLowerCase().includes('team') || x.role.toLowerCase().includes('all'))) || roster.find(x => x.id !== memberId);
      const fallbackLabel = getMemberDisplayLabel(fallbackMember);

      const confirmMsg = assignedTasks.length > 0
        ? `Hapus "${oldLabel}" dari daftar tim?\n\nTerdapat ${assignedTasks.length} tugas aktif/riwayat milik ${target.name} yang akan otomatis dialihkan (handover) ke "${fallbackLabel}".`
        : `Hapus "${oldLabel}" dari daftar personil tim?`;

      if (!confirm(confirmMsg)) return;

      db.teamRoster = roster.filter(x => x.id !== memberId);
      db.teamMembers = db.teamRoster.map(m => getMemberDisplayLabel(m));

      if (assignedTasks.length > 0) {
        (db.todos || []).forEach(t => {
          if (t.assignee === oldLabel) t.assignee = fallbackLabel;
        });
      }
      if (kanbanMemberFilter === oldLabel) kanbanMemberFilter = 'all';

      saveToStorage();
      resetTeamMemberForm();
      renderTeamManagerModal();
      renderWorkspace();
      showToast(`Personil "${oldLabel}" telah dihapus dari tim.`, "info");
    }

    function copyTeamFromOtherBrand() {
      ensureSingleBrandForWrite('menyalin Tim dari Brand lain');
      const otherBrandKey = activeBrandId === 'brand_1' ? 'brand_2' : 'brand_1';
      const otherStore = brandsStore[otherBrandKey];
      if (!otherStore || !otherStore.db) return;

      const otherRoster = ensureTeamRoster(otherStore.db);
      const otherBrandName = otherStore.meta.name;
      const currentBrandName = brandsStore[activeBrandId].meta.name;

      if (!confirm(`Salin daftar ${otherRoster.length} personil dari "${otherBrandName}" ke "${currentBrandName}"?\n\n(Personil yang belum ada di ${currentBrandName} akan ditambahkan otomatis)`)) {
        return;
      }

      const currentRoster = ensureTeamRoster(db);
      let addedCount = 0;
      otherRoster.forEach(om => {
        const lbl = getMemberDisplayLabel(om);
        const exists = currentRoster.some(cm => getMemberDisplayLabel(cm).toLowerCase() === lbl.toLowerCase());
        if (!exists) {
          currentRoster.push({
            ...om,
            id: 'tm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
          });
          addedCount++;
        }
      });

      db.teamMembers = currentRoster.map(m => getMemberDisplayLabel(m));
      saveToStorage();
      renderTeamManagerModal();
      renderWorkspace();
      showToast(
        addedCount > 0
          ? `${addedCount} personil dari ${otherBrandName} berhasil disalin ke ${currentBrandName}!`
          : `Semua personil dari ${otherBrandName} sudah ada di ${currentBrandName}.`,
        "success"
      );
    }

    function renderTeamManagerModal() {
      const listEl = document.getElementById('tm-roster-list');
      const countEl = document.getElementById('tm-roster-count-label');
      const brandBadgeEl = document.getElementById('tm-brand-badge');
      const copyLabelEl = document.getElementById('tm-copy-brand-label');
      if (!listEl) return;

      const roster = ensureTeamRoster(db);
      const allTodos = db.todos || [];

      if (countEl) countEl.innerText = `${roster.length} Personil`;
      if (brandBadgeEl) {
        const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand 1';
        brandBadgeEl.innerText = `Workspace: ${bName}`;
      }
      if (copyLabelEl) {
        const otherKey = activeBrandId === 'brand_1' ? 'brand_2' : 'brand_1';
        const otherName = (brandsStore[otherKey] && brandsStore[otherKey].meta.name) || 'Brand Lain';
        copyLabelEl.innerText = `Salin Tim dari ${otherName}`;
      }

      const taskCounts = {};
      const publishedCounts = {};
      allTodos.forEach(t => {
        const a = t.assignee || '';
        taskCounts[a] = (taskCounts[a] || 0) + 1;
        if (t.stage === 'Published') {
          publishedCounts[a] = (publishedCounts[a] || 0) + 1;
        }
      });

      listEl.innerHTML = roster.map(m => {
        const lbl = getMemberDisplayLabel(m);
        const totalT = taskCounts[lbl] || 0;
        const pubT = publishedCounts[lbl] || 0;
        const c = m.color || 'blue';
        const ic = m.icon || getRoleIconByColorOrRole(m.role, c);
        const quota = m.monthlyQuota || 15;

        return `
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-indigo-400 transition">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-${c}-100 dark:bg-${c}-900/40 text-${c}-600 dark:text-${c}-400 flex items-center justify-center font-bold text-base shrink-0">
                <i class="fa-solid ${ic}"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-slate-800 dark:text-white text-sm truncate">${m.name}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-${c}-100 dark:bg-${c}-950 text-${c}-700 dark:text-${c}-300 border border-${c}-200 dark:border-${c}-800">${m.role}</span>
                </div>
                <div class="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span><i class="fa-solid fa-list-check mr-1 text-blue-500"></i><strong>${totalT}</strong> Tugas (${pubT} Published)</span>
                  <span><i class="fa-solid fa-bullseye mr-1 text-indigo-500"></i>Target: <strong>${quota}</strong> Video/Bln</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="editTeamMember('${m.id}')" class="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1" title="Edit Nama / Jabatan">
                <i class="fa-solid fa-pen text-[10px]"></i> Edit
              </button>
              <button onclick="deleteTeamMember('${m.id}')" class="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-xs transition" title="Hapus Personil">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // --- TAB 6: CONTENT LOG ---
    function toggleContentForm() {
      document.getElementById('content-form-container').classList.toggle('hidden');
    }

    const formContent = document.getElementById('form-content');
    if (formContent) {
      formContent.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('c-title').value.trim();
        const date = document.getElementById('c-date').value;
        const pillar = document.getElementById('c-pillar').value;
        const link = document.getElementById('c-link').value.trim();
        const views = Number(document.getElementById('c-views').value) || 0;
        const likes = Number(document.getElementById('c-likes').value) || 0;

        if (!title || !date) return;
        ensureSingleBrandForWrite('mencatat Content Log');

        db.contents.push({ id: Date.now(), title, date, pillar, link, views, likes });
        saveToStorage();
        e.target.reset();
        toggleContentForm();
        renderContents();
        showToast("Post berhasil dicatat di log!", "success");
      });
    }

    function deleteContent(id) {
      ensureSingleBrandForWrite('menghapus Content Log');
      db.contents = db.contents.filter(c => c.id !== id);
      saveToStorage();
      renderContents();
      showToast("Log konten dihapus");
    }

    function renderContents() {
      const search = (document.getElementById('search-log') ? document.getElementById('search-log').value : '').toLowerCase();
      const tbody = document.getElementById('content-table-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      if ((db.contents || []).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500">Belum ada catatan konten.</td></tr>';
        return;
      }

      const activeTeamLabel = activeBrandId === 'all'
        ? 'Multi-Brand Team'
        : `${(brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand'} Team`;

      db.contents
        .filter(c => c.title.toLowerCase().includes(search))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(c => {
          const linkBtn = c.link ? `<a href="${c.link}" target="_blank" class="text-blue-500 hover:underline text-xs block mt-1"><i class="fa-solid fa-link"></i> Buka Video</a>` : '';
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              <td class="px-5 py-4">
                <p class="font-semibold text-slate-800 dark:text-slate-200 text-xs">${c.title}</p>
                <div class="mt-1 flex items-center gap-2">${getPillarBadgeHtml(c.pillar)}</div>
                ${linkBtn}
              </td>
              <td class="px-5 py-4 text-xs text-slate-500">
                <p class="font-medium">${c.date}</p>
                <p class="text-[11px] text-slate-400">${activeTeamLabel}</p>
              </td>
              <td class="px-5 py-4 text-xs text-right text-slate-600 dark:text-slate-400 space-y-1">
                <div class="font-bold text-blue-600"><i class="fa-solid fa-eye mr-1"></i> ${formatNumber(c.views)}</div>
                <div class="text-rose-500"><i class="fa-solid fa-heart mr-1"></i> ${formatNumber(c.likes)}</div>
              </td>
              <td class="px-5 py-4 text-right">
                <button onclick="deleteContent(${c.id})" class="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Hapus Log">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        });
    }

    // --- MODAL TARGETS ---
    function openTargetModal() {
      ensureSingleBrandForWrite('mengatur Target KPI Bulanan');
      document.getElementById('inp-target-gmv').value = kpiTargets.gmv;
      document.getElementById('inp-target-views').value = kpiTargets.views;
      document.getElementById('inp-target-followers').value = kpiTargets.followers;
      const ctrInput = document.getElementById('inp-target-ctr');
      if (ctrInput) ctrInput.value = kpiTargets.ctr !== undefined ? kpiTargets.ctr : 5.0;
      document.getElementById('modal-target').classList.remove('hidden');
    }

    function closeTargetModal() {
      document.getElementById('modal-target').classList.add('hidden');
    }

    function saveTargets() {
      ensureSingleBrandForWrite('menyimpan Target KPI Bulanan');
      kpiTargets.gmv = Number(document.getElementById('inp-target-gmv').value) || 0;
      kpiTargets.views = Number(document.getElementById('inp-target-views').value) || 0;
      kpiTargets.followers = Number(document.getElementById('inp-target-followers').value) || 0;
      const ctrInput = document.getElementById('inp-target-ctr');
      if (ctrInput) kpiTargets.ctr = parseFloat(ctrInput.value) || 0;
      saveToStorage();
      closeTargetModal();
      const bName = (brandsStore[activeBrandId] && brandsStore[activeBrandId].meta.name) || 'Brand';
      showToast(`Target Bulanan ${bName} Diperbarui!`, "success");
      renderOverviewTab();
    }

    // --- INITIALIZATION ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!document.getElementById('modal-note').classList.contains('hidden')) closeModal();
        if (!document.getElementById('modal-target').classList.contains('hidden')) closeTargetModal();
        const brandModal = document.getElementById('modal-brand-settings');
        if (brandModal && !brandModal.classList.contains('hidden')) closeBrandSettingsModal();
        const repModal = document.getElementById('modal-executive-report');
        if (repModal && !repModal.classList.contains('hidden')) closeExecutiveReportModal();
        const vaultModal = document.getElementById('modal-monthly-vault');
        if (vaultModal && !vaultModal.classList.contains('hidden')) closeMonthlyVaultModal();
        const teamModal = document.getElementById('modal-team-manager');
        if (teamModal && !teamModal.classList.contains('hidden')) closeTeamManagerModal();
      }
    });


    // --- VERCEL OPSI C: IDE 1 (AUTO-SEED SNAPSHOT) & IDE 3 (WORKSPACE PIN PROTECTION) ---
    const WORKSPACE_PIN_STORAGE_KEY = 'dework_workspace_pin_config_v1';
    const WORKSPACE_PIN_SESSION_KEY = 'dework_workspace_pin_unlocked_v1';

    function getWorkspacePinConfig() {
      try {
        const raw = localStorage.getItem(WORKSPACE_PIN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            enabled: Boolean(parsed.enabled && parsed.pin),
            pin: String(parsed.pin || '').trim()
          };
        }
      } catch (e) {}
      // Also check if brandsStore carries a synced security config
      if (brandsStore && brandsStore.security && brandsStore.security.pin) {
        return {
          enabled: Boolean(brandsStore.security.enabled),
          pin: String(brandsStore.security.pin || '').trim()
        };
      }
      return { enabled: false, pin: '' };
    }

    function saveWorkspacePinConfig(enabled, pinCode) {
      const cleanPin = String(pinCode || '').trim();
      const cfg = {
        enabled: Boolean(enabled && cleanPin.length > 0),
        pin: cleanPin
      };
      try {
        localStorage.setItem(WORKSPACE_PIN_STORAGE_KEY, JSON.stringify(cfg));
        if (cfg.enabled) {
          sessionStorage.setItem(WORKSPACE_PIN_SESSION_KEY, 'true');
        }
      } catch (e) {}
      if (brandsStore) {
        brandsStore.security = cfg;
      }
      return cfg;
    }

    function checkAndEnforceWorkspacePinGate() {
      const cfg = getWorkspacePinConfig();
      const gateModal = document.getElementById('modal-pin-gate');
      if (!gateModal) return;
      if (!cfg.enabled || !cfg.pin) {
        gateModal.classList.add('hidden');
        return;
      }
      let isUnlocked = false;
      try {
        isUnlocked = sessionStorage.getItem(WORKSPACE_PIN_SESSION_KEY) === 'true';
      } catch (e) {}
      if (!isUnlocked) {
        gateModal.classList.remove('hidden');
        const inp = document.getElementById('pin-gate-input');
        if (inp) {
          inp.value = '';
          setTimeout(() => inp.focus(), 80);
        }
      } else {
        gateModal.classList.add('hidden');
      }
    }

    function verifyWorkspacePinInput() {
      const cfg = getWorkspacePinConfig();
      const inp = document.getElementById('pin-gate-input');
      const errEl = document.getElementById('pin-gate-error');
      const gateModal = document.getElementById('modal-pin-gate');
      if (!inp) return;
      if (inp.value.trim() === cfg.pin) {
        try { sessionStorage.setItem(WORKSPACE_PIN_SESSION_KEY, 'true'); } catch (e) {}
        if (errEl) errEl.classList.add('hidden');
        if (gateModal) gateModal.classList.add('hidden');
        showToast('Akses Workspace Terbuka!', 'success');
      } else {
        if (errEl) errEl.classList.remove('hidden');
        inp.value = '';
        inp.focus();
      }
    }

    function lockWorkspaceNow() {
      const cfg = getWorkspacePinConfig();
      const pinInputEl = document.getElementById('inp-workspace-pin-code');
      const pinEnabledEl = document.getElementById('inp-workspace-pin-enabled');
      if (pinInputEl && pinInputEl.value.trim()) {
        saveWorkspacePinConfig(true, pinInputEl.value.trim());
        if (pinEnabledEl) pinEnabledEl.checked = true;
      } else if (!cfg.enabled || !cfg.pin) {
        showToast('Isi Kode PIN terlebih dahulu sebelum mengunci layar!', 'error');
        if (pinInputEl) pinInputEl.focus();
        return;
      }
      try { sessionStorage.removeItem(WORKSPACE_PIN_SESSION_KEY); } catch (e) {}
      closeBrandSettingsModal();
      checkAndEnforceWorkspacePinGate();
    }

    function exportCloudSeedJSON() {
      captureCurrentBrandUploadLabels();
      const exportData = {
        meta: {
          app: 'Dework Space - Multi-Brand Content Analytics & Team Hub',
          exportedAt: new Date().toISOString(),
          activeBrandId: activeBrandId,
          multiBrandVersion: 4,
          isCloudSeed: true
        },
        brandsStore: brandsStore
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'initial_workspace.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('File initial_workspace.json berhasil diunduh! Letakkan di folder data/ untuk auto-seed Vercel.', 'success');
    }

    async function tryLoadVercelCloudSeed() {
      // Only fetch when running over HTTP/HTTPS (e.g. Vercel deployment or local dev server)
      if (typeof window === 'undefined' || !window.location || !/^https?:$/i.test(window.location.protocol)) {
        return false;
      }
      try {
        const res = await fetch('./data/initial_workspace.json', { cache: 'no-store' });
        if (!res.ok) return false;
        const parsed = await res.json();
        if (parsed && parsed.brandsStore && parsed.brandsStore.brand_1 && parsed.brandsStore.brand_2) {
          const b1HasData = Object.keys(parsed.brandsStore.brand_1.db?.daily || {}).length > 0 ||
                            (parsed.brandsStore.brand_1.db?.salesVideos || []).length > 0 ||
                            (parsed.brandsStore.brand_1.db?.videoList || []).length > 0;
          const b2HasData = Object.keys(parsed.brandsStore.brand_2.db?.daily || {}).length > 0 ||
                            (parsed.brandsStore.brand_2.db?.salesVideos || []).length > 0 ||
                            (parsed.brandsStore.brand_2.db?.videoList || []).length > 0;
          if (!b1HasData && !b2HasData) return false;

          brandsStore = parsed.brandsStore;
          ['brand_1', 'brand_2'].forEach(bk => {
            ensureBrandPillars(bk);
            if (!brandsStore[bk].uploadLabels) brandsStore[bk].uploadLabels = createDefaultUploadLabels();
            if (!brandsStore[bk].kpiTargets) brandsStore[bk].kpiTargets = { gmv: 0, views: 0, followers: 0, ctr: 0 };
            if (!brandsStore[bk].db) brandsStore[bk].db = createEmptyBrandDB();
            if (!brandsStore[bk].db.lockedMonths) brandsStore[bk].db.lockedMonths = {};
            ensureTeamRoster(brandsStore[bk].db);
            reclassifyBrandVideos(bk, false);
          });
          syncActiveBrandPointers();
          await saveToStorage();
          showToast('Data Cloud Seed (initial_workspace.json) berhasil dimuat otomatis!', 'info');
          return true;
        }
      } catch (err) {
        // Silent fallback if no seed file or offline
      }
      return false;
    }

    document.addEventListener('DOMContentLoaded', async () => {
      await loadFromStorage();
      const b1Empty = Object.keys(brandsStore.brand_1.db?.daily || {}).length === 0 &&
                      (brandsStore.brand_1.db?.salesVideos || []).length === 0 &&
                      (brandsStore.brand_1.db?.videoList || []).length === 0;
      const b2Empty = Object.keys(brandsStore.brand_2.db?.daily || {}).length === 0 &&
                      (brandsStore.brand_2.db?.salesVideos || []).length === 0 &&
                      (brandsStore.brand_2.db?.videoList || []).length === 0;
      if (b1Empty && b2Empty) {
        await tryLoadVercelCloudSeed();
      }
      checkAndEnforceWorkspacePinGate();
      renderAllTabs();
      renderWorkspace();
      renderContents();
      switchTab('overview');
      showToast("Dework Space Multi-Brand Siap! Gunakan Switcher Brand 1 / Brand 2 / Holding.", "info");
    });
