import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";
import { ConfigurableComponent } from "./ConfigurableComponent";
import { PluginSettingsEntity } from "./PluginSettings";

/**
 * Properties that are ignored, when fetching data from the old existing block.
 * This means, these values are always updated, when a block is recreated.
 */
const IGNORED_PROPERTIES = [
    'linkwardenid',
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

    /**
     * Get the prefix of the current page.
     * @returns The prefix of the current page.
     */
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

    /**
     * Get the custom properties for the link block from the logseq settings.
     * @returns The custom properties for the link block.
     */
    public getLinkCustomProperties(): string {
        return this._linkCustomProperties.replaceAll(";", "\n")
    }

    /**
     * Sanitize a name for the path.
     * @param name Name that should be sanitized.
     * @returns Sanitized name for the path.
     */
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

    /**
     * Extract the properties from an old block and return them as a string.
     * @param oldBlock Old link block from which the properties should be extracted.
     * @returns The properties as a string, excluding the ignored properties, like linkwarden-id.
     */
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

    /**
     * Convert a list of tags to a property string.
     * @param tags List of tags that should be converted to a property string.
     * @returns The tags as a property string with newline or empty string if no tags are present.
     */
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