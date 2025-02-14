import { LINKWARDEN_BASE_URL, LINKWARDEN_GET_REQ_OPTIONS } from "./linkwarden-api";

const STORAGE = logseq.Assets.makeSandboxStorage()

function sanitizeNameForPath(name: string) {
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

async function getAllCollections() {
    try {
        const response = await fetch(`${LINKWARDEN_BASE_URL}/api/v1/collections`, LINKWARDEN_GET_REQ_OPTIONS);

        if (response.status === 401) {
            logseq.UI.showMsg("Unauthorized to fetch collections from Linkwarden. Please check your API key.", "error");
            return [];
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        logseq.UI.showMsg("Failed to fetch collections from Linkwarden.", "error");
        return []
    }
}

export async function getCollectionByName(name: string) {
    const collections = await getAllCollections();

    if (collections.length === 0) {
        return null;
    }

    for (const collection of collections) {
        if (collection.name === name) {
            return collection;
        }
    }

    logseq.UI.showMsg("Couldn't find collection named: " + name, "error");

    return null;
}

export async function getAllLinksInCollection(collection) {
    const response = await fetch(`${LINKWARDEN_BASE_URL}/api/v1/links/?collectionId=${collection.id}`, LINKWARDEN_GET_REQ_OPTIONS)
    const object = await response.json()
    return object.response
}

export interface PDFInformation {
    name: string,
    nameWithoutExtension: string,
    filePath: string,
    markdownLink: string,
    collection: string,
    tags: LinkwardenTag[],
    linkwardenId: number
}

interface LinkwardenTag {
    createdAt: string,
    id: number,
    name: string,
    ownerId: number,
    updatedAt: string
}

/**
 * Fetches the PDF from the Linkwarden API and stores it in the Logseq storage.
 * @param link Link object from the Linkwarden API.
 * @returns PDFInformation object with the name, nameWithoutExtension and filePath.
 */
export async function fetchAndStorePdfFromLink(link) {
    // Get the PDF from the linkwarden archive.
    const response = await fetch(`${LINKWARDEN_BASE_URL}/api/v1/archives/${link.id}?format=2`, LINKWARDEN_GET_REQ_OPTIONS)

    if (!response.ok) {
        logseq.UI.showMsg(`Failed to fetch PDF for ${link.name}.`, "warning")
        return null
    }

    const pdfData = await response.blob();
    let name = link.name
    name = sanitizeNameForPath(name)

    // Add .pdf extension if not present.
    if (!name.endsWith('.pdf')) {
        name += '.pdf'
    }

    const nameWithoutPdf = name.replace('.pdf', '')

    const fileReader = new FileReader();
    fileReader.onload = () => STORAGE.setItem(name, fileReader.result as string)
    fileReader.readAsArrayBuffer(pdfData)

    const filePath = `../assets/storages/${logseq.baseInfo.id}/${name}`

    const pdfInformation: PDFInformation = {
        name: name,
        nameWithoutExtension: nameWithoutPdf,
        filePath: filePath,
        markdownLink: `![${nameWithoutPdf}](${filePath})`,
        collection: link.collection.name,
        tags: link.tags,
        linkwardenId: link.id
    }

    return pdfInformation
}