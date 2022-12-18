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

const config = {
    tabTitle: "Wikipedia import",
    settings: [
        {
            id: "wiki-sentences",
            name: "Extract sentences",
            description: "Number of sentences to import",
            action: { type: "input", placeholder: "6" },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
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
                    
                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i+1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
                    }
                    const pageId = await window.roamAlphaAPI.pull("[*]", [":block/uid", uid])?.[":block/page"]?.[":db/id"];
                    const pageUID = await window.roamAlphaAPI.pull("[:block/uid]", pageId)?.[":block/uid"]
                    let order = await window.roamAlphaAPI.q(`[:find ?o :where [?r :block/order ?o] [?r :block/uid "${uid}"]]`)?.[0]?.[0]; // thanks to David Vargas https://github.com/dvargas92495/roam-client/blob/main/src/queries.ts#L58                var thisBlock = window.roamAlphaAPI.util.generateUID();
                    await window.roamAlphaAPI.createBlock({
                        location: { "parent-uid": pageUID, order: order+1 },
                        block: { string: blocks[1].text.toString(), uid: thisBlock }
                    });
                });
            },
        });
        window.roamAlphaAPI.ui.commandPalette.addCommand({
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
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i+1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
                    }
                })
            }
        });
        window.roamAlphaAPI.ui.commandPalette.addCommand({
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
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i+1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
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

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
            window.roamjs.extension.smartblocks.registerCommand(args1);
            window.roamjs.extension.smartblocks.registerCommand(args2);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1) &&
                    window.roamjs.extension.smartblocks.registerCommand(args2)
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
                var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=" + pageTitle + "&origin=*";

                return fetch(url).then(r => r.json()).then((wiki) => {
                    const options = wiki.query.search
                        .map(m => ({ label: m.title, id: m.pageid }));
                    return prompt({
                        title: "Wikipedia",
                        question: "Which entry do you mean?",
                        options,
                    })
                }).then((pageID) => {
                    var url = "https://en.wikipedia.org/w/api.php?format=json&action=query&exintro&explaintext&exsentences=" + sentences + "&exlimit=max&origin=*&prop=info|extracts&inprop=url&pageids=" + pageID + "";
                    var url1 = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + pageTitle + "&format=json&formatversion=2&origin=*";
                    return !pageID ? [{ text: "No items selected!" }] : (async () => {
                        const getExtract = new Promise((resolve) => {
                            fetch(url).then(r => r.json()).then((wiki) => {
                                console.info(wiki.query.pages[pageID].extract);
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
                        return await [
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
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Wikipedia Page Import'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Wikipedia On This Day'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Wikipedia Featured Content'
        });
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("WIKIPEDIA");
            window.roamjs.extension.smartblocks.unregisterCommand("ONTHISDAY");
            window.roamjs.extension.smartblocks.unregisterCommand("WIKIFEATURED");
        };
    }
}

function sendConfigAlert(key) {
    if (key == "sentences") {
        alert("Please enter an integer for extract length in the configuration settings via the Roam Depot tab.");
    }
}

async function fetchOTD() {
    let today = new Date();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

    let response = await fetch(url);
    if (response.ok) {
        let data = await response.json();
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

        const regex = /(\(pictured\) )/gm;
        const subst = ``;
        let string = "in ";
        string += ranNums[0].year;
        string += ":\n\n";
        const result = ranNums[0].text.replace(regex, subst);
        string += result;
        string += "";
        let string1 = "in ";
        string1 += ranNums[1].year;
        string1 += ":\n\n";
        const result1 = ranNums[1].text.replace(regex, subst);
        string1 += result1;
        string1 += "";
        let string2 = "in ";
        string2 += ranNums[2].year;
        string2 += ":\n\n";
        const result2 = ranNums[2].text.replace(regex, subst);
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
    }
};

async function fetchWFC() {
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
        console.error(data);
    }
};