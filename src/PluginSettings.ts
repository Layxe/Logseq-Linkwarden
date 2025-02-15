import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user"
import { ConfigurableComponent } from "./ConfigurableComponent"

export interface PluginSettingsEntity {
    linkwardenHeading: null,
    linkwardenBaseUrl: string,
    linkwardenApiKey: string
    linkwardenCustomProperties: string
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

export class PluginSettings {

    private static _instance: PluginSettings
    private _settings: PluginSettingsEntity
    private _configurableComponents: ConfigurableComponent[] = []

    private constructor() {
        logseq.useSettingsSchema(settingsConfig)
        this.updateSettings(logseq.settings)

        logseq.onSettingsChanged(() => {
            if (logseq.settings) {
                this.updateSettings(logseq.settings)
            }
        })
     }

     private updateSettings(settings: any) {
        this._settings = settings

        this._configurableComponents.forEach(component => {
            component.configure(this._settings)
        })
     }

     private static getInstance(): PluginSettings {
        if (!this._instance) {
            this._instance = new PluginSettings()
        }

        return this._instance
     }

     public static registerConfigurableComponent(component: ConfigurableComponent) {
        this.getInstance()._configurableComponents.push(component)
     }

     public static getSettings(): PluginSettingsEntity {
        return this.getInstance()._settings
     }
}