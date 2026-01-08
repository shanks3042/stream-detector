

let downloadServer = "http://localhost:5476/api";


const isNullOrWhitespace = (str) => !str || !str.trim();

function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot + 1);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'notifyNewVideo') {
    console.log(`notifyNewVideo: ${JSON.stringify(message, null, 2)}`);
    addVideoButton(message.newEntry);
  }
});


function addVideoButton(entry) {

  console.log(`Adding entry to html ${entry?.url}`)
  const button = document.createElement('button');
  const buttonIndex = document.querySelectorAll('[id^="video-log-btn-"]').length + 1;


  button.id = `video-log-btn-${buttonIndex}`;  // Unique ID for each button
  button.innerText = `Download ${entry.category} ( ${entry.filename} )`;
  button.style.cssText = `
    position: fixed; top: ${10 + (buttonIndex - 1) * 30}px; right: 10px; z-index: 99999;
    padding: 2px 5px; background: #0066cc; color: white;
    border: none; border-radius: 5px; font-weight: bold; cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  `;



  button.onclick = async () => {

    
    // Force repaint to ensure change sticks
    button.offsetHeight;      

    await sendDownloadRequest(entry);

    button.style.background = '#28a745';
    // Use backgroundColor (more specific) instead of background
    button.style.backgroundColor = '#28a745';
    button.style.setProperty('background-color', '#28a745', 'important');  // Force override

  };

  document.body.appendChild(button);
}


async function sendDownloadRequest(entry) {

;
  const h1 = document.querySelector('h1[itemprop="name"]');
  const showName = h1?.querySelector('span')?.textContent || null;
  
  const span = document.querySelector('span[itemprop="startDate"]');
  const startDate = span ? span.querySelector('a').textContent.trim() : '';

  const seasonDiv = document.querySelector('div[itemtype="http://schema.org/TVSeason"]')
  let seasonNumber = seasonDiv?.querySelector('meta[itemprop="seasonNumber"]')?.content;
  let episodeNumber = seasonDiv?.querySelector('meta[itemprop="episode"]')?.content;

  console.log(`Currently open: ${showName}, season: ${seasonNumber}, episode: ${episodeNumber}`); 

  let showFriendlyName;
  if(showName) {
    showFriendlyName = showName;
  } else {
    showFriendlyName = entry.tabData.title;
  }
  showFriendlyName = showFriendlyName.replace(/:/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/\b\w/g, l => l.toUpperCase());
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
    directory = joinPath(showFriendlyName, `season${seasonNumber}`);
  }
  if (episodeNumber) {
    episodeNumber = episodeNumber.toString().padStart(3, "0");
    filename = `${filename}E${episodeNumber}`;
  }

  if (entry.category === "stream")
  {
    filename += ".%(ext)s";
  }
  else if (filename !== entry.filename ) {
    filename += entry.filename;
  }
  if (directory !== filename) {
    filename = joinPath(directory, filename); 
  }

  const ext = getExtension(filename); 
  if ((isNullOrWhitespace(ext) || ext.length > 10) && !isNullOrWhitespace(entry.ext)) {
    filename += `.${entry.ext}`;
  }




  const payload = {
    timestamp: Date.now(),
    pageUrl: window.location.href,
    requestDetails: entry,
    show: showName,
    showFriendlyName: showFriendlyName,
    filename: filename,
    userAgent: navigator.userAgent
  };

  server = `${downloadServer}`;
  console.log(`Sending download request to server ${server}`);

  if (!isNullOrWhitespace(server)) {

    await fetch(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  }
  
}

function joinPath(...parts) {
  return parts
    .filter(Boolean)
    .map((p, i) =>
      i === 0
        ? p.replace(/\/+$/, "")      // first: remove trailing slashes
        : p.replace(/^\/+|\/+$/g, "") // others: remove leading/trailing
    )
    .join("/");
}




// Load initial value
browser.storage.local.get("downloadServer").then(result => {
  if (result.downloadServer) {
    downloadServer = result.downloadServer;
  }
  console.log("Using download server:", downloadServer);
});

// Listen for FUTURE changes (this is what you were missing)
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.downloadServer) {
    downloadServer = changes.downloadServer.newValue || "";
    console.log("Download server updated:", downloadServer);
    // Any other update logic here
  }
});
