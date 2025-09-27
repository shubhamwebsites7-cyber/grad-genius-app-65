// App loader script that loads the built JavaScript files
(function() {
  console.log('App loader script starting...');
  
  // Check if we have OAuth tokens in the hash first
  const hash = window.location.hash;
  if (hash && hash.includes('access_token=')) {
    console.log('OAuth tokens detected in hash, redirecting to callback...');
    
    // Extract the path and redirect to auth callback
    const path = window.location.pathname;
    const newUrl = path + '/auth/callback' + hash;
    
    console.log('Redirecting to:', newUrl);
    window.location.replace(newUrl);
    return;
  }
  
  // Try to load the built app
  const script = document.createElement('script');
  script.type = 'module';
  
  // Try different possible paths for the built files
  const possiblePaths = [
    '/assets/index.js',
    '/assets/main.js', 
    '/index.js',
    '/main.js'
  ];
  
  let loaded = false;
  
  function tryLoadScript(index) {
    if (index >= possiblePaths.length) {
      console.error('Could not load any built JavaScript files');
      document.getElementById('root').innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>Loading Error</h1>
            <p>Unable to load the application. Please refresh the page.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">Refresh</button>
          </div>
        </div>
      `;
      return;
    }
    
    const path = possiblePaths[index];
    console.log('Trying to load:', path);
    
    script.src = path;
    script.onload = function() {
      console.log('Successfully loaded:', path);
      loaded = true;
    };
    script.onerror = function() {
      console.log('Failed to load:', path);
      tryLoadScript(index + 1);
    };
    
    document.head.appendChild(script);
  }
  
  tryLoadScript(0);
})();
