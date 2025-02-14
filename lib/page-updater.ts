import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user"
import { fetchAndStorePdfFromLink, getAllLinksInCollection, getCollectionByName, PDFInformation } from "./collections"

const LINKWARDEN_COLLECTION_TAG = "#linkwarden-collection"

/**
 * Search for linkwarden collection blocks and insert the children and PDFs.
 */
export async function updateCurrentPage() {
    const collectionBlocks = await getCollectionBlocks()

    for (const block of collectionBlocks) {
        await updateCollectionBlock(block)
    }

}

/**
 * Get the collection name from the block content.
 * @param content Block content. F.e. "### MyCollection #linkwarden-collection"
 * @returns Collection name. F.e. "MyCollection"
 */
function getCollectionNameFromBlockContent(content: string) {
    let collectionName = content.replace(LINKWARDEN_COLLECTION_TAG, "").trim()
    collectionName = collectionName.replaceAll("#", "").trim()
    return collectionName
}

/**
 * Get the children of a collection block. This is useful for saving the children properties
 * before deleting them.
 * @param block Collection block
 * @returns Array of children blocks
 */
function storeCollectionBlockChildren(block: BlockEntity) {
    if (!block.children) {
        return []
    }

    const childrenArray: BlockEntity[] = []
    const children = block.children

    for (const child of children) {
        if (child instanceof String) {
        } else {
            const childBlock = child as BlockEntity
            childrenArray.push(childBlock)
        }
    }

    return childrenArray
}

/**
 * Delete all children of a block.
 * @param block Collection block.
 * @returns Nothing.
 */
function deleteBlockChildren(block: BlockEntity) {
    if (!block.children) {
        return
    }

    for (const child of block.children) {
        if (child instanceof String) {
            logseq.Editor.removeBlock(child.toString())
        } else {
            const childBlock = child as BlockEntity
            logseq.Editor.removeBlock(childBlock.uuid)
        }
    }
}

/**
 * This function takes new informations from linkwarden, compares them with the old state and keeps
 * Logseq changes, like the status or year.
 * @param pdfInformation New PDF information from linkwarden.
 * @param oldChildrenBlocks Old children blocks from the collection block.
 * @param pagePrefix Prefix for the page name.
 * @returns New content for the block.
 */
async function updateOldBlockContent(pdfInformation: PDFInformation, oldChildrenBlocks: BlockEntity[], pagePrefix: string) {
    for (const oldBlock of oldChildrenBlocks) {
        const oldBlockContent      = oldBlock.content
        const oldBlockContentSplit = oldBlockContent.split("\n")

        if (oldBlockContent.indexOf("linkwarden-id:: " + pdfInformation.linkwardenId) !== -1) {
            oldBlockContentSplit[0] = `[[${pagePrefix}${pdfInformation.nameWithoutExtension}]]`

            // Properties from linkwarden are: tags, collection and the name, so update these
            for (let i = 1; i < oldBlockContentSplit.length; i++) {
                const line = oldBlockContentSplit[i]

                if (line.indexOf("collection::") !== -1) {
                    oldBlockContentSplit[i] = `collection:: ${pdfInformation.collection}`
                }

                if (line.indexOf("tags::") !== -1) {
                    let tagsStr = ""

                    for (const tag of pdfInformation.tags) {
                        tagsStr += ` [[${tag.name}]]`
                    }

                    oldBlockContentSplit[i] = `tags::${tagsStr}`
                }

                if (line.indexOf("linkwarden-id::") !== -1) {
                    oldBlockContentSplit[i] = `linkwarden-id:: ${pdfInformation.linkwardenId}`
                }
            }

            const newContent = oldBlockContentSplit.join("\n")

            return newContent
        }
    }

    return null
}

async function updateCollectionBlock(block) {
    const content        = block.content
    const collectionName = getCollectionNameFromBlockContent(content)
    const currentPage    = await logseq.Editor.getCurrentPage()

    if (currentPage === null) {
        logseq.UI.showMsg("Error no current page.")
        return null
    }

    const pagePrefix = currentPage.originalName + "/"

    if (collectionName.length === 0) {
        return
    }

    const collection = await getCollectionByName(collectionName)

    if (!collection) {
        return
    }

    const links = await getAllLinksInCollection(collection)
    const oldChildrenBlocks = storeCollectionBlockChildren(block)

    deleteBlockChildren(block)

    for (const link of links) {
        const pdfInformation = await fetchAndStorePdfFromLink(link)

        if (!pdfInformation) {
            continue
        }

        const newContent = await updateOldBlockContent(pdfInformation, oldChildrenBlocks, pagePrefix)

        // If the content is based on a previous entry, update it.
        if (newContent !== null) {
            logseq.Editor.insertBlock(block.uuid, newContent)
        } else {
            // Create a new block entry
            let tagsStr = ""

            for (const tag of pdfInformation.tags) {
                tagsStr += ` [[${tag.name}]]`
            }

            logseq.Editor.insertBlock(block.uuid,
                `[[${pagePrefix}${pdfInformation.nameWithoutExtension}]]\ncollection:: ${collectionName}\ntags::${tagsStr}\nlinkwarden-id:: ${link.id}\nstatus:: 🟦 Pending`)
        }

        // Update the matching page to the link
        const linkPage = await logseq.Editor.getPage(pagePrefix + pdfInformation.nameWithoutExtension)

        if (linkPage === null) {
            logseq.UI.showMsg(`Link page ${pdfInformation.nameWithoutExtension} not found.`, "warning")
            continue
        }

        const linkPageChildren = await logseq.Editor.getPageBlocksTree(linkPage.uuid)

        if (linkPageChildren && linkPageChildren.length > 0) {
            logseq.Editor.updateBlock(linkPageChildren[0].uuid, "### " + pdfInformation.markdownLink)
        } else {
            logseq.Editor.insertBlock(linkPage.uuid, "### " + pdfInformation.markdownLink)
        }
    }
}

async function getCollectionBlocks() {

    // Search for blocks with the tag "#collection"
    const blocks = await logseq.Editor.getCurrentPageBlocksTree()
    const blocksToScrape: BlockEntity[] = []

    blocks.forEach(async (block) => {
        const content = block.content
        if (content.includes(LINKWARDEN_COLLECTION_TAG)) {
            blocksToScrape.push(block)
        }
    })

    return blocksToScrape
}