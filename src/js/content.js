// import { copyURL } from "./util";

const isNullOrWhitespace = (str) => !str || !str.trim();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'notifyNewVideo') {
    console.log(`notifyNewVideo: ${JSON.stringify(message, null, 2)}`);
    addVideoButton(message.newEntry);
  }
});

// Create button with network log data (creates NEW button each time)
function addVideoButton(entry) {

  //const entry = networkLog[networkLog.length - 1] || [];
  console.log(`Adding entry to html ${entry?.url}`)
  const button = document.createElement('button');
  const buttonIndex = document.querySelectorAll('[id^="video-log-btn-"]').length + 1;

//   const buttonIndex = document.querySelectorAll('.video-log-btn').length + 1;
//   const buttonIndex = document.querySelectorAll('#video-log-btn').length + 1;
  button.id = `video-log-btn-${buttonIndex}`;  // Unique ID for each button
  button.innerText = `Download ${entry.category} ( ${entry.pattern} )`;
  button.style.cssText = `
    position: fixed; top: ${10 + (buttonIndex - 1) * 30}px; right: 10px; z-index: 99999;
    padding: 2px 5px; background: #0066cc; color: white;
    border: none; border-radius: 5px; font-weight: bold; cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;

// button.onclick = async () => {
//   try {
//     // Call your exported copyURL function instead of fetch
//     const result = await copyURL({ 
//       linkUrl: window.location.href  // Pass the URL you want to copy
//     });
//     console.log(result);  // "URL copied" or whatever your function returns
//   } catch (error) {
//     console.error('Copy failed:', error);
//   }
// };

  button.onclick = async () => {
    await sendDownloadRequest(entry);
  };

  document.body.appendChild(button);
}


async function sendDownloadRequest(entry) {

  const h1s = document.querySelectorAll("h1");
  const h1 = document.querySelector('h1');
  const showName = h1?.querySelector('span')?.textContent || 'No span found';
  


  // By exact itemtype match
  const seasonDiv = document.querySelector('div[itemtype="http://schema.org/TVSeason"]')
  const seasonNumber = seasonDiv?.querySelector('meta[itemprop="seasonNumber"]')?.content;
  const episodeNumber = seasonDiv?.querySelector('meta[itemprop="episode"]')?.content;

  console.log(`Currently open: ${showName}, season: ${seasonNumber}, episode: ${episodeNumber}`); // "Mashle: Magic and Muscles"

  // // Combined with itemprop (most specific)
  // document.querySelector('div[itemprop="containsSeason"][itemtype="http://schema.org/TVSeason"]')

  // // Contains TVSeason (if URL varies)
  // document.querySelector('div[itemtype*="TVSeason"]')

  // // All elements with itemtype attribute
  // document.querySelectorAll('div[itemtype]')

  let showFriendlyName;
  if(!isNullOrWhitespace(showName)) {
    showFriendlyName = showName
  } else {
    showFriendlyName = entry.tabData.title
  }

    const payload = {
      timestamp: Date.now(),
      pageUrl: window.location.href,
      lastEntry: entry,
      show: showName,
      season: seasonNumber,
      episode: episodeNumber,
    };
    
    await fetch('http://localhost:5476', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
}

