'use strict';
if(new URLSearchParams(location.search).has('code')||new URLSearchParams(location.search).has('error'))spotifyAuth.handleCallback().then(()=>{location.replace('generator.html')}).catch(error=>{const info=document.createElement('p');info.className='callback-error';info.textContent='Spotify: '+error.message;document.querySelector('main').prepend(info)});
