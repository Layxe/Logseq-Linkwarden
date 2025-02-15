import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { ConfigurableComponent } from "./ConfigurableComponent";
import { PluginSettingsEntity } from "./PluginSettings";

/**
 * Properties that are ignored, when fetching data from the old existing block.
 * This means, these values are always updated, when a block is recreated.
 */
const IGNORED_PROPERTIES = [
    'linkwarden-id',
    'tags',
    'collection'
]

export class LinkwardenLinkBlockFactory extends ConfigurableComponent {
    private static _instance: LinkwardenLinkBlockFactory;
    private _linkCustomProperties: string

    private constructor() {
        super();
    }

    public static getInstance(): LinkwardenLinkBlockFactory {
        if (!LinkwardenLinkBlockFactory._instance) {
            LinkwardenLinkBlockFactory._instance = new LinkwardenLinkBlockFactory();
        }

        return LinkwardenLinkBlockFactory._instance;
    }

    public async getPagePrefix(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const currentPage = await logseq.Editor.getCurrentPage()

            if (currentPage === null) {
                logseq.UI.showMsg("Error no current page.")
                reject()
                return
            }

            const pagePrefix = currentPage.originalName + '/'

            resolve(pagePrefix)
        })
    }


    public getLinkCustomProperties(): string {
        return this._linkCustomProperties.replaceAll(";", "\n")
    }

    public sanitizeNameForPath(name: string) {
        name = name.replaceAll('/', '-')
        name = name.replaceAll('?','')
        name = name.replaceAll(':','')
        name = name.replaceAll('*','')
        name = name.replaceAll('"','')
        name = name.replaceAll('<','')
        name = name.replaceAll('>','')
        name = name.replaceAll('|','')
        return name
    }

    public extractPropertiesFromOldBlock(oldBlock: BlockEntity | undefined) {
        if (oldBlock === undefined || !oldBlock.properties) {
            return ""
        }

        let additionalProperties = ""

        for (const key in oldBlock.properties) {
            if (IGNORED_PROPERTIES.includes(key)) {
                continue
            }

            const value = oldBlock.properties[key]

            additionalProperties += `${key}:: ${value}\n`
        }

        return additionalProperties
    }

    public getTagsAsPropertyString(tags) {
        if (tags.length != 0) {
            let tagString = 'tags::'

            for (const tag of tags) {
                tagString += ` [[${tag.name}]]`
            }

            return tagString + '\n'
        }

        return ""
    }

    public configure(settings: PluginSettingsEntity): void {
        this._linkCustomProperties = settings.linkwardenCustomProperties
    }
}