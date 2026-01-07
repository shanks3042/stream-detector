
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
  button.innerText = `Download ${entry.category} ( ${entry.filename} )`;
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

  // const h1s = document.querySelectorAll("h1");
  const h1 = document.querySelector('h1[itemprop="name"]');
  const showName = h1?.querySelector('span')?.textContent || 'No span found';
  
  // const startDate = document.querySelector('a[href="https://aniworld.to/animes/jahr/2026"]').textContent;
  const span = document.querySelector('span[itemprop="startDate"]');
  const startDate = span ? span.querySelector('a').textContent.trim() : '';

  // By exact itemtype match
  const seasonDiv = document.querySelector('div[itemtype="http://schema.org/TVSeason"]')
  const seasonNumber = seasonDiv?.querySelector('meta[itemprop="seasonNumber"]')?.content;
  const episodeNumber = seasonDiv?.querySelector('meta[itemprop="episode"]')?.content;

  console.log(`Currently open: ${showName}, season: ${seasonNumber}, episode: ${episodeNumber}`); 

  let showFriendlyName;
  if(showName) {
    showFriendlyName = showName
  } else {
    showFriendlyName = entry.tabData.title

  }
  showFriendlyName = showName.replace(/:/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/\b\w/g, l => l.toUpperCase());
  showFriendlyName = showFriendlyName.replace(/:/g, "-");
  console.log(`showfriendlyName = ${showFriendlyName}`)

  let filename = `${showFriendlyName}`;
  let directory = `${showFriendlyName}`;
  if (entry.startDate) {
    directory += `-${entry.startDate}`;
  }

  if (seasonNumber) {
    seasonNumber = seasonNumber.toString().padStart(2, "0");
    filename = `${showFriendlyName}-S${seasonNumber}`;
    directory = new URL(`season${seasonNumber}`, showFriendlyName).pathname;
  }

  if (episodeNumber) {
    episodeNumber = episodeNumber.toString().padStart(3, "0");
    filename = `${filename}E${episodeNumber}`;
  }

  filename += "%(ext)s"

  filename = new URL(filename, directory).pathname;

  const payload = {
    timestamp: Date.now(),
    pageUrl: window.location.href,
    requestDetails: entry,
    show: showName,
    showFriendlyName: showFriendlyName,
    filename: filename,
    season: seasonNumber,
    episode: episodeNumber,
    startDate: startDate,
    userAgent: navigator.userAgent
  };
    
    await fetch('http://localhost:5476/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
}

