import '@logseq/libs';
import { updateCurrentPage } from './lib/page-updater';
import { global, settingsConfig } from './lib/settings';
import { updateApiSettings } from './lib/linkwarden-api';

const LINKWARDEN_COLLECTION_TAG = "#linkwarden-collection"

// Functions
// #################################################################################################

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function triggerLinkwardenUpdateAction() {
    await delay(500)

    console.log('Update!')

    const currentPage = await logseq.Editor.getCurrentPage()

    if (currentPage === null) {
        logseq.UI.showMsg("Error no current page.")
        return
    }

    updateCurrentPage()

    await delay(500)

    await logseq.Editor.exitEditingMode(false)
}

function loadSettings() {
    logseq.useSettingsSchema(settingsConfig)

    updateApiSettings(logseq.settings)

    logseq.onSettingsChanged(() => {
        updateApiSettings(logseq.settings)
    })
}

function main () {
    loadSettings()

    logseq.App.registerUIItem("toolbar", {
        key: "LinkwardenUpdate",
        template: `
        <a class="button" data-on-click="triggerLinkwardenUpdateAction">
            <i class="ti ti-link"></i>
        </a>`,
    })
}

function createModel() {
    return {
        triggerLinkwardenUpdateAction () {
            triggerLinkwardenUpdateAction()
        }
    }
}

logseq.ready(createModel()).then(main).catch(console.error)