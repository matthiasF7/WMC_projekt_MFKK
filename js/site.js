const pathPrefix = window.location.pathname.includes('/continents/') ? '..' : '.';
const apiFallbackUrl = `${pathPrefix}/db.json`;
const sidebarFallbackPath = window.location.pathname.includes('/continents/') ? '../legacy_companies/sidebar.html' : './legacy_companies/sidebar.html';
const apiHostUrl = 'http://127.0.0.1:3000';

function getRootRelative(path) {
  return window.location.pathname.includes('/continents/') ? `../${path}` : `./${path}`;
}

function getApiUrl(resource) {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${apiHostUrl}/${resource}`;
  }
  return apiFallbackUrl;
}

async function fetchCompanies() {
  const url = getApiUrl('companies');
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return data.companies || [];
  } catch (error) {
    console.warn('Primary company fetch failed, falling back to local JSON:', error);
    if (url !== apiFallbackUrl) {
      try {
        const response = await fetch(apiFallbackUrl);
        if (!response.ok) {
          throw new Error(`Fallback request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.companies || [];
      } catch (fallbackError) {
        console.error('Fallback company fetch failed:', fallbackError);
      }
    }
    return [];
  }
}

function getCompanyLink(company) {
  const base = window.location.pathname.includes('/continents/') ? '../company.html' : 'company.html';
  return `${base}?id=${encodeURIComponent(company.id)}`;
}

function groupByContinent(companies) {
  return companies.reduce((groups, company) => {
    const key = company.continent || 'other';
    if (!groups[key]) {
      groups[key] = { label: company.continentName || key, companies: [] };
    }
    groups[key].companies.push(company);
    return groups;
  }, {});
}

function createSidebarHtml(companies) {
  const groups = groupByContinent(companies);

  const sidebarSections = Object.values(groups)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(group => {
      const companyLinks = group.companies
        .map(company => `<a href="${getCompanyLink(company)}">${company.name}</a>`)
        .join('\n');
      const continentPage = getRootRelative(group.companies[0]?.continentPage || '#');
      return `
        <details>
          <summary class="menu-btn btn btn-primary w-100 text-start">${group.label}</summary>
          <div class="menu-list show">
            <a href="${continentPage}" class="continent-link">Continent Info</a>
            <div class="ps-3">
              ${companyLinks}
            </div>
          </div>
        </details>
      `;
    })
    .join('\n');

  return `
    <div class="sidebar d-flex flex-column gap-2">
      ${sidebarSections}
      <a href="satellites.html" class="btn btn-primary w-100 text-start">Satellites</a>
    </div>
  `;
}

async function fetchSidebarFallback() {
  try {
    const response = await fetch(sidebarFallbackPath);
    if (!response.ok) {
      throw new Error(`Fallback sidebar request failed: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.warn('Fallback sidebar load failed:', error);
    return null;
  }
}

async function renderSidebar(containerId = 'sidebar-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  try {
    const companies = await fetchCompanies();
    if (!companies || companies.length === 0) {
      const fallbackHtml = await fetchSidebarFallback();
      if (fallbackHtml) {
        container.innerHTML = fallbackHtml;
        return;
      }
      container.innerHTML = `
        <div class="sidebar d-flex flex-column gap-2">
          <p style="color:#fff; padding: 20px;">Sidebar is loading or no companies are available.</p>
          <a href="satellites.html" class="btn btn-primary w-100 text-start">Satellites</a>
        </div>
      `;
      return;
    }
    container.innerHTML = createSidebarHtml(companies);
  } catch (error) {
    console.error('Sidebar render failed:', error);
    const fallbackHtml = await fetchSidebarFallback();
    if (fallbackHtml) {
      container.innerHTML = fallbackHtml;
      return;
    }
    container.innerHTML = `
      <div class="sidebar d-flex flex-column gap-2">
        <p style="color:#fff; padding: 20px;">Sidebar is currently unavailable.</p>
        <a href="satellites.html" class="btn btn-primary w-100 text-start">Satellites</a>
      </div>
    `;
  }
}

function createCompanyDetailHtml(company) {
  const keyAreas = company.keyBusinessAreas
    ? company.keyBusinessAreas.map(area => `<li><strong>${area}</strong></li>`).join('\n')
    : '';

  return `
    <h2>${company.name}</h2>
    <p>${company.description}</p>

    <h3>Overview</h3>
    <p>${company.overview}</p>

    <h3>Key Business Areas</h3>
    <ul>
      ${keyAreas}
    </ul>

    <h3>Notable Projects</h3>
    <p>${company.notableProjects}</p>

    <h3>Future Direction</h3>
    <p>${company.futureDirection}</p>
  `;
}

function updateCompanyHeader(company) {
  const titleElement = document.getElementById('company-title');
  const breadcrumbElement = document.getElementById('breadcrumb');
  const logoElement = document.getElementById('company-logo');

  if (titleElement) {
    titleElement.textContent = company.name;
  }

  if (breadcrumbElement) {
    const continentUrl = getRootRelative(company.continentPage);
    breadcrumbElement.innerHTML = `
      <a href="index.html">Home</a> / <a href="${continentUrl}">${company.continentName}</a> / <strong>${company.name}</strong>
    `;
  }

  if (logoElement) {
    logoElement.src = company.logo || 'pictures/rocket.jpg';
    logoElement.alt = `${company.name} logo`;
  }

  document.title = `${company.name} - Spaceflight`;
}

function renderNotFound(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.innerHTML = `
    <h2>Company not found</h2>
    <p>The requested company does not exist in the data source.</p>
    <a href="index.html" class="btn btn-primary">Back to Home</a>
  `;
  const titleElement = document.getElementById('company-title');
  if (titleElement) {
    titleElement.textContent = 'Company not found';
  }
  const breadcrumbElement = document.getElementById('breadcrumb');
  if (breadcrumbElement) {
    breadcrumbElement.innerHTML = `<a href="index.html">Home</a> / <strong>Not found</strong>`;
  }
  document.title = 'Company not found - Spaceflight';
}

async function renderCompanyPage(companyId, containerId = 'company-content') {
  const companyContent = document.getElementById(containerId);
  if (!companyContent) {
    return;
  }
  if (!companyId) {
    renderNotFound(containerId);
    return;
  }

  const companies = await fetchCompanies();
  const company = companies.find(item => item.id === companyId);
  if (!company) {
    renderNotFound(containerId);
    return;
  }

  updateCompanyHeader(company);
  companyContent.innerHTML = createCompanyDetailHtml(company);
}
