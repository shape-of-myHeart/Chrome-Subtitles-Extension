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

videoList.setting = (frameId, {length, fileNames}) => {
    videoList.classList.remove("folded");
    videoList.classList.remove("empty");

    const connection = connections[frameId];
    videos[frameId] = length;

    let keys = Object.keys(videos);
    let empty = 0;

    for (let i = 0; i < keys.length; i++) {
        empty += videos[keys[i]];
    }

    if (empty === 0) {
        videoList.classList.add("empty");
        return;
    }

    const createPop = (i, div) => {
        let popDiv = document.createElement('div');

        popDiv.classList.add("btn-pop");

        popDiv.setAttribute("data-frame-id", frameId);
        popDiv.setAttribute("data-index", i);

        videoList.insertBefore(popDiv, div);

        popDiv.addEventListener('click', () => {
            connection.postMessage({ type: "cancelSubtitles", data: { index: i } });

            div.innerHTML = `Video <b>${frameId}</b>-${i + 1}`;
            popDiv.remove();
        });
    };

    for (let i = 0; i < length; i++) {
        let div = document.createElement("div");

        div.classList.add("item");
        div.setAttribute("data-frame-id", frameId);
        div.setAttribute("data-index", i);

        div.innerHTML = fileNames[i] || `Video <b>${frameId}</b>-${i + 1}`;
        
        div.addEventListener("mouseenter",
            () => connection.postMessage({ type: "highlightVideoArea", data: { index: i } })
        );

        div.addEventListener("mouseleave",
            () => connection.postMessage({ type: "unHighlightVideoArea", data: { index: i } })
        );

        div.addEventListener("click",
            () => {
                if (activedSmi === undefined) {
                    div.classList.add("error-no-subtitles");
                    return;
                }

                div.classList.remove("error-no-subtitles");
                div.classList.add("applied");

                let fileName = fileUpload.files.item(0).name;
                div.textContent = fileName;

                connection.postMessage({ type: "applySubtitles", data: { index: i, smiData: activedSmi, fileName: fileName } });
                createPop(i, div);
            }
        );
        
        videoList.appendChild(div);

        if (fileNames[i]) {
            createPop(i, div);
        }
    }
};

let activedSmi;

fileUpload.addEventListener("change", e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    submit.loading();
    
    if(fileUpload.files.item(0).name.substr(-3).toLowerCase() !== "smi"){
        submit.unload();
        chrome.tabs.executeScript(null, { code: 'alert("This file is not smi File.");', allFrames: true });
        return;
    }

    reader.onload = e => {
        submit.unload();

        information.setting({
            title: fileUpload.files.item(0).name
        });
        console.log(e.target.result);
        activedSmi = e.target.result;
    };

    reader.onerror = e => {
        submit.unload();
    }

    reader.readAsText(file, 'euc-kr');
});

/* execute script */
chrome.tabs.executeScript(null, { file: './injection.js', allFrames: true });

let connections = {};

chrome.runtime.onConnect.addListener((pConnection) => {
    connections[pConnection.sender.frameId] = pConnection;

    pConnection.onMessage.addListener(
        (res, sender) => {
            let frameId = sender.sender.frameId;

            switch (res.type) {
                case 'getVideoList':
                    videoList.setting(frameId, res.data);
                    break;
            }
        }
    );

    pConnection.postMessage({ type: "getVideoList" });
});