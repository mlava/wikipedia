var ARTlanguage = "en";
var OTDlanguage = "en";
var FClanguage = "en";
var APIkey, key;

export default {
    onload: ({ extensionAPI }) => {
        const config = {
            tabTitle: "Wikipedia import",
            settings: [
                {
                    id: "wiki-apikey",
                    name: "Wikimedia API key",
                    description: "Obtain an API key from https://api.wikimedia.org/wiki/Special:AppManagement. Click on Create key button and then select a Personal API token option.",
                    action: { type: "input", placeholder: "" },
                },
                {
                    id: "wiki-sentences",
                    name: "Extract sentences",
                    description: "Number of sentences to import",
                    action: { type: "input", placeholder: "6" },
                },
                {
                    id: "wiki-art-language",
                    name: "Wikipedia language",
                    description: "Any language code from https://wikistats.wmcloud.org/display.php?t=wp",
                    action: { type: "input", placeholder: "en", onChange: (evt) => { setArt(evt); } },
                },
                {
                    id: "wiki-feat-language",
                    name: "Featured Article language",
                    description: "Two-letter language code",
                    action: { type: "select", items: ["en", "bn", "de", "el", "he", "hu", "ja", "la", "sd", "sv", "ur", "zh"], onChange: (evt) => { setFeat(evt); } },
                },
                {
                    id: "wiki-otd-language",
                    name: "On This Day language",
                    description: "Two-letter language code",
                    action: { type: "select", items: ["en", "de", "fr", "sv", "pt", "ru", "es", "ar", "bs"], onChange: (evt) => { setOTD(evt); } },
                },
            ]
        };
        extensionAPI.settings.panel.create(config);

        // onload
        if (extensionAPI.settings.get("wiki-apikey")) {
            APIkey = extensionAPI.settings.get("wiki-apikey");
        }
        if (extensionAPI.settings.get("wiki-art-language")) {
            ARTlanguage = extensionAPI.settings.get("wiki-art-language");
        } else {
            ARTlanguage = "en";
        }
        if (extensionAPI.settings.get("wiki-feat-language")) {
            FClanguage = extensionAPI.settings.get("wiki-feat-language");
        } else {
            FClanguage = "en";
        }
        if (extensionAPI.settings.get("wiki-otd-language")) {
            OTDlanguage = extensionAPI.settings.get("wiki-otd-language");
        } else {
            OTDlanguage = "en";
        }

        // onChange
        function setArt(evt) {
            ARTlanguage = evt.target.value;
        }
        function setFeat(evt) {
            FClanguage = evt;
        }
        function setOTD(evt) {
            OTDlanguage = evt;
        }

        extensionAPI.ui.commandPalette.addCommand({
            label: "Wikipedia Page Import",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing from Wikipedia");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWiki(uid).then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                    if (blocks[0]?.children[0].text.endsWith("may refer to:")) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i + 1 },
                            block: { string: "No page found".toString(), uid: thisBlock }
                        });
                    } else {
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }

                        const pageId = await window.roamAlphaAPI.pull("[*]", [":block/uid", uid])?.[":block/page"]?.[":db/id"];
                        const pageUID = await window.roamAlphaAPI.pull("[:block/uid]", pageId)?.[":block/uid"]
                        let order = await window.roamAlphaAPI.q(`[:find ?o :where [?r :block/order ?o] [?r :block/uid "${uid}"]]`)?.[0]?.[0]; // thanks to David Vargas https://github.com/dvargas92495/roam-client/blob/main/src/queries.ts#L58
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": pageUID, order: order + 1 },
                            block: { string: blocks[1].text.toString(), uid: thisBlock }
                        });
                    }
                });
            },
        });
        extensionAPI.ui.commandPalette.addCommand({
            label: "Wikipedia On This Day",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing from Wikipedia");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchOTD().then(async (blocks) => {
                    if (blocks == "error") {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: "Error loading data from Wikipedia", open: true } });
                    } else {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                })
            }
        });
        extensionAPI.ui.commandPalette.addCommand({
            label: "Wikipedia Featured Content",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing from Wikipedia");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWFC().then(async (blocks) => {
                    if (blocks == "error") {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: "Error loading data from Wikipedia", open: true } });
                    } else {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                })
            }
        });
        extensionAPI.ui.commandPalette.addCommand({
            label: "Wikipedia Featured Image",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing from Wikipedia");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWFCI().then(async (blocks) => {
                    if (blocks == "error") {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: "Error loading data from Wikipedia", open: true } });
                    } else {
                        await window.roamAlphaAPI.updateBlock(
                            { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                        for (var i = 0; i < blocks[0].children.length; i++) {
                            var thisBlock = window.roamAlphaAPI.util.generateUID();
                            await window.roamAlphaAPI.createBlock({
                                location: { "parent-uid": uid, order: i + 1 },
                                block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                            });
                        }
                    }
                })
            }
        });

        const args = {
            text: "WIKIPEDIA",
            help: "Import data from Wikipedia",
            handler: (context) => fetchWiki,
        };
        const args1 = {
            text: "ONTHISDAY",
            help: "Import notable historical events, international holidays, and births and deaths of notable people from Wikipedia",
            handler: (context) => fetchOTD,
        };
        const args2 = {
            text: "WIKIFEATURED",
            help: "Import today's featured content from Wikipedia",
            handler: (context) => fetchWFC,
        };
        const args3 = {
            text: "WIKIIMAGE",
            help: "Import today's featured image from Wikipedia",
            handler: (context) => fetchWFCI,
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
            window.roamjs.extension.smartblocks.registerCommand(args1);
            window.roamjs.extension.smartblocks.registerCommand(args2);
            window.roamjs.extension.smartblocks.registerCommand(args3);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1) &&
                    window.roamjs.extension.smartblocks.registerCommand(args2) &&
                    window.roamjs.extension.smartblocks.registerCommand(args3)
            );
        }

        async function fetchWiki(uid) {
            var key, sentences;
            breakme: {
                if (!extensionAPI.settings.get("wiki-sentences")) {
                    sentences = "6";
                } else {
                    const regex = /^[0-9]{1,2}$/;
                    if (extensionAPI.settings.get("wiki-sentences").match(regex)) {
                        sentences = extensionAPI.settings.get("wiki-sentences");
                    } else {
                        key = "sentences";
                        sendConfigAlert(key);
                        break breakme;
                    }
                }

                const pageId = window.roamAlphaAPI.pull("[*]", [":block/uid", uid])?.[":block/page"]?.[":db/id"];
                const pageTitle = pageId
                    ? window.roamAlphaAPI.pull("[:node/title]", pageId)?.[":node/title"]
                    : window.roamAlphaAPI.pull("[:node/title]", [
                        ":block/uid",
                        await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid()
                    ])?.[":node/title"];
                var url = `https://${ARTlanguage}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${pageTitle}&origin=*`;

                return fetch(url).then(r => r.json()).then((wiki) => {
                    const options = wiki.query.search
                        .map(m => ({ label: m.title, id: m.pageid }));
                    return prompt({
                        title: "Wikipedia",
                        question: "Which entry do you mean?",
                        options,
                    })
                }).then((pageID) => {
                    var url = `https://${ARTlanguage}.wikipedia.org/w/api.php?format=json&action=query&exintro&explaintext&exsentences=${sentences}&exlimit=max&origin=*&prop=info|extracts&inprop=url&pageids=${pageID}`;
                    var url1 = `https://${ARTlanguage}.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${pageTitle}&format=json&formatversion=2&origin=*`;
                    return !pageID ? [{ text: "No items selected!" }] : (async () => {
                        const getExtract = new Promise((resolve) => {
                            fetch(url).then(r => r.json()).then((wiki) => {
                                var string = "" + wiki.query.pages[pageID].extract + "";
                                const regex = /([a-z'"\)])\.([A-Z])/gm;
                                const subst = `$1.\n\n$2`;
                                const result = string.replace(regex, subst);
                                var cURL = "" + wiki.query.pages[pageID].canonicalurl + "";
                                var extractResults = { result, cURL };
                                resolve(extractResults);
                            })
                        });

                        const getImage = new Promise((resolve) => {
                            fetch(url1).then(r => r.json()).then((wikiImages) => {
                                if (wikiImages.query.pages[0].hasOwnProperty('original')) {
                                    var string = "![](" + wikiImages.query.pages[0].original.source + ")";
                                    resolve(string);
                                } else {
                                    resolve("No Image Available");
                                }
                            })
                        });

                        const results = await Promise.allSettled([getExtract, getImage]);
                        return [
                            {
                                text: "**Wikipedia Summary:** #rm-hide #rm-horizontal",
                                children: [
                                    { text: "" + results[0].value.result + "" },
                                    { text: "" + results[1].value + "" },
                                ]
                            },
                            {
                                text: "" + results[0].value.cURL + ""
                            },
                        ];
                    })();
                })
            }
        }

        async function fetchOTD() {
            breakme: {
                if (!extensionAPI.settings.get("wiki-apikey")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {

                    APIkey = extensionAPI.settings.get("wiki-apikey");

                    let today = new Date();
                    let month = today.getMonth() + 1;
                    let day = today.getDate();
                    let url = `https://api.wikimedia.org/feed/v1/wikipedia/${OTDlanguage}/onthisday/all/${month}/${day}`;

                    let response = await fetch(url, {
                        headers: {
                            'Authorization': "Bearer " + APIkey
                        }
                    });

                    let data = await response.json();
                    if (response.ok) {
                        function shuffle(array) {
                            var i = array.length,
                                j = 0,
                                temp;
                            while (i--) {
                                j = Math.floor(Math.random() * (i + 1));
                                temp = array[i];
                                array[i] = array[j];
                                array[j] = temp;
                            }
                            return array;
                        }
                        var ranNums = shuffle(data.selected);
                        console.info(ranNums);

                        const regex = /(\s\((.+)?\s?pictured\)|\s\((.+)?\s?shown\)|\s\((.+)?\s?depicted\)|\s\((.+)?\s?audio featured\))/gm;
                        const subst = ``;
                        let string = "in ";
                        string += ranNums[0].year;
                        string += ":\n\n";
                        var result = ranNums[0].text.replace(regex, subst);
                        string += result;
                        string += "";
                        let string1 = "in ";
                        string1 += ranNums[1].year;
                        string1 += ":\n\n";
                        var result1 = ranNums[1].text.replace(regex, subst);
                        string1 += result1;
                        string1 += "";
                        let string2 = "in ";
                        string2 += ranNums[2].year;
                        string2 += ":\n\n";
                        var result2 = ranNums[2].text.replace(regex, subst);
                        string2 += result2;
                        string2 += "";
                        return [
                            {
                                text: "**On this Day...** #rm-hide #rm-horizontal",
                                children: [
                                    { text: string },
                                    { text: string1 },
                                    { text: string2 },
                                ]
                            }
                        ];
                    } else {
                        console.error(data);
                        return "error";
                    }
                }
            }

        };

        async function fetchWFC() {
            breakme: {
                if (!extensionAPI.settings.get("wiki-apikey")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {
                    APIkey = extensionAPI.settings.get("wiki-apikey");
                    let today = new Date();
                    let year = today.getFullYear();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0');
                    let url = `https://api.wikimedia.org/feed/v1/wikipedia/${FClanguage}/featured/${year}/${mm}/${dd}`;

                    let response = await fetch(url);
                    let data = await response.json();
                    console.info(data);
                    if (response.ok) {
                        if (!data.hasOwnProperty("tfa")) {
                            return [
                                {
                                    text: "There is no featured article available today!",
                                },
                            ];
                        } else if (data.tfa.hasOwnProperty("originalimage")) {
                            return [
                                {
                                    text: "**Featured Article: [[" + data.tfa.titles.normalized + "]]** #rm-hide #rm-horizontal",
                                    children: [
                                        { text: "" + data.tfa.extract + "" },
                                        { text: "![" + data.tfa.titles.normalized + "](" + data.tfa.originalimage.source + ")" },
                                    ]
                                },
                                {
                                    text: "" + data.tfa.content_urls.desktop.page + ""
                                },
                            ];
                        } else {

                            return [
                                {
                                    text: "**Featured Article: [[" + data.tfa.titles.normalized + "]]** #rm-hide #rm-horizontal",
                                    children: [
                                        { text: "" + data.tfa.extract + "" },
                                        { text: "No featured image" },
                                    ]
                                },
                                {
                                    text: "" + data.tfa.content_urls.desktop.page + ""
                                },
                            ];
                        }
                    } else {
                        console.error(data);
                        return "error";
                    }
                }
            }
        };

        async function fetchWFCI() {
            breakme: {
                if (!extensionAPI.settings.get("wiki-apikey")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {
                    APIkey = extensionAPI.settings.get("wiki-apikey");
                    let today = new Date();
                    let year = today.getFullYear();
                    var dd = String(today.getDate()).padStart(2, '0');
                    var mm = String(today.getMonth() + 1).padStart(2, '0');
                    let url = `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${year}/${mm}/${dd}`;

                    let response = await fetch(url);
                    let data = await response.json();
                    if (response.ok) {
                        return [
                            {
                                text: "**Featured Image:** " + data.image.description.text + "",
                                children: [
                                    { text: "![" + data.image.description.text + "](" + data.image.thumbnail.source + ")" },
                                    { text: "[HD Image](" + data.image.image.source + ")" },
                                ]
                            },
                        ];
                    } else {
                        console.error(data);
                        return "error";
                    }
                }
            }
        };
    },
    onunload: () => {
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("WIKIPEDIA");
            window.roamjs.extension.smartblocks.unregisterCommand("ONTHISDAY");
            window.roamjs.extension.smartblocks.unregisterCommand("WIKIFEATURED");
            window.roamjs.extension.smartblocks.unregisterCommand("WIKIIMAGE");
        };
    }
}

// helper functions

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set the API key from https://api.wikimedia.org/wiki/Special:AppManagement in Roam Depot settings. Click on Create key button and then select a Personal API token option.");
    } else if (key == "sentences") {
        alert("Please enter an integer for extract length in the configuration settings via the Roam Depot tab.");
    }
}

// copied and adapted from https://github.com/dvargas92495/roamjs-components/blob/main/src/writes/createBlock.ts
const createBlock = (params) => {
    const uid = window.roamAlphaAPI.util.generateUID();
    return Promise.all([
        window.roamAlphaAPI.createBlock({
            location: {
                "parent-uid": params.parentUid,
                order: params.order,
            },
            block: {
                uid,
                string: params.node.text
            }
        })
    ].concat((params.node.children || []).map((node, order) =>
        createBlock({ parentUid: uid, order, node })
    )))
};

// copied and adapted from https://github.com/dvargas92495/roamjs-components/blob/main/src/components/FormDialog.tsx
const FormDialog = ({
    onSubmit,
    title,
    options,
    question,
    onClose,
}) => {
    const [data, setData] = window.React.useState(options[0].id);
    const onClick = window.React.useCallback(
        () => {
            onSubmit(data);
            onClose();
        },
        [data, onClose]
    );
    const onCancel = window.React.useCallback(
        () => {
            onSubmit("");
            onClose();
        },
        [onClose]
    )
    return window.React.createElement(
        window.Blueprint.Core.Dialog,
        { isOpen: true, onClose: onCancel, title, },
        window.React.createElement(
            "div",
            { className: window.Blueprint.Core.Classes.DIALOG_BODY },
            question,
            window.React.createElement(
                window.Blueprint.Core.Label,
                {},
                "Wikipedia Entries:",
                window.React.createElement(
                    window.Blueprint.Select.Select,
                    {
                        activeItem: data,
                        onItemSelect: (id) => setData(id),
                        items: options.map(opt => opt.id),
                        itemRenderer: (item, { modifiers, handleClick }) => window.React.createElement(
                            window.Blueprint.Core.MenuItem,
                            {
                                key: item,
                                text: options.find(opt => opt.id === item).label,
                                active: modifiers.active,
                                onClick: handleClick,
                            }
                        ),
                        filterable: false,
                        popoverProps: {
                            minimal: true,
                            captureDismiss: true,
                        }
                    },
                    window.React.createElement(
                        window.Blueprint.Core.Button,
                        {
                            text: options.find(opt => opt.id === data).label,
                            rightIcon: "double-caret-vertical"
                        }
                    )
                )
            )
        ),
        window.React.createElement(
            "div",
            { className: window.Blueprint.Core.Classes.DIALOG_FOOTER },
            window.React.createElement(
                "div",
                { className: window.Blueprint.Core.Classes.DIALOG_FOOTER_ACTIONS },
                window.React.createElement(
                    window.Blueprint.Core.Button,
                    { text: "Cancel", onClick: onCancel, }
                ),
                window.React.createElement(
                    window.Blueprint.Core.Button,
                    { text: "Submit", intent: "primary", onClick }
                )
            )
        )
    );
}

const prompt = ({
    options,
    question,
    title,
}) =>
    new Promise((resolve) => {
        const app = document.getElementById("app");
        const parent = document.createElement("div");
        parent.id = 'wiki-prompt-root';
        app.parentElement.appendChild(parent);

        window.ReactDOM.render(
            window.React.createElement(
                FormDialog,
                {
                    onSubmit: resolve,
                    title,
                    options,
                    question,
                    onClose: () => {
                        window.ReactDOM.unmountComponentAtNode(parent);
                        parent.remove();
                    }
                }
            ),
            parent
        )
    });