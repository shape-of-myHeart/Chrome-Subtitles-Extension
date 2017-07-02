const fileUpload = document.getElementById("file-upload");

const submit = document.getElementsByClassName("submit")[0];
submit.loading = () => submit.classList.add('loading');
submit.unload = () => submit.classList.remove('loading');

const information = document.getElementsByClassName("subtitles-info")[0];
information.setting = ({ title, path }) => {
    information.classList.remove("folded");
    information.textContent = title;
};

const videoList = document.getElementsByClassName("video-list")[0];
const videos = {};

videoList.loading = () => videoList.classList.add('loading');
videoList.unload = () => videoList.classList.remove('loading');

videoList.setting = (frameId, length) => {
    videoList.classList.remove("folded");
    videoList.classList.remove("empty");
    videoList.innerHTML = "";

    console.log(frameId);
    videos[frameId] = length;

    let keys = Object.keys(videos);
    let empty = 0;

    for (let i = 0; i < keys.length; i++) {
        empty += videos[keys[i]];
    }

    if (empty === 0) {
        index.classList.add("empty");
        return;
    }
    for (let i = 0; i < length; i++) {
        let div = document.createElement("div");

        div.classList.add("item");
        div.setAttribute("data-frame-id", frameId);
        div.setAttribute("data-index", i);

        div.innerHTML = `Video <b>${frameId}</b>-${i + 1}`;

        div.addEventListener("mouseenter",
            () => connection.postMessage({ type: "highlightVideoArea", data: { index: i, frameId: frameId } })
        );

        div.addEventListener("mouseleave",
            () => connection.postMessage({ type: "unHighlightVideoArea", data: { index: i, frameId: frameId } })
        );

        div.addEventListener("click",
            () => {
                if (activedSmi === undefined) {
                    return;
                }
                connection.postMessage({ type: "applySubtitles", data: { index: i, smiData: activedSmi, frameId: frameId } })
            }
        );

        videoList.appendChild(div);
    }
};

let activedSmi;

fileUpload.addEventListener("change", e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    submit.loading();

    reader.onload = e => {
        submit.unload();

        information.setting({
            title: fileUpload.files.item(0).name
        });

        activedSmi = e.target.result;
    };

    reader.onerror = e => {
        submit.unload();
    }

    reader.readAsText(file);
});

/* execute script */
chrome.tabs.executeScript(null, { file: './injection.js', allFrames: true, runAt: "document_start" });

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        sendResponse({ farewell: request.greeting });
    }
);

let connection;
chrome.runtime.onConnect.addListener(pConnection => {
    connection = pConnection;
    console.log = msg => connection.postMessage({ type: 'console-log', data: msg });

    connection.onMessage.addListener(
        (res, sender) => {
            let frameId = sender.sender.frameId;

            switch (res.type) {
                case 'getVideoList':
                    videoList.setting(frameId, res.data);
                    videoList.unload();
                    break;
            }
        }
    );

    videoList.loading();
    /* frameId => true : post message whole frames */
    connection.postMessage({ type: "getVideoList" });
});