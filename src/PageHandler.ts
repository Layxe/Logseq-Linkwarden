import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin.user";
import { LinkwardenCollectionBlock } from "./LinkwardenCollectionBlock";

const LINKWARDEN_COLLECTION_TAG = "#linkwarden-collection"

export class PageHandler {

    private page: PageEntity;

    constructor(page: PageEntity) {
        this.page = page;
    }

    public async updatePage() {
        const blocks = await this.getCollectionBlocks();

        for (const block of blocks) {
            this.updateBlockEntity(block);
        }
    }

    private async getCollectionBlocks() {
        const blocks = await logseq.Editor.getPageBlocksTree(this.page.uuid)
        let collectionBlocks: BlockEntity[] = []
        for (const block of blocks) {
            if (block.content.includes(LINKWARDEN_COLLECTION_TAG)) {
                collectionBlocks.push(block)
            }
        }

        return collectionBlocks
    }

    private updateBlockEntity(block: BlockEntity) {
        const collectionBlock: LinkwardenCollectionBlock = new LinkwardenCollectionBlock(block)
        collectionBlock.updateBlock()
    }

}