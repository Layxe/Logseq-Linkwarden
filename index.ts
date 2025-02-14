import '@logseq/libs';
import { getCollectionByName, getAllLinksInCollection, fetchAndStorePdfFromLink, PDFInformation } from './lib/collections';
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user';
import { updateCurrentPage } from './lib/page-updater';

const LINKWARDEN_COLLECTION_TAG = "#linkwarden-collection"

// Functions
// #################################################################################################

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function main () {
    logseq.Editor.registerSlashCommand(
        "Get Linkwarden Link for Collection",
        async () => {
            await delay(500)

            const currentPage = await logseq.Editor.getCurrentPage()

            if (currentPage === null) {
                logseq.UI.showMsg("Error no current page.")
                return
            }

            updateCurrentPage()

            // Search for blocks with the tag "#collection"
            const blocks = await logseq.Editor.getCurrentPageBlocksTree()
            const blocksToScrape: BlockEntity[] = []

            blocks.forEach(async (block) => {
                const content = block.content
                if (content.includes(LINKWARDEN_COLLECTION_TAG)) {
                    blocksToScrape.push(block)
                }
            })

            for (const block of blocksToScrape) {
            }
        }
    )
}

logseq.ready(main).catch(console.error)