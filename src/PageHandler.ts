import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.user";
import { LinkwardenCollectionBlock } from "./LinkwardenCollectionBlock";

const LINKWARDEN_COLLECTION_TAG = "#linkwarden-collection"

export class PageHandler {

    private page: PageEntity;

    /**
     * Create a new page handler that updates a page with new data.
     * @param page The page that should be updated.
     */
    constructor(page: PageEntity) {
        this.page = page;
    }

    /**
     * Update the page with new data from the Linkwarden API.
     */
    public async updatePage() {
        const blocks = await this.getCollectionBlocks();

        for (const block of blocks) {
            this.updateBlockEntity(block);
        }
    }

    /**
     * Get all blocks that should contain collections.
     * @returns List of blocks that are supposed to contain collections.
     */
    private async getCollectionBlocks() {
        const blocks = await logseq.Editor.getPageBlocksTree(this.page.uuid)
        const collectionBlocks: BlockEntity[] = []
        for (const block of blocks) {
            if (block.content.includes(LINKWARDEN_COLLECTION_TAG)) {
                collectionBlocks.push(block)
            }
        }

        return collectionBlocks
    }

    /**
     * Update a block entity with new data from the Linkwarden API.
     * @param block Block that should be updated.
     */
    private updateBlockEntity(block: BlockEntity) {
        const collectionBlock: LinkwardenCollectionBlock = new LinkwardenCollectionBlock(block)
        collectionBlock.updateBlock().catch(msg => {
            if (typeof msg === 'string') {
                logseq.UI.showMsg(msg, "error", {timeout: 4000})
            }
        })
    }

}
