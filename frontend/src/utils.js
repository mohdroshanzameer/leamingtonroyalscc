export function createPageUrl(pageName, params = {}) {
  // Special-case routes that are not pure kebab-case
  const special = {
    Home: '/',
    SignIn: '/signin',
  };

  const baseFromMap = special[pageName];

  const kebabCase = pageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  const baseUrl = baseFromMap ?? `/${kebabCase}`;
  const queryString = new URLSearchParams(params).toString();
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}