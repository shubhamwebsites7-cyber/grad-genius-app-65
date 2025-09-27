// Handle OAuth callback with hash tokens
(function() {
  console.log('Hash handler script loaded');
  
  // Check if we have OAuth tokens in the hash
  const hash = window.location.hash;
  if (hash && hash.includes('access_token=')) {
    console.log('OAuth tokens detected in hash, redirecting to callback...');
    
    // Extract the path and redirect to auth callback
    const path = window.location.pathname;
    const newUrl = path + '/auth/callback' + hash;
    
    console.log('Redirecting to:', newUrl);
    window.location.replace(newUrl);
  }
})();
