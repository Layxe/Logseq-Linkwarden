export let LINKWARDEN_BASE_URL = 'http://localhost:3000'

const LINKWARDEN_HEADERS = new Headers();
LINKWARDEN_HEADERS.append("Accept", "application/json");
LINKWARDEN_HEADERS.append("Authorization", "Bearer " + "");

export const LINKWARDEN_GET_REQ_OPTIONS: RequestInit = {
    method: "GET",
    headers: LINKWARDEN_HEADERS,
    redirect: "follow",
};

export const LINKWARDEN_POST_REQ_OPTIONS: RequestInit = {
    method: "POST",
    headers: LINKWARDEN_HEADERS,
    redirect: "follow"
};

export function updateApiSettings(settings: any) {
    LINKWARDEN_HEADERS.set("Authorization", "Bearer " + settings.linkwardenApiKey);
    LINKWARDEN_BASE_URL = settings.linkwardenBaseUrl;
}