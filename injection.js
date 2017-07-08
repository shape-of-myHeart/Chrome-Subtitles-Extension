(window => {
    const connection = chrome.runtime.connect();

    connection.onMessage.addListener(
        ({ type, data, callback }) => {
            let res = undefined;

            switch (type) {

                case 'getVideoList':
                    res = {
                        length: videos.length,
                        fileNames: videos.map(
                            obj => obj._Chrome_Subtitles_Data && obj._Chrome_Subtitles_Data.fileName
                        )
                    };
                    break;

                case 'cancelSubtitles':
                    var v = videos[data.index];

                    v._Chrome_Subtiles_Time_Update = false;

                    v._Chrome_Subtitles_Dom_Area.remove();
                    v._Chrome_Subtitles_Dom_Alert.remove();

                    delete v._Chrome_Subtitles_Data;
                    delete v._Chrome_Subtitles_Dom_Area;
                    delete v._Chrome_Subtitles_Dom_Alert;
                    delete v._Chrome_Subtitles_Alert;
                    delete v._Chrome_Subtiles_Alert_Timer;


                    res = data.index;
                    
                    return;

                case 'highlightVideoArea':
                    var v = videos[data.index];
                    let { x, y, w, h } = getRect(v);

                    videoSelector.style.width = w + 'px';
                    videoSelector.style.height = h + 'px';
                    videoSelector.style.top = y - window.scrollY + 'px';
                    videoSelector.style.left = x - window.scrollX + 'px';
                    break;

                case 'unHighlightVideoArea':
                    videoSelector.style.width = '';
                    videoSelector.style.height = '';
                    videoSelector.style.top = '';
                    videoSelector.style.left = '';
                    break;

                case 'applySubtitles':
                    var v = videos[data.index];

                    /* Set Subtitles Datas */
                    v._Chrome_Subtitles_Data = new Smi();
                    v._Chrome_Subtitles_Data.parse(data.smiData);

                    v._Chrome_Subtitles_Data.fileName = data.fileName;

                    /* Set Subtitles Output Area */
                    v._Chrome_Subtitles_Dom_Area = (
                        () => {
                            let videoSubtitles = document.querySelector(`div.-chrome-subtitles-item-video-subtitles[data-video-index='${data.index}']`);

                            if (!videoSubtitles) {
                                videoSubtitles = document.createElement('div');

                                videoSubtitles.classList.add('-chrome-subtitles-item-video-subtitles');
                                videoSubtitles.setAttribute('data-video-index', data.index);
                                videoSubtitles.setAttribute('style', 'position:fixed;background-color:rgba(8, 8, 8, 0.74902);border-radius: 2.66667px;font-size:21px;color:#fff;-webkit-box-decoration-break: clone;z-index:2147483647;');

                                document.body.appendChild(videoSubtitles);
                            }

                            return videoSubtitles;
                        }
                    )();

                    /* Set Alert Area */
                    v._Chrome_Subtitles_Dom_Alert = (
                        () => {
                            let div = document.querySelector(`div.-chrome-subtitles-item-alert[data-video-index='${data.index}']`);

                            if (!div) {
                                div = document.createElement('div');

                                div.classList.add('-chrome-subtitles-item-alert');
                                div.setAttribute('data-video-index', data.index);
                                div.setAttribute('style', 'position:fixed;font-size:21px;color:#fff;-webkit-box-decoration-break: clone;z-index:2147483647;');

                                document.body.appendChild(div);
                            }

                            return div;
                        }
                    )();

                    v._Chrome_Subtiles_Alert = msg => {
                        let area = v._Chrome_Subtitles_Dom_Alert;

                        let { x, y, w, h } = getRect(v);
                        area.style.top = (y + 10) + 'px';
                        area.style.left = (x + 10) + 'px';

                        area.style.width = (w - 10) + 'px';

                        area.innerHTML = msg;

                        if (v._Chrome_Subtiles_Alert_Timer) {
                            clearTimeout(v._Chrome_Subtiles_Alert_Timer);
                        }

                        v._Chrome_Subtiles_Alert_Timer = setTimeout(
                            () => area.innerHTML = null,
                            5000
                        );
                    }
                    v._Chrome_Subtiles_Alert(`Apllied Subtitles : ${data.fileName}`);

                    if (v._Chrome_Subtiles_Time_Update !== true) {
                        v.addEventListener('timeupdate', timeupdate);
                    }
                    v._Chrome_Subtiles_Time_Update = true;
            }

            if (callback !== false) {
                connection.postMessage({
                    type: type,
                    data: res
                });
            }
        }
    );

    const videos = [];
    const getPosition = obj => {
        let pos = {
            x: 0,
            y: 0
        };
        if (obj) {
            pos.x = obj.offsetLeft;
            pos.y = obj.offsetTop;

            if (obj.offsetParent) {
                let ppos = getPosition(obj.offsetParent);
                pos.x += ppos.x;
                pos.y += ppos.y;
            }
        }
        return pos;
    };

    const getRect = v => {
        let p = getPosition(v);

        return {
            w: v.clientWidth,
            h: v.clientHeight,
            x: p.x,
            y: p.y
        };
    };

    Array.from(document.getElementsByTagName('video')).map(
        v => {
            videos.push(v);
        }
    );

    /* DOM Settings */
    const videoSelector = document.createElement('div');

    Array.from(document.querySelectorAll('div.-chrome-subtitles-item-video-selector')).map(e => e.remove());
    videoSelector.classList.add('-chrome-subtitles-item-video-selector');
    videoSelector.setAttribute('style', 'position:fixed; background-color:rgba(2, 136, 209, 0.5); z-index:2147483647; pointer-events: none;');
    document.body.appendChild(videoSelector);

    const resize =
        () => {
            videos.map(
                video => {
                    var area = video._Chrome_Subtitles_Dom_Area;
                    var alert = video._Chrome_Subtitles_Dom_Alert;

                    let { x, y, w, h } = getRect(video);

                    if (area) {
                        area.style.top = (h + y - area.clientHeight - 10 - window.scrollY) + 'px';
                        area.style.left = (w / 2 - area.clientWidth / 2 + x - window.scrollX) + 'px';
                    }

                    if (alert) {
                        alert.style.top = (y + 10 - window.scrollY) + 'px';
                        alert.style.left = (x + 10 - window.scrollX) + 'px';
                    }
                }
            );
        };
    resize();
    window.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);

    function timeupdate(e) {
        if(this._Chrome_Subtiles_Time_Update !== true){
            return;
        }
        
        let smi = this._Chrome_Subtitles_Data;
        let area = this._Chrome_Subtitles_Dom_Area;

        let currentTime = this.currentTime;
        let index = smi.getIndexByTime(currentTime * 1000);

        if (index === this.subtitlesIndex) {
            return;
        } else {
            this.subtitlesIndex = index;
        }

        let text = smi.getTextByIndex(index);
        let { x, y, w, h } = getRect(this);

        area.innerHTML = text === undefined ? null : text;

        area.style.top = (h + y - area.clientHeight - 10 - window.scrollY) + 'px';
        area.style.left = (w / 2 - area.clientWidth / 2 + x - window.scrollX) + 'px';
    }

    /* Smi Class Settings */
    if (!window._Chrome_Subtiles_Service) {
        window._Chrome_Subtiles_Service = (() => {
            class Smi {
                constructor() {
                    let times = [];
                    let texts = [];

                    this.getTextByIndex = i => texts[i];
                    this.getTextByTime = i => texts[this.getIndexByTime(i)];
                    this.getIndexByTime = time => {
                        let s = 0, e = times.length, m, t;

                        while (s < e) {
                            m = Math.floor((s + e) / 2);
                            t = times[m].start;

                            if (t < time) {
                                s = m + 1;
                            } else if (t > time) {
                                e = m - 1;
                            } else {
                                break;
                            }
                        }

                        let min = Math.min(s, m);
                        let max = Math.max(s, m);
                        let result = null;

                        if (max >= times.length) {
                            return times.length - 1;
                        }

                        if (times[min].start <= time && time < times[max].start) {
                            result = min;
                        }

                        if (times[max].start <= time) {
                            result = max;
                        }

                        if (times[min].start > time && min > 0) {
                            result = min - 1;
                        }

                        if (result !== null && times[result].end !== null && times[result].end < time) {
                            return null;
                        }

                        return result;
                    };
                    this.parse = data => {
                        let tags = data.match(/<SYNC[^<]+?>/gi);

                        for (let i = 0, l = tags.length; i < l, i < l; i++) {
                            let tag = tags[i];

                            let start = tag.match(/Start=[0-9]*/i);
                            if (start !== null) {
                                start = Number(start[0].split('=')[1]);
                            }

                            let end = tag.match(/End=[0-9]*/i);
                            if (end !== null) {
                                end = Number(end[0].split('=')[1]);
                            }

                            times.push(
                                {
                                    start: start,
                                    end: end,
                                }
                            );
                        }

                        texts = data.split(/<SYNC[^<]+?>/i);
                        texts[texts.length - 1] = texts[texts.length - 1].replace(/<\/?BODY[^>]*>/gi, '');
                        texts[texts.length - 1] = texts[texts.length - 1].replace(/<\/?SAMI[^>]*>/gi, '');
                        texts.shift();
                    };
                }
            }
            return {
                Smi: Smi
            };
        }
        )();
    }

    const { Smi } = window._Chrome_Subtiles_Service;

})(window);