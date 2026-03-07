class SsoWaffleMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.apps = [];
        this.loading = true;
        this.error = null;
        this.ssoApiUrl = this.getAttribute('sso-url') || 'http://localhost:8081';
        this.ssoFrontendUrl = this.getAttribute('sso-fe-url') || 'http://localhost:3001';
    }

    async connectedCallback() {
        this.render();
        this.setupEventListeners();
        await this.fetchApps();
    }

    async fetchApps() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            this.error = "No session found";
            this.loading = false;
            this.render();
            return;
        }

        try {
            const response = await fetch(`${this.ssoApiUrl}/api/user/apps`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.error = "Session expired";
                } else {
                    this.error = "Failed to load apps";
                }
                throw new Error("HTTP Error " + response.status);
            }

            const data = await response.json();
            this.apps = data.data || [];
        } catch (err) {
            console.error("SSO Waffle Menu Error:", err);
            if (!this.error) this.error = "Failed to load apps";
        } finally {
            this.loading = false;
            this.render();
        }
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.render();
    }

    closeMenu(e) {
        if (!this.shadowRoot.contains(e.target)) {
            this.isOpen = false;
            this.render();
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const path = e.composedPath();
            if (!path.includes(this)) {
                if (this.isOpen) {
                    this.isOpen = false;
                    this.render();
                }
            }
        });
    }

    async logout() {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                await fetch(`${this.ssoApiUrl}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Logout API failed", err);
            }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = `${this.ssoFrontendUrl}/login?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    }

    render() {
        const style = `
            :host {
                display: inline-block;
                position: relative;
                font-family: inherit; /* Menyatu dengan font website parent */
            }
            .waffle-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b; /* slate-500 */
                transition: all 0.2s ease;
            }
            .waffle-btn:hover {
                background-color: #f1f5f9; /* slate-100 */
                color: #0f172a; /* slate-900 */
            }
            .waffle-icon {
                display: grid;
                grid-template-columns: repeat(3, 4px);
                gap: 2px;
            }
            .dot {
                width: 4px;
                height: 4px;
                background-color: currentColor;
                border-radius: 1px;
            }
            .dropdown-panel {
                display: ${this.isOpen ? 'block' : 'none'};
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                width: 320px;
                background: white;
                border: 1px solid #e2e8f0; /* slate-200 */
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                border-radius: 8px;
                padding: 16px;
                z-index: 9999;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e2e8f0;
            }
            .title {
                font-size: 14px;
                font-weight: 600;
                color: #0f172a;
                margin: 0;
            }
            .logout-btn {
                background: none;
                border: none;
                color: #ef4444;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            .logout-btn:hover {
                background: #fef2f2;
            }
            .apps-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .app-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 12px 8px;
                border-radius: 6px;
                text-decoration: none;
                color: #475569;
                transition: all 0.2s ease;
                text-align: center;
                border: 1px solid transparent;
            }
            .app-card:hover {
                background-color: #f8fafc;
                color: #0f172a;
                border-color: #e2e8f0;
            }
            .app-icon {
                font-size: 20px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                background-color: #f1f5f9;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                color: #334155;
            }
            .app-name {
                font-size: 12px;
                font-weight: 500;
                line-height: 1.2;
            }
            .loading, .error-msg {
                padding: 24px;
                text-align: center;
                font-size: 13px;
                color: #64748b;
            }
            .error-msg {
                color: #ef4444;
            }
        `;

        let content = '';

        if (this.loading) {
            content = `<div class="loading">Loading apps...</div>`;
        } else if (this.error) {
            content = `<div class="error-msg">${this.error}<br><button class="logout-btn" style="margin-top: 10px;" id="error-login">Re-Login</button></div>`;
        } else if (this.apps.length === 0) {
            content = `<div class="loading">No apps available</div>`;
        } else {
            const token = localStorage.getItem('access_token');
            const appsHtml = this.apps.map(app => `
                <a href="${app.base_url}?access_token=${token}" class="app-card">
                    <div class="app-icon">${app.icon || '🚀'}</div>
                    <div class="app-name">${app.name}</div>
                </a>
            `).join('');

            content = `
                <div class="header">
                    <h3 class="title">Sistem Internal</h3>
                    <button class="logout-btn" id="logout-btn">Keluar</button>
                </div>
                <div class="apps-grid">
                    ${appsHtml}
                </div>
            `;
        }

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            <button class="waffle-btn" id="waffle-toggle" title="Aplikasi">
                <div class="waffle-icon">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </button>
            <div class="dropdown-panel">
                ${content}
            </div>
        `;

        this.shadowRoot.getElementById('waffle-toggle').addEventListener('click', () => this.toggleMenu());

        const logoutBtn = this.shadowRoot.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const errorLoginBtn = this.shadowRoot.getElementById('error-login');
        if (errorLoginBtn) {
            errorLoginBtn.addEventListener('click', () => this.logout());
        }
    }
}

customElements.define('sso-waffle-menu', SsoWaffleMenu);
