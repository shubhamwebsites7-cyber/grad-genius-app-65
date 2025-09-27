// Simple script to check if build files are accessible
console.log('Build check script loaded');

fetch('/assets/')
  .then(response => {
    console.log('Assets directory response:', response.status, response.statusText);
  })
  .catch(error => {
    console.log('Assets directory error:', error);
  });

// Check if we can access the main entry point
fetch('/src/main.tsx')
  .then(response => {
    console.log('Main.tsx response:', response.status, response.statusText);
    return response.text();
  })
  .then(text => {
    console.log('Main.tsx content preview:', text.substring(0, 100));
  })
  .catch(error => {
    console.log('Main.tsx error:', error);
  });
