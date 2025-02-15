import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { LinkwardenApiHandler } from "./LinkwardenApiHandler";
import { LinkwardenLink } from "./LinkwardenApiHandler";
import { LinkwardenLinkBlock } from "./LinkwardenLinkBlock";

export class LinkwardenCollectionBlock {

    private blockEntity: BlockEntity;
    private collectionName: string;

    constructor(blockEntity: BlockEntity) {
        this.blockEntity    = blockEntity;
        this.collectionName = this.getCollectionNameFromBlock(blockEntity);
    }

    private getCollectionNameFromBlock(blockEntity: BlockEntity) {
        let content = blockEntity.content;
        content = content.replace("#linkwarden-collection", "");
        content = content.replaceAll("#", "");
        content = content.trim();
        return content;
    }

    private insertLinksInBlock(links: LinkwardenLink[]) {
        const children = this.blockEntity.children;
        if (!children) {
            return;
        }

        const oldChildrenData = this.clearBlock();
        const oldChildrenMap  = new Map<number, BlockEntity>();

        for (const child of oldChildrenData) {
            if (child.properties) {
                oldChildrenMap.set(child.properties['linkwarden-id'], child);
            }
        }

        for (const link of links) {
            const linkBlock = new LinkwardenLinkBlock(link);
            const oldChild = oldChildrenMap.get(link.id);
            linkBlock.appendToBlock(this.blockEntity, oldChild);
        }
    }

    private clearBlock() {
        const block = this.blockEntity;

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

        for (const child of block.children) {
            if (child instanceof String) {
                logseq.Editor.removeBlock(child.toString())
            } else {
                const childBlock = child as BlockEntity
                logseq.Editor.removeBlock(childBlock.uuid)
            }
        }

        return childrenArray
    }

    public updateBlock() {
        return new Promise(async (resolve, reject) => {

            const apiHandler = LinkwardenApiHandler.getInstance();
            try {
                const collection = await apiHandler.getCollectionByName(this.collectionName);

                if (typeof collection === "string") {
                    reject(collection);
                    return;
                }

                const links = await apiHandler.getLinksInCollection(collection)

                if (typeof links === "string") {
                    reject(links);
                    return;
                }

                this.insertLinksInBlock(links);

                resolve(null)
            } catch (error) {
                reject(error);
            }
        })
    }
}