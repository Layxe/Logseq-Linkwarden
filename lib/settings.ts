import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";
import { updateApiSettings } from "./linkwarden-api";

interface PluginSettings {
    linkwardenHeading: null,
    linkwardenBaseUrl: string,
    linkwardenApiKey: string
    linkwardenCustomProperties: string
}

export const global = {
    settings: {} as PluginSettings
}

export function updatePluginSettings(settings: any) {
    if (settings) {
        global.settings = settings
        updateApiSettings(settings)
    }
}

export const settingsConfig: SettingSchemaDesc[] = [
    {
        key: 'linkwardenHeading',
        title: 'General Settings',
        type: 'heading',
        default: null,
        description: ''
    },
    {
        key: 'linkwardenBaseUrl',
        title: 'Linkwarden Base URL',
        type: 'string',
        default: 'http://localhost:3000',
        description: 'The base URL of your Linkwarden instance.'
    },
    {
        key: 'linkwardenApiKey',
        title: 'Linkwarden API Key',
        type: 'string',
        default: '',
        description: 'API key for your Linkwarden account.'
    },
    {
        key: 'linkwardenCustomProperties',
        title: 'Custom Properties',
        type: 'string',
        default: 'year:: ❓;status:: 🟦 Pending',
        description: 'Custom properties for your Linkwarden links.'
    }
]