// export async function copyURL (info)  {
//     const list = { urls: [], filenames: [], methodIncomp: false };
//     for (const e of info) {
//         let code;
//         let methodIncomp;
//         let fileMethod;

//         const streamURL = e.url;
//         const { filename } = e;
//         fileMethod = (await getStorage("copyMethod")) || "url"; // default to url - just in case

//         // don't use user-defined command if empty
//         if (
//             fileMethod.startsWith("user") &&
//             (await getStorage("userCommand" + fileMethod.at(-1))) === null
//         ) {
//             fileMethod = "url";
//             methodIncomp = true;
//         }

//         if (fileMethod === "url") code = streamURL;
//         else if (fileMethod === "tableForm")
//             code = `${streamURL} | ${
//                 titlePref && e.tabData?.title && !streamURL.includes(e.tabData.title)
//                     ? e.tabData.title
//                     : e.hostname
//             } | ${getTimestamp(e.timeStamp)}`; 
            
//             /* wtf is this mess, yandare dev? */

//         else if (fileMethod === "kodiUrl") code = streamURL;
//         else if (fileMethod === "ffmpeg") code = "ffmpeg";
//         else if (fileMethod === "streamlink") code = "streamlink";
//         else if (fileMethod === "mpv") code = "mpv";
//         else if (fileMethod === "ytdlp") {
//             code = "yt-dlp --no-part --restrict-filenames";

//             if (
//                 (await getStorage("multithreadPref")) &&
//                 (await getStorage("multithreadAmount"))
//             )
//                 code += ` -N ${await getStorage("multithreadAmount")}`;

//             if (
//                 (await getStorage("downloaderPref")) &&
//                 (await getStorage("downloaderCommand"))
//             )
//                 code += ` --downloader "${await getStorage("downloaderCommand")}"`;
//         } else if (fileMethod === "hlsdl") code = "hlsdl -b -c";
//         else if (fileMethod === "nm3u8dl") code = `N_m3u8DL-RE "${streamURL}"`;
//         else if (fileMethod.startsWith("user"))
//             code = await getStorage("userCommand" + fileMethod.at(-1));

//         // custom command line
//         const prefName = `customCommand${fileMethod}`;
//         if ((await getStorage("customCommandPref")) && (await getStorage(prefName)))
//             code += ` ${await getStorage(prefName)}`;

//         // http proxy
//         if ((await getStorage("proxyPref")) && (await getStorage("proxyCommand"))) {
//             if (fileMethod === "ffmpeg")
//                 code += ` -http_proxy "${await getStorage("proxyCommand")}"`;
//             else if (fileMethod === "streamlink")
//                 code += ` --http-proxy "${await getStorage("proxyCommand")}"`;
//             else if (fileMethod === "ytdlp")
//                 code += ` --proxy "${await getStorage("proxyCommand")}"`;
//             else if (fileMethod === "hlsdl")
//                 code += ` -p "${await getStorage("proxyCommand")}"`;
//             else if (fileMethod === "nm3u8dl")
//                 code += ` --custom-proxy "${await getStorage("proxyCommand")}"`;
//             else if (fileMethod.startsWith("user"))
//                 code = code.replace(
//                     new RegExp("%proxy%", "g"),
//                     await getStorage("proxyCommand")
//                 );
//         }

//         // additional headers
//         if (await getStorage("headersPref")) {
//             let headerUserAgent = e.headers.find(
//                 (header) => header.name.toLowerCase() === "user-agent"
//             );
//             headerUserAgent
//                 ? (headerUserAgent = headerUserAgent.value)
//                 : (headerUserAgent = navigator.userAgent);

//             let headerCookie = e.headers.find(
//                 (header) =>
//                     header.name.toLowerCase() === "cookie" ||
//                     header.name.toLowerCase() === "set-cookie"
//             );
//             if (headerCookie)
//                 headerCookie = headerCookie.value.replace(new RegExp(`"`, "g"), `'`); // double quotation marks mess up the command

//             let headerReferer = e.headers.find(
//                 (header) => header.name.toLowerCase() === "referer"
//             );
//             headerReferer = headerReferer
//                 ? headerReferer.value
//                 : e.originUrl || e.documentUrl || e.initiator || e.tabData?.url;
//             if (
//                 headerReferer?.startsWith("about:") ||
//                 headerReferer?.startsWith("chrome:")
//             )
//                 headerReferer = undefined;

//             if (headerUserAgent) {
//                 if (fileMethod === "kodiUrl")
//                     code += `|User-Agent=${encodeURIComponent(headerUserAgent)}`;
//                 else if (fileMethod === "ffmpeg")
//                     code += ` -user_agent "${headerUserAgent}"`;
//                 else if (fileMethod === "streamlink")
//                     code += ` --http-header "User-Agent=${headerUserAgent}"`;
//                 else if (fileMethod === "ytdlp")
//                     code += ` --user-agent "${headerUserAgent}"`;
//                 else if (fileMethod === "hlsdl") code += ` -u "${headerUserAgent}"`;
//                 else if (fileMethod === "nm3u8dl")
//                     code += ` --header "User-Agent: ${headerUserAgent}"`;
//                 else if (fileMethod.startsWith("user"))
//                     code = code.replace(new RegExp("%useragent%", "g"), headerUserAgent);
//             } else if (fileMethod.startsWith("user"))
//                 code = code.replace(new RegExp("%useragent%", "g"), "");

//             if (headerCookie) {
//                 if (fileMethod === "kodiUrl") {
//                     if (headerUserAgent) code += "&";
//                     else code += "|";
//                     code += `Cookie=${encodeURIComponent(headerCookie)}`;
//                 } else if (fileMethod === "ffmpeg")
//                     code += ` -headers "Cookie: ${headerCookie}"`;
//                 else if (fileMethod === "streamlink")
//                     code += ` --http-header "Cookie=${headerCookie}"`;
//                 else if (fileMethod === "ytdlp")
//                     code += ` --add-header "Cookie:${headerCookie}"`;
//                 else if (fileMethod === "hlsdl") code += ` -h "Cookie:${headerCookie}"`;
//                 else if (fileMethod === "nm3u8dl")
//                     code += ` --header "Cookie: ${headerCookie}"`;
//                 else if (fileMethod.startsWith("user"))
//                     code = code.replace(new RegExp("%cookie%", "g"), headerCookie);
//             } else if (fileMethod === "ytdlp") {

//                 if ((await getStorage("noCookies")) === false) {
//                     /* nocookies true won't add this junk */
//                 if (!isChrome) code += ` --cookies-from-browser firefox`;
//                 else code += ` --cookies-from-browser chrome`;
//             }

//             } else if (fileMethod.startsWith("user"))
//                 code = code.replace(new RegExp("%cookie%", "g"), "");

//             if (headerReferer) {
//                 if (fileMethod === "kodiUrl") {
//                     if (headerUserAgent || headerCookie) code += "&";
//                     else code += "|";
//                     code += `Referer=${encodeURIComponent(headerReferer)}`;
//                 } else if (fileMethod === "ffmpeg")
//                     code += ` -referer "${headerReferer}"`;
//                 else if (fileMethod === "streamlink")
//                     code += ` --http-header "Referer=${headerReferer}"`;
//                 else if (fileMethod === "ytdlp")
//                     code += ` --referer "${headerReferer}"`;
//                 else if (fileMethod === "hlsdl")
//                     code += ` -h "Referer:${headerReferer}"`;
//                 else if (fileMethod === "mpv")
//                     code += ` --referrer="${headerReferer}"`;
//                 else if (fileMethod === "nm3u8dl")
//                     code += ` --header "Referer: ${headerReferer}"`;
//                 else if (fileMethod.startsWith("user"))
//                     code = code.replace(new RegExp("%referer%", "g"), headerReferer);
//             } else if (fileMethod.startsWith("user"))
//                 code = code.replace(new RegExp("%referer%", "g"), "");
//         }

//         if (
//             fileMethod.startsWith("user") &&
//             (e.documentUrl || e.originUrl || e.initiator || e.tabData?.url)
//         )
//             code = code.replace(
//                 new RegExp("%origin%", "g"),
//                 e.documentUrl || e.originUrl || e.initiator || e.tabData?.url
//             );
//         else if (fileMethod.startsWith("user"))
//             code = code.replace(new RegExp("%origin%", "g"), "");

//         if (fileMethod.startsWith("user") && e.tabData?.title)
//             code = code.replace(
//                 new RegExp("%tabtitle%", "g"),
//                 e.tabData.title.replace(/[/\\?%*:|"<>]/g, "_")
//             );
//         else if (fileMethod.startsWith("user"))
//             code = code.replace(new RegExp("%tabtitle%", "g"), "");

//         let outFilename;
//         if (filenamePref && e.tabData?.title) outFilename = e.tabData.title;
//         else {
//             outFilename = filename;
//             if (outFilename.indexOf(".") !== -1) {
//                 // filename without extension
//                 outFilename = outFilename.split(".");
//                 outFilename.pop();
//                 outFilename = outFilename.join(".");
//             }
//         }

//         // sanitize tab title and timestamp
//         outFilename = outFilename.replace(/[/\\?%*:|"<>]/g, "_");
//         const outExtension = (await getStorage("fileExtension")) || "ts";
//         const outTimestamp = getTimestamp(e.timeStamp).replace(
//             /[/\\?%*:|"<>]/g,
//             "_"
//         );

//         /* Branding " - Website" removal txt list */
//         // Iterate through each web title and remove it from outFilename
//         let webTitlesBrandingRM=(await getStorage("webTitlesBrandingRM"));
//         webTitlesBrandingRM.forEach(title => {
//             outFilename = outFilename.replace(title, "");
//         });

//         // Trim any leading or trailing whitespaces after removing web titles
//         outFilename = outFilename.trim();
        
//         // final part of command (LINK TO VIDEO)
//         if (fileMethod === "ffmpeg") {
//             code += ` -i "${streamURL}" -c copy "${outFilename}`;
//             if (timestampPref) code += ` ${outTimestamp}`;
//             code += `.${outExtension}"`;
//         } else if (fileMethod === "mpv") {
//             code += ` "${streamURL}"`;
//         } else if (fileMethod === "streamlink") {
//             if ((await getStorage("streamlinkOutput")) === "file") {
//                 code += ` -o "${outFilename}`;
//                 if (timestampPref) code += ` ${outTimestamp}`;
//                 code += `.${outExtension}"`;
//             }
//             code += ` "${streamURL}" best`;
//         } else if (fileMethod === "ytdlp") {
//             if ((filenamePref && e.tabData?.title) || timestampPref) {
//                 code += ` --output "${outFilename}`;
//                 if (timestampPref) code += ` %(epoch)s`;
//                 code += `.%(ext)s"`;
//             }
//             code += ` "${streamURL}"`;
//         } else if (fileMethod === "hlsdl") {
//             code += ` -o "${outFilename}`;
//             if (timestampPref) code += ` ${outTimestamp}`;
//             code += `.${outExtension}" "${streamURL}"`;
//         } else if (fileMethod === "nm3u8dl") {
//             code += ` --save-name "${outFilename}`;
//             if (timestampPref) code += ` ${outTimestamp}`;
//             code += `"`;
//         } else if (fileMethod.startsWith("user")) {
//             code = code.replace(new RegExp("%url%", "g"), streamURL);
//             code = code.replace(new RegExp("%filename%", "g"), filename);
//             code = code.replace(new RegExp("%timestamp%", "g"), outTimestamp);
//         }

//         // regex for user command
//         if (
//             fileMethod.startsWith("user") &&
//             (await getStorage("regexCommandPref"))
//         ) {
//             const regexCommand = await getStorage("regexCommand");
//             const regexReplace = await getStorage("regexReplace");

//             code = code.replace(new RegExp(regexCommand, "g"), regexReplace || "");
//         }

//         // used to communicate with clipboard/notifications api
//         list.urls.push(code);
//         list.filenames.push(filename);
//         list.methodIncomp = methodIncomp;
//     }

//     try {
//         if (navigator.clipboard?.writeText)
//             navigator.clipboard.writeText(list.urls.join(newline));
//         else {
//             // old copying method for compatibility purposes
//             const copyText = document.createElement("textarea");
//             copyText.style.position = "absolute";
//             copyText.style.left = "-5454px";
//             copyText.style.top = "-5454px";
//             document.body.appendChild(copyText);
//             copyText.value = list.urls.join(newline);
//             copyText.select();
//             document.execCommand("copy");
//             document.body.removeChild(copyText);
//         }
//         if ((await getStorage("notifPref")) === false) {
//             chrome.notifications.create("copy", {
//                 type: "basic",
//                 // iconUrl: notifIcon,
//                 title: _("notifCopiedTitle"),
//                 message:
//                     (list.methodIncomp
//                         ? _("notifIncompCopiedText")
//                         : _("notifCopiedText")) + list.filenames.join(newline)
//             });
//         }
//     } catch (e) {
//         chrome.notifications.create("error", {
//             type: "basic",
//             // iconUrl: notifIcon,
//             title: _("notifErrorTitle"),
//             message: _("notifErrorText") + e
//         });
//     }
// };
