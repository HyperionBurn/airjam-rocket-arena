let instance;
export async function accountClient(config) {
  if (!config.supabaseUrl || !config.publishableKey) throw Error('Accounts are not configured. Casual and offline modes do not require an account.');
  if (!instance) {
    const { createClient } = await import('/assets/online/auth-sdk.js');
    instance = createClient(config.supabaseUrl, config.publishableKey, { auth: {
      flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
    } });
  }
  return instance;
}
export async function currentAccount(config) {
  const client = await accountClient(config);
  const { data, error } = await client.auth.getSession(); if (error) throw error;
  if (data.session && data.session.expires_at * 1000 < Date.now() + 60000) {
    const refreshed = await client.auth.refreshSession(); if (refreshed.error) throw refreshed.error;
    return refreshed.data.session;
  }
  return data.session;
}
