import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";

export const global = {
    settings: {}
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
    }
]