// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const initDashboard = () => {

    const dashboardContainer = document.getElementById('dashboard-container');
    const userEmailEl = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const refreshAllBtn = document.getElementById('refresh-all-btn');

    // Stats Elements
    const statDonorsCount = document.getElementById('stat-donors-count');
    const statPendingCount = document.getElementById('stat-pending-count');
    const statFulfilledCount = document.getElementById('stat-fulfilled-count');

    // Tables & Lists
    const urgentBoardTbody = document.getElementById('urgent-board-tbody');
    const recentRequestsContainer = document.getElementById('recent-requests-container');
    const donorsTableTbody = document.getElementById('donors-table-tbody');
    const requestsTableTbody = document.getElementById('requests-table-tbody');
    const urgentLargeGrid = document.getElementById('urgent-large-grid');

    // Search and filter
    const donorSearchInput = document.getElementById('donor-search-input');
    const donorBloodFilter = document.getElementById('donor-blood-filter');

    // Forms
    const addUrgentForm = document.getElementById('add-urgent-form');

    // Live Date
    document.getElementById('current-date').textContent = `System Live Status: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    let currentSession = null;


    // Toast Notifications
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('admin-toast-message');

    const showToast = (message, isSuccess = true) => {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');
        
        if (isSuccess) {
            icon.className = 'fa-solid fa-circle-check toast-icon';
            toast.style.borderLeftColor = '#10B981';
        } else {
            icon.className = 'fa-solid fa-circle-xmark toast-icon';
            toast.style.borderLeftColor = '#EF4444';
        }
        
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    };

    // =========================================
    // DIRECT DASHBOARD LOAD (no login required)
    // =========================================
    // Show staff info label
    userEmailEl.textContent = 'Staff Portal';
    // Auto-load all data immediately
    loadAllDashboardData();

    logoutBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });



    // =========================================
    // TAB NAVIGATION
    // =========================================
    const tabs = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTab = tab.dataset.tab;
            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.remove('hidden');
                    content.classList.add('active');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('active');
                }
            });
        });
    });

    // =========================================
    // FETCH & SYNC DATA
    // =========================================
    const loadAllDashboardData = async () => {
        if (!supabase) return;
        showToast("Synchronizing system database...", true);
        
        await Promise.all([
            fetchStats(),
            fetchUrgentBoard(),
            fetchDonorNetwork(),
            fetchEmergencyBroadcasts(),
            fetchUrgentSettingsLarge()
        ]);
    };

    refreshAllBtn.addEventListener('click', loadAllDashboardData);

    // 1. Fetch Quick Stats
    const fetchStats = async () => {
        const { count: donorCount } = await supabase.from('donor_registrations').select('*', { count: 'exact', head: true });
        const { count: pendingCount } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: fulfilledCount } = await supabase.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'fulfilled');

        statDonorsCount.textContent = donorCount || 0;
        statPendingCount.textContent = pendingCount || 0;
        statFulfilledCount.textContent = fulfilledCount || 0;
    };

    // 2. Fetch & Render Urgent Requirement Board (Manager and list)
    const fetchUrgentBoard = async () => {
        const { data, error } = await supabase
            .from('urgent_requirements')
            .select('*')
            .order('is_urgent', { ascending: false })
            .order('units_needed', { ascending: false });

        if (error) return;

        urgentBoardTbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.blood_group}</strong></td>
                <td>
                    <input type="number" class="block-units-input-table" value="${item.units_needed}" min="1" max="100" data-id="${item.id}">
                </td>
                <td>
                    <select class="action-selector urgent-toggle-select" data-id="${item.id}">
                        <option value="true" ${item.is_urgent ? 'selected' : ''}>Urgent</option>
                        <option value="false" ${!item.is_urgent ? 'selected' : ''}>Normal</option>
                    </select>
                </td>
                <td>
                    <button class="btn-table-action delete" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            urgentBoardTbody.appendChild(tr);
        });

        // Add event listeners for direct table input changes
        document.querySelectorAll('.block-units-input-table').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const units = parseInt(e.target.value);
                await supabase.from('urgent_requirements').update({ units_needed: units }).eq('id', id);
                showToast("Urgent units count updated", true);
            });
        });

        document.querySelectorAll('.urgent-toggle-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const isUrgent = e.target.value === 'true';
                await supabase.from('urgent_requirements').update({ is_urgent: isUrgent }).eq('id', id);
                showToast("Urgent status flag updated", true);
                fetchUrgentBoard();
            });
        });

        // Add delete listener
        document.querySelectorAll('.btn-table-action.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const { error } = await supabase.from('urgent_requirements').delete().eq('id', id);
                if (!error) {
                    showToast("Requirement removed", true);
                    fetchUrgentBoard();
                    fetchUrgentSettingsLarge();
                }
            });
        });
    };

    // 3. Add urgent blood type
    addUrgentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const blood = document.getElementById('new-urgent-blood').value;
        const units = parseInt(document.getElementById('new-urgent-units').value);

        const { error } = await supabase.from('urgent_requirements').insert([{
            blood_group: blood,
            units_needed: units,
            is_urgent: true
        }]);

        if (error) {
            showToast(`Failed to add: ${error.message}`, false);
        } else {
            showToast("Added urgent requirement!", true);
            addUrgentForm.reset();
            fetchUrgentBoard();
            fetchUrgentSettingsLarge();
        }
    });

    // 4. Fetch & Render Donor Network Table
    const fetchDonorNetwork = async () => {
        let query = supabase.from('donor_registrations').select('*').order('created_at', { ascending: false });

        const searchVal = donorSearchInput.value.trim().toLowerCase();
        const bloodFilter = donorBloodFilter.value;

        if (bloodFilter) {
            query = query.eq('blood_group', bloodFilter);
        }

        const { data, error } = await query;
        if (error) return;

        // Apply clientside search matching for name or batch
        const filteredData = data.filter(item => {
            return !searchVal || 
                   item.full_name.toLowerCase().includes(searchVal) || 
                   item.academic_batch.toLowerCase().includes(searchVal) || 
                   item.phone.includes(searchVal);
        });

        donorsTableTbody.innerHTML = '';
        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(item.created_at).toLocaleString()}</td>
                <td><strong>${item.full_name}</strong></td>
                <td><span class="blood-badge font-bold">${item.blood_group}</span></td>
                <td><a href="tel:${item.phone}" class="tel-link"><i class="fa-solid fa-phone"></i> ${item.phone}</a></td>
                <td>${item.academic_batch}</td>
            `;
            donorsTableTbody.appendChild(tr);
        });
    };

    donorSearchInput.addEventListener('input', fetchDonorNetwork);
    donorBloodFilter.addEventListener('change', fetchDonorNetwork);

    // 5. Fetch & Render Emergency Broadcasts (Desk and dashboard feed)
    const fetchEmergencyBroadcasts = async () => {
        const { data, error } = await supabase
            .from('blood_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return;

        // Render dashboard overview sidebar activity
        recentRequestsContainer.innerHTML = '';
        data.slice(0, 5).forEach(req => {
            const div = document.createElement('div');
            div.className = 'request-item-card';
            div.innerHTML = `
                <div class="req-card-left">
                    <div class="req-blood-circle">${req.blood_group}</div>
                    <div class="req-card-details">
                        <h4>${req.patient_description}</h4>
                        <p>Units needed: ${req.units_needed} | Case: ${new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <span class="status-badge ${req.status}">${req.status}</span>
            `;
            recentRequestsContainer.appendChild(div);
        });

        // Render emergency dispatch full desk table
        requestsTableTbody.innerHTML = '';
        data.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(req.created_at).toLocaleString()}</td>
                <td><strong>${req.patient_description}</strong></td>
                <td><span class="blood-badge font-bold">${req.blood_group}</span></td>
                <td>${req.units_needed} units</td>
                <td><a href="tel:${req.contact_number}" class="tel-link"><i class="fa-solid fa-phone"></i> ${req.contact_number}</a></td>
                <td><span class="status-badge ${req.status}">${req.status}</span></td>
                <td>
                    <select class="action-selector request-status-change" data-id="${req.id}">
                        <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="fulfilled" ${req.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                        <option value="cancelled" ${req.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            `;
            requestsTableTbody.appendChild(tr);
        });

        // Add listener for status updates
        document.querySelectorAll('.request-status-change').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const status = e.target.value;

                const { error } = await supabase
                    .from('blood_requests')
                    .update({ status: status })
                    .eq('id', id);

                if (error) {
                    showToast(`Failed to update case: ${error.message}`, false);
                } else {
                    showToast("Patient emergency status updated!", true);
                    fetchEmergencyBroadcasts();
                    fetchStats();
                }
            });
        });
    };

    // 6. Large Dedicated Urgent Block Settings (Grid view)
    const fetchUrgentSettingsLarge = async () => {
        const { data, error } = await supabase
            .from('urgent_requirements')
            .select('*');

        if (error) return;

        urgentLargeGrid.innerHTML = '';
        
        // Render 8 master blood groups blocks
        const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        
        groups.forEach(grp => {
            const match = data.find(d => d.blood_group === grp);
            const active = !!match;
            const units = match ? match.units_needed : 0;
            const isUrgent = match ? match.is_urgent : false;

            const div = document.createElement('div');
            div.className = `urgent-block ${active ? 'active' : ''}`;
            div.innerHTML = `
                <span class="block-blood-title">${grp}</span>
                <div class="toggle-switch-wrapper">
                    <span>DISPLAY STATUS</span>
                    <select class="action-selector block-status-toggle" data-blood="${grp}">
                        <option value="inactive" ${!active ? 'selected' : ''}>Hidden</option>
                        <option value="active" ${active ? 'selected' : ''}>Visible</option>
                    </select>
                </div>
                <div class="form-group" style="width: 100%; display: ${active ? 'block' : 'none'}">
                    <label>Units Needed</label>
                    <input type="number" class="block-units-input large-block-units" value="${units}" min="1" max="100" data-blood="${grp}" style="width: 100%">
                </div>
                <div class="toggle-switch-wrapper" style="display: ${active ? 'flex' : 'none'}">
                    <span>URGENT LEVEL</span>
                    <select class="action-selector block-urgency-toggle" data-blood="${grp}">
                        <option value="false" ${!isUrgent ? 'selected' : ''}>Normal</option>
                        <option value="true" ${isUrgent ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
            `;
            urgentLargeGrid.appendChild(div);
        });

        // Add listeners for block status toggle
        document.querySelectorAll('.block-status-toggle').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const blood = e.target.dataset.blood;
                const status = e.target.value;

                if (status === 'active') {
                    // Create requirement entry
                    await supabase.from('urgent_requirements').insert([{
                        blood_group: blood,
                        units_needed: 1,
                        is_urgent: false
                    }]);
                    showToast(`${blood} added to active board`, true);
                } else {
                    // Delete requirement entry
                    await supabase.from('urgent_requirements').delete().eq('blood_group', blood);
                    showToast(`${blood} removed from active board`, true);
                }
                loadAllDashboardData();
            });
        });

        // Add units change listener
        document.querySelectorAll('.large-block-units').forEach(input => {
            input.addEventListener('change', async (e) => {
                const blood = e.target.dataset.blood;
                const units = parseInt(e.target.value);
                await supabase.from('urgent_requirements').update({ units_needed: units }).eq('blood_group', blood);
                showToast(`${blood} units count updated`, true);
            });
        });

        // Add urgency level change listener
        document.querySelectorAll('.block-urgency-toggle').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const blood = e.target.dataset.blood;
                const isUrgent = e.target.value === 'true';
                await supabase.from('urgent_requirements').update({ is_urgent: isUrgent }).eq('blood_group', blood);
                showToast(`${blood} urgency level updated`, true);
                loadAllDashboardData();
            });
        });
    };
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
