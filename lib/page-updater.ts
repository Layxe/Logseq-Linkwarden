import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user"
import { fetchAndStorePdfFromLink, getAllLinksInCollection, getCollectionByName, PDFInformation } from "./collections"
import { global } from "./settings"

interface LinkUpdateStructure {
    link: any,                                      // Link object from the Linkwarden API.
    block: BlockEntity,                             // Parent block, where all the children are stored.
    oldChildrenBlocksMap: Map<number, BlockEntity>, // Map of old children blocks.
    pagePrefix: string,                             // Prefix for the current page
    collectionName: string                          // Name of the collection
}

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

function getTagString(tags) {
    let tagsStr = ""

    for (const tag of tags) {
        tagsStr += ` [[${tag.name}]]`
    }

    return tagsStr
}

/**
 * This function takes new informations from linkwarden, compares them with the old state and keeps
 * Logseq changes, like the status or year.
 * @param pdfInformation New PDF information from linkwarden.
 * @param oldChildrenBlocks Old children blocks from the collection block.
 * @param pagePrefix Prefix for the page name.
 * @returns New content for the block.
 */
async function updateOldBlockContent(pdfInformation: PDFInformation, oldChildrenBlocksMap: Map<number, BlockEntity>, pagePrefix: string) {
    const oldBlock = oldChildrenBlocksMap.get(pdfInformation.linkwardenId)

    if (!oldBlock) {
        return null
    }

    const oldBlockContent      = oldBlock.content
    const oldBlockContentSplit = oldBlockContent.split("\n")

    let tagsHaveBeenUpdated = false

    oldBlockContentSplit[0] = `[[${pagePrefix}${pdfInformation.nameWithoutExtension}]]`

    // Properties from linkwarden are: tags, collection and the name, so update these
    for (let i = 1; i < oldBlockContentSplit.length; i++) {
        const line = oldBlockContentSplit[i]

        if (line.indexOf("collection::") !== -1) {
            oldBlockContentSplit[i] = `collection:: ${pdfInformation.collection}`
        }

        if (line.indexOf("tags::") !== -1) {
            let tagsStr = getTagString(pdfInformation.tags)

            oldBlockContentSplit[i] = `tags::${tagsStr}`
            tagsHaveBeenUpdated = true
        }

        if (line.indexOf("linkwarden-id::") !== -1) {
            oldBlockContentSplit[i] = `linkwarden-id:: ${pdfInformation.linkwardenId}`
        }
    }

    let newContent = oldBlockContentSplit.join("\n")

    // Add the tags, if previously no tags were present.
    if (!tagsHaveBeenUpdated && pdfInformation.tags.length > 0) {
        newContent += `\ntags::${getTagString(pdfInformation.tags)}`
    }

    return newContent
}

function getLinkwardenIdToBlockMap(blockList) {
    const blockMap = new Map<number, BlockEntity>()

    // Create a map, assigning the linkwarden id to the block.
    for (const block of blockList) {
        let id: number = -1;

        for (const line of block.content.split("\n")) {
            if (line.indexOf("linkwarden-id::") !== -1) {
                id = parseInt(line.split("::")[1].trim())
                break
            }
        }

        if (id >= 0) {
            blockMap.set(id, block)
        }
    }

    return blockMap
}

async function insertLinkNode(linkUpdateStructure: LinkUpdateStructure) {
    const {link, block, oldChildrenBlocksMap, pagePrefix, collectionName} = linkUpdateStructure
    const pdfInformation = await fetchAndStorePdfFromLink(link)

    if (!pdfInformation) {
        return
    }

    const newContent = await updateOldBlockContent(pdfInformation, oldChildrenBlocksMap, pagePrefix)

    // If the content is based on a previous entry, update it.
    if (newContent !== null) {
        logseq.Editor.insertBlock(block.uuid, newContent)
    } else {
        // Create a new block entry
        let blockContent = `[[${pagePrefix}${pdfInformation.nameWithoutExtension}]]\ncollection:: ${collectionName}\n`
        const tagsStr = getTagString(pdfInformation.tags)

        if (tagsStr.length > 0) {
            blockContent += `tags:: ${tagsStr}\n`
        }

        blockContent += `linkwarden-id:: ${link.id}`

        if (global.settings.linkwardenCustomProperties.length > 0) {
            blockContent += `\n`
            let separatedProperties = global.settings.linkwardenCustomProperties.replaceAll(";", "\n")
            blockContent += `${separatedProperties}`
        }

        logseq.Editor.insertBlock(block.uuid, blockContent)
    }

    // Update the matching page to the link
    const linkPage = await logseq.Editor.getPage(pagePrefix + pdfInformation.nameWithoutExtension)

    if (linkPage === null) {
        logseq.UI.showMsg(`Link page ${pdfInformation.nameWithoutExtension} not found.`, "warning")
        return
    }

    const linkPageChildren = await logseq.Editor.getPageBlocksTree(linkPage.uuid)

    if (linkPageChildren && linkPageChildren.length > 0) {
        logseq.Editor.updateBlock(linkPageChildren[0].uuid, "### " + pdfInformation.markdownLink)
    } else {
        logseq.Editor.insertBlock(linkPage.uuid, "### " + pdfInformation.markdownLink)
    }
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

    const oldChildrenBlocksMap = getLinkwardenIdToBlockMap(oldChildrenBlocks)

    for (const link of links) {
        insertLinkNode({link, block, oldChildrenBlocksMap, pagePrefix, collectionName})
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