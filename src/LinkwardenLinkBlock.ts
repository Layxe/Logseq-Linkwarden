import '@logseq/libs';
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { LinkwardenApiHandler, LinkwardenLink } from "./LinkwardenApiHandler";
import { LinkwardenLinkBlockFactory } from "./LinkwardenLinkBlockFactory";

export class LinkwardenLinkBlock {
    private _linkObject: LinkwardenLink
    private _collectionName: string
    private _linkName: string
    private _linkNameWithExtension: string
    private _assetFilePath: string
    private _sandboxFilePath: string
    private static _storage = logseq.Assets.makeSandboxStorage()

    /**
     * Create a Logseq block under a parent block, that contains different properties
     * of a Linkwarden link.
     * @param linkObject The link object that should be stored in a block.
     */
    constructor(linkObject: LinkwardenLink) {
        const linkFactory =  LinkwardenLinkBlockFactory.getInstance()
        this._linkObject     = linkObject;
        this._collectionName = linkFactory.sanitizeNameForPath(linkObject.collection.name)

        let name = linkFactory.sanitizeNameForPath(linkObject.name)
        if (!name.endsWith('.pdf')) {
            name += '.pdf'
        }

        this._linkName              = name.substring(0, name.length - 4)
        this._linkNameWithExtension = name
        this._assetFilePath         = `../assets/storages/${logseq.baseInfo.id}/${this._collectionName}/${this._linkNameWithExtension}`
        this._sandboxFilePath       = `${this._collectionName}/${this._linkNameWithExtension}`

        this.downloadAndStorePdf()
    }

    /**
     * Get the PDF connected to the link and store it in the sandbox storage.
     * @returns The PDF file as blob or an error message.
     */
    private async downloadAndStorePdf() {
        const itemExists = LinkwardenLinkBlock._storage.hasItem(this._sandboxFilePath)

        if (!itemExists) {
            const pdfBlob = await LinkwardenApiHandler.getInstance().getPdfForLink(this._linkObject)

            if (typeof pdfBlob === 'string') {
                logseq.UI.showMsg(pdfBlob, "warning")
                return
            }

            const fileReader = new FileReader()
            fileReader.onload = async () => {
                LinkwardenLinkBlock._storage.setItem(this._sandboxFilePath, fileReader.result as string)
            }
            fileReader.readAsArrayBuffer(pdfBlob)
        }
    }

    /**
     * Update the asset link in the link page.
     * @returns Nothing.
     */
    private async updateAssetLinkInLinkPage(): Promise<void> {
        const pagePrefix = await LinkwardenLinkBlockFactory.getInstance().getPagePrefix()
        const linkPage = await logseq.Editor.getPage(pagePrefix + this._linkName)

        if (linkPage === null) {
            logseq.UI.showMsg(`Link page ${this._linkName} not found.`, "warning")
            return
        }

        const linkPageChildren = await logseq.Editor.getPageBlocksTree(linkPage.uuid)
        const markdownLink = `![${this._linkName}](${this._assetFilePath})`

        if (linkPageChildren && linkPageChildren.length > 0) {
            logseq.Editor.updateBlock(linkPageChildren[0].uuid, "### " + markdownLink)
        } else {
            logseq.Editor.insertBlock(linkPage.uuid, "### " + markdownLink)
        }
    }

    /**
     * Append and create a new link block under a parent block.
     * @param parent Parent block under which the new block should be created.
     * @param oldChildBlock Old block that previously represented the link (if it exists).
     */
    public async appendToBlock(parent: BlockEntity, oldChildBlock: BlockEntity | undefined) {
        const linkFactory = LinkwardenLinkBlockFactory.getInstance()
        const pagePrefix = await linkFactory.getPagePrefix()

        let additionalProperties = linkFactory.extractPropertiesFromOldBlock(oldChildBlock)

        let blockContent = `[[${pagePrefix}${this._linkName}]]\n`
        blockContent += `linkwarden-id:: ${this._linkObject.id}\n`
        blockContent += `collection:: ${this._collectionName}\n`
        blockContent += linkFactory.getTagsAsPropertyString(this._linkObject.tags)
        blockContent += additionalProperties

        if (additionalProperties.length === 0) {
            blockContent += linkFactory.getLinkCustomProperties()
        }

        logseq.Editor.insertBlock(parent.uuid, blockContent)

        this.updateAssetLinkInLinkPage()
    }

}