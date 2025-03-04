import { ConfigurableComponent } from "./ConfigurableComponent"
import { PluginSettingsEntity } from "./PluginSettings";

// Interfaces
// #################################################################################################

export interface LinkwardenCollection {
    id: number,
    name: string,
    description: string,
    icon: string | null,
    iconWeight: string | null,
    color: string,
    parentId: number | null,
    isPublic: boolean,
    ownerId: number,
    createdById: number,
    createdAt: string,
    updatedAt: string,
    _count: any,
    parent: any | null,
    members: any[]
}

export interface LinkwardenLink {
    id: number,
    name: string,
    type: string,
    description: string,
    createdById: number,
    collectionId: number,
    icon: string | null,
    iconWeight: string | null,
    color: string,
    url: string,
    textContent: string | null,
    preview: string,
    image: string | null,
    pdf: string | null,
    readable: string | null,
    monolith: string | null,
    lastPreserved: string | null,
    importDate: string,
    createdAt: string,
    updatedAt: string,
    tags: any[],
    collection: LinkwardenCollection,
    pinnedBy: number[]
}

// Class
// #################################################################################################

export class LinkwardenApiHandler extends ConfigurableComponent {

    private static _instance: LinkwardenApiHandler
    private _httpRequestHeaders: Headers
    private _httpRequestBaseUrl: string
    private _postRequestOptions: RequestInit
    private _getRequestOptions: RequestInit

    /**
     * Create a new ApiHandler for Linkwarden.
     */
    private constructor() {
        super()

        this._httpRequestHeaders = new Headers()
        this._httpRequestHeaders.append("Accept", "application/json")
        this._httpRequestHeaders.append("Authorization", "Bearer " + "")
    }

    /**
     * Get the singleton instance of the LinkwardenApiHandler.
     * @returns The singleton instance of the LinkwardenApiHandler.
     */
    public static getInstance(): LinkwardenApiHandler {
        if (!this._instance) {
            this._instance = new LinkwardenApiHandler()
        }

        return this._instance
    }

    /**
     * Update the settings for the LinkwardenApiHandler. This includes aspects, like the
     * base URL and the API key.
     * @param settings Logseq Linkwarden plugin settings
     */
    public configure(settings: PluginSettingsEntity): void {
        this._httpRequestBaseUrl = settings.linkwardenBaseUrl
        this._httpRequestHeaders.set("Authorization", "Bearer " + settings.linkwardenApiKey)

        this._getRequestOptions = {
            method: "GET",
            headers: this._httpRequestHeaders,
            redirect: "follow",
            mode: 'no-cors'
        }

        this._postRequestOptions = {
            method: "POST",
            headers: this._httpRequestHeaders,
            redirect: "follow",
            mode: 'no-cors'
        }
    }

    /**
     * Get one collection from Linkwarden by its name.
     * @param name Name of the collection.
     * @returns The collection object or an error message.
     */
    public getCollectionByName(name: string): Promise<LinkwardenCollection | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(
                    `${this._httpRequestBaseUrl}/api/v1/collections`, this._getRequestOptions
                )

                if (response.status === 401) {
                    let errorMessage = "Unauthorized to fetch collections from Linkwarden. "
                    errorMessage += "Please check your API key."
                    reject(errorMessage)
                }

                const data = await response.json()

                for (const collection of data.response) {
                    if (collection.name === name) {
                        resolve(collection as LinkwardenCollection)
                        return
                    }
                }

                reject("Couldn't find collection named: " + name)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Get all links in a collection.
     * @param collection Collection for which the links should be fetched.
     * @returns Array of links or an error message.
     */
    public getLinksInCollection(collection: LinkwardenCollection):
        Promise<LinkwardenLink[] | string> {

        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(
                    `${this._httpRequestBaseUrl}/api/v1/links/?collectionId=${collection.id}`,
                    this._getRequestOptions
                )
                const object = await response.json()
                resolve(object.response)
            } catch (error) {
                reject(error.message)
            }
        })
    }

    /**
     * Get the PDF for a Linkwarden link.
     * @param link Linkwarden link object, for which the PDF should be fetched.
     * @returns The PDF as a Blob or an error message.
     */
    public getPdfForLink(link: LinkwardenLink): Promise<Blob | string> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(
                    `${this._httpRequestBaseUrl}/api/v1/archives/${link.id}?format=2`,
                    this._getRequestOptions
                )

                if (!response.ok) {
                    reject("Failed to fetch PDF for link: " + link.name)
                    return
                }

                const blob = await response.blob()
                resolve(blob)
            } catch (_error) {
                reject("Failed to fetch PDF for link: " + link.name)
            }
        })
    }
}
