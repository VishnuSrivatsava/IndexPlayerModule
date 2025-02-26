var index_link = "https://myindex.21h51a05l9.workers.dev/0:/";
var payload = { "page_token": "", "page_index": 0 };

function decrypt(string) {
    var reversed = string.split('').reverse().join('');
    var substring = reversed.substring(24, reversed.length - 20);
    return atob(substring);
}

function fetchVideoLinks(payloadInput, url) {
    url = url.endsWith('/') ? url : url + "/";
    
    fetch(url, {
        method: 'POST',
        headers: {
            "Referer": index_link,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payloadInput)
    })
    .then(function(response) {
        if (!response.ok) {
            console.error("Failed to fetch links, status: " + response.status);
            return [];
        }
        return response.text();
    })
    .then(function(encryptedResponse) {
        var decryptedResponse;
        try {
            decryptedResponse = JSON.parse(decrypt(encryptedResponse));
        } catch (e) {
            console.error("Decryption or parsing failed. Check index link.");
            return [];
        }

        var videoLinks = [];
        var files = decryptedResponse.data.files;
        for (var i = 0; i < files.length; i++) {
            if (files[i].mimeType !== "application/vnd.google-apps.folder") {
                var fileName = files[i].name;
                var encodedName = encodeURI(fileName);
                videoLinks.push(url + encodedName);
            }
        }
        displayVideos(videoLinks);
    })
    .catch(function(error) {
        console.error("Fetch error:", error);
    });
}

var videoButtons = [];
var currentFocus = 0;

function displayVideos(videoLinks) {
    var videoListDiv = document.getElementById('videoList');
    if (!videoLinks || videoLinks.length === 0) {
        console.log("No video links to display");
        return;
    }
    
    for (var i = 0; i < videoLinks.length; i++) {
        var link = videoLinks[i];
        var button = document.createElement('button');
        button.innerHTML = link.split('/').pop();
        button.setAttribute('data-url', link);
        button.setAttribute('id', 'videoBtn' + i);
        videoListDiv.appendChild(button);
        videoButtons.push(button);
    }

    if (videoButtons.length > 0) {
        videoButtons[0].focus();
    }
}

function playVideo(videoUrl) {
    try {
        webapis.avplay.stop();
        webapis.avplay.open(videoUrl);
        webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
        webapis.avplay.setListener({
            onbufferingstart: function() { console.log("Buffering started"); },
            onbufferingprogress: function(percent) { console.log("Buffering: " + percent + "%"); },
            onbufferingcomplete: function() { console.log("Buffering complete"); },
            onstreamcompleted: function() {
                console.log("Video finished");
                webapis.avplay.stop();
            },
            onerror: function(error) { console.error("Playback error:", error); }
        });
        webapis.avplay.prepare();
        webapis.avplay.play();
    } catch (e) {
        console.error("AVPlay error:", e);
    }
}

function init() {
    console.log('init() called');
    fetchVideoLinks(payload, index_link);

    document.addEventListener('keydown', function(e) {
        switch (e.keyCode) {
            case 38: // UP arrow
                if (currentFocus > 0) {
                    currentFocus--;
                    videoButtons[currentFocus].focus();
                }
                break;
            case 40: // DOWN arrow
                if (currentFocus < videoButtons.length - 1) {
                    currentFocus++;
                    videoButtons[currentFocus].focus();
                }
                break;
            case 13: // OK button
                var selectedButton = videoButtons[currentFocus];
                var videoUrl = selectedButton.getAttribute('data-url');
                playVideo(videoUrl);
                break;
            case 10009: // RETURN button
                tizen.application.getCurrentApplication().exit();
                break;
            default:
                console.log('Key code:', e.keyCode);
                break;
        }
    });
}

window.onload = init;