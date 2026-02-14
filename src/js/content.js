

let downloadServer = "http://localhost:5476/api";
let getEpisodeTitle = false;


const isNullOrWhitespace = (str) => !str || !str.trim();
// replaces e.g. umlauts or accented characters with their closest ascii character.
const normalizeString = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

function addButtonContainer() {
  // Create the parent container if it doesn't exist
  const containerId = "video-dl-button-container-k'"
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = `
      position: fixed; top: 10px; right: 10px; z-index: 99999;
      background: rgba(0, 0, 0, 0.7); padding: 5px; border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4); color: white; max-width: 250px;
    `;

    // Add a header bar with minimize button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; background: #004080; padding: 4px 6px; border-radius: 5px;
      font-weight: bold; user-select: none;
    `;
    // header.innerText = 'Video Downloads';

        // Title element (hidden when collapsed)
    const title = document.createElement('span');
    title.innerText = 'Video Downloads';
    // title.id = 'header-title';
    title.style.cssText = 'flex-grow: 1; overflow: hidden; white-space: nowrap;';

    const toggle = document.createElement('span');
    toggle.innerText = '−';
    toggle.style.cssText = 'margin-left: 8px; font-weight: bold;';
    // toggle.style.cssText = 'margin-left: 8px; font-weight: bold; font-size: 16px; line-height: 1;';

    header.appendChild(title)
    header.appendChild(toggle);

    // The inner container for buttons
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.id = 'video-button-list';
    buttonsWrapper.style.cssText = 'margin-top: 5px; display: block;';

    // // Toggle minimize/maximize
    // header.addEventListener('click', () => {
    //   const isHidden = buttonsWrapper.style.display === 'none';
    //   buttonsWrapper.style.display = isHidden ? 'block' : 'none';
    //   toggle.innerText = isHidden ? '−' : '+';
    // });
    // Toggle minimize/maximize
    header.addEventListener('click', () => {
      const isHidden = buttonsWrapper.style.display === 'none';
      buttonsWrapper.style.display = isHidden ? 'block' : 'none';
      toggle.innerText = isHidden ? '−' : '+';
      title.style.display = isHidden ? 'inline' : 'none';  // Show/hide title
    });

    container.appendChild(header);
    container.appendChild(buttonsWrapper);
    document.body.appendChild(container);
  }
}

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

  addButtonContainer();
  const buttonsWrapper = document.getElementById('video-button-list');

  if(buttonsWrapper)
  {
    button.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        cursor: pointer; background: #004080; padding: 4px 6px; border-radius: 5px;
        font-weight: bold; user-select: none;
      `;
    buttonsWrapper.appendChild(button);
  }
  else {
    document.body.appendChild(button);
  }


}


async function sendDownloadRequest(entry) {

;
  const h1 = document.querySelector('h1');
  let showName = h1?.querySelector('span')?.textContent?.trim() || null;
  if(isNullOrWhitespace(showName)) {
    showName = h1?.textContent?.trim();
  }
  
  let year = document.querySelector('span[itemprop="startDate"]')?.querySelector("a")?.textContent?.trim();
  if (isNullOrWhitespace(year)) {
    year = document.querySelector('a[href*="jahr"]')?.textContent.trim();
  }
  // const startDate = span ? span.querySelector('a').textContent.trim() : '';

  const seasonDiv = document.querySelector('div[itemtype="http://schema.org/TVSeason"]')
  let seasonNumber = seasonDiv?.querySelector('meta[itemprop="seasonNumber"]')?.content;
  let episodeNumber = seasonDiv?.querySelector('meta[itemprop="episode"]')?.content;

  if(isNullOrWhitespace(seasonNumber)) {
    seasonNumber = document.querySelector('#season-nav')?.querySelector('a[class*="bg-primary"]')?.textContent?.trim();
  }

  if(isNullOrWhitespace(episodeNumber)) {
    episodeNumber = document.querySelector('#episode-nav')?.querySelector('a[class*="bg-primary"]')?.textContent?.trim();
  }

  let episodeTitle = document.querySelector('.episodeGermanTitle')?.textContent;
  if(isNullOrWhitespace(episodeTitle))
  {
    episodeTitle = document.querySelector('.episodeEnglishTitle')?.textContent;
  }
  if(!isNullOrWhitespace(episodeTitle)) {
      episodeTitle = normalizeString(episodeTitle).replace(/:/g, "-").replace(/\b\w/g, l => l.toUpperCase()).replace(/[^a-zA-Z0-9-]/g, "");
      episodeTitle = episodeTitle.replace(/:/g, "-");    
  }

  console.log(`Currently open: ${showName}, season: ${seasonNumber}, episode: ${episodeNumber}`); 

  let showFriendlyName;
  if(showName) {
    showFriendlyName = showName;
  } else {
    showFriendlyName = entry.tabData.title;
  }
  showFriendlyName = normalizeString(showFriendlyName).replace(/:/g, "-").replace(/\b\w/g, l => l.toUpperCase()).replace(/[^a-zA-Z0-9-]/g, "");
  showFriendlyName = showFriendlyName.replace(/:/g, "-");

  let filename = `${showFriendlyName}`;
  let directory = `${showFriendlyName}`;
  let baseDirectory = directory;
  if (!isNullOrWhitespace(year)) {
    directory += `-${year}`;
    baseDirectory = directory;
  }

  if (seasonNumber) {
    seasonNumber = seasonNumber.toString().padStart(2, "0");
    filename = `${showFriendlyName}-S${seasonNumber}`;
    directory = joinPath(directory, `season${seasonNumber}`);
  }
  if (episodeNumber) {
    episodeNumber = episodeNumber.toString().padStart(3, "0");
    filename = `${filename}E${episodeNumber}`;
  }

  
  if(getEpisodeTitle && !isNullOrWhitespace(episodeTitle) && (
    window.location.href.toLowerCase().includes("staffel") || window.location.href.toLocaleLowerCase().includes("episode")) ) {
    filename += `_${episodeTitle}`;
  } else if(getFilmTitle && !isNullOrWhitespace(episodeTitle) && window.location.href.toLowerCase().includes("film") ) {
    filename += `_${episodeTitle}`;
  }

  if (directory !== filename) {
    filename = joinPath(directory, filename); 
  }
  if (entry.category === "stream")
  {
    filename += ".%(ext)s";
  }
  else if (filename !== entry.filename ) {
    filename += entry.filename;
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
    year: year,
    directory: baseDirectory,
    filename: filename,
    episodeTitle: episodeTitle,
    userAgent: navigator.userAgent,
     
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

// Load initial state
browser.storage.local.get("getEpisodeTitle").then((result) => {
  getEpisodeTitle = !!result.getEpisodeTitle;
  console.log("Initial getEpisodeTitle:", getEpisodeTitle);
});
// Load initial state
browser.storage.local.get("getFilmTitle").then((result) => {
  getFilmTitle = !!result.getFilmTitle;
  console.log("Initial getFilmTitle:", getFilmTitle);
});

// Listen for future changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes.downloadServer) {
    downloadServer = changes.downloadServer.newValue || "";
    console.log("Download server updated:", downloadServer);
  }

  if (changes.getEpisodeTitle) {
    console.log(`getEpisodeTitle = ${getEpisodeTitle}`)
    getEpisodeTitle = !!changes.getEpisodeTitle.newValue; // ensure boolean
    console.log("getEpisodeTitle updated:", getEpisodeTitle);
    // Any other update logic here
  }
  if(changes.getFilmTitle) {
    getFilmTitle = !!changes.getFilmTitle.newValue; // ensure boolean
  }
});