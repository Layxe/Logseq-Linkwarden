import '@logseq/libs';
import { PageEntity } from "@logseq/libs/dist/LSPlugin.user";
import { PluginSettings } from './src/PluginSettings';
import { LinkwardenApiHandler } from './src/LinkwardenApiHandler';
import { PageHandler } from './src/PageHandler';
import { LinkwardenLinkBlockFactory } from './src/LinkwardenLinkBlockFactory';

// Functions
// #################################################################################################

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function triggerLinkwardenUpdateAction() {
    await delay(500)

    const currentPage = await logseq.Editor.getCurrentPage()

    if (currentPage === null) {
        logseq.UI.showMsg("Error no current page.")
        return
    }

    const pageHandler = new PageHandler(currentPage as PageEntity)
    pageHandler.updatePage()

    await delay(500)

    await logseq.Editor.exitEditingMode(false)
}

function main () {
    // Register the linkwarden api handler, so once the api key or base url changes,
    // the handler is updated.
    PluginSettings.registerConfigurableComponent(LinkwardenApiHandler.getInstance())
    // Register the link block factory, so once the custom properties change, the factory
    // is updated and provides the new custom properties.
    PluginSettings.registerConfigurableComponent(LinkwardenLinkBlockFactory.getInstance())

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