import { API_KEY } from "./api-key";

const LINKWARDEN_HEADERS = new Headers();
LINKWARDEN_HEADERS.append("Accept", "application/json");
LINKWARDEN_HEADERS.append("Authorization", "Bearer " + API_KEY);

export const LINKWARDEN_BASE_URL = 'http://192.168.178.144:3000'

export const LINKWARDEN_GET_REQ_OPTIONS: RequestInit = {
  method: "GET",
  headers: LINKWARDEN_HEADERS,
  redirect: "follow"
};

export const LINKWARDEN_POST_REQ_OPTIONS: RequestInit = {
  method: "POST",
  headers: LINKWARDEN_HEADERS,
  redirect: "follow"
};